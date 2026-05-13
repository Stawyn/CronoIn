import { useCallback, useMemo, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useGPS, formatCoords } from './GPS';
import { useCameraFlow } from './Camera';
import { DEFAULT_SECURITY_SETTINGS, SECURITY_CENTER_COORDS } from '../config/security';
import { marcarPontoIndividual, pularPonto, obterHorarioServidor, verificarFacial } from '../services/RegistroPontoService';

const STEPS = ['tipo', 'facial', 'geo', 'review', 'receipt'];
const TIPO_PADRAO = ['Entrada', 'Inicio Intervalo', 'Fim Intervalo', 'Saida'];
const PHOTO_REFERENCE_SUCCESS_MESSAGE = 'Comparação realizada usando a foto cadastrada do usuário.';

const normalizarStatus = (status) => (status || 'pendente').toUpperCase();

const gerarNSR = () => `NSR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 999)}`;

const formatarHorario = (dataISO) => {
  if (!dataISO) return '--:--';
  const data = new Date(dataISO);
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export function useClockInFlow({ pontosPlanejados = [], jornada } = {}) {
  const primeirasOpcoes = useMemo(() => {
    const tiposDaJornada = pontosPlanejados.map((p) => p.tipo);
    return [...new Set([...tiposDaJornada, ...TIPO_PADRAO])];
  }, [pontosPlanejados]);

  const [flowPoints, setFlowPoints] = useState(() => pontosPlanejados.map((ponto, idx) => ({ ...ponto, ordem: idx })));

  useEffect(() => {
    setFlowPoints(pontosPlanejados.map((ponto, idx) => ({ ...ponto, ordem: idx })));
  }, [pontosPlanejados]);

  const currentPoint = useMemo(
    () => flowPoints.find((p) => normalizarStatus(p.status) === 'PENDENTE'),
    [flowPoints]
  );

  const skippedPoints = useMemo(
    () => flowPoints.filter((p) => normalizarStatus(p.status) === 'PULADO'),
    [flowPoints]
  );

  const recomendado = currentPoint?.tipo || primeirasOpcoes[0];

  const [stepIndex, setStepIndex] = useState(0);
  const [selectedType, setSelectedType] = useState(recomendado);
  const [facialResult, setFacialResult] = useState({ status: 'idle' });
  const [geoResult, setGeoResult] = useState({ status: 'idle' });
  const [submissionStatus, setSubmissionStatus] = useState('idle');
  const [submissionError, setSubmissionError] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [skipStatus, setSkipStatus] = useState('idle');
  const [skipError, setSkipError] = useState(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [serverClock, setServerClock] = useState('--:--:--');
  const [serverSyncStatus, setServerSyncStatus] = useState('idle');
  const [lastServerSync, setLastServerSync] = useState(null);

  const gpsPolicy = useMemo(() => {
    if (!jornada) return null;
    const enabled = Boolean(jornada.cad_ponto_gps_enabled);
    const lat = Number(jornada.cad_ponto_gps_center_lat);
    const lng = Number(jornada.cad_ponto_gps_center_lng);
    const radius = Number(jornada.cad_ponto_gps_radius_m);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
    return {
      enabled,
      center: hasCoords
        ? { latitude: lat, longitude: lng, label: jornada.cad_ponto_nome || SECURITY_CENTER_COORDS.label }
        : SECURITY_CENTER_COORDS,
      radius: Number.isFinite(radius) && radius > 0 ? radius : DEFAULT_SECURITY_SETTINGS.fenceRadiusMeters,
    };
  }, [jornada]);

  const securitySettings = useMemo(() => ({
    ...DEFAULT_SECURITY_SETTINGS,
    requireGeo: gpsPolicy ? Boolean(gpsPolicy.enabled) : DEFAULT_SECURITY_SETTINGS.requireGeo,
    fenceRadiusMeters: gpsPolicy?.radius || DEFAULT_SECURITY_SETTINGS.fenceRadiusMeters,
  }), [gpsPolicy]);

  const gpsCenter = gpsPolicy?.center || SECURITY_CENTER_COORDS;

  const gps = useGPS({
    center: gpsCenter,
    radiusMeters: securitySettings.fenceRadiusMeters,
    detectMock: securitySettings.detectGpsMock,
  });
  const camera = useCameraFlow();

  useEffect(() => {
    if (STEPS[stepIndex] !== 'facial') {
      camera.stopPreview();
      return undefined;
    }

    let isMounted = true;
    const ensurePreview = async () => {
      try {
        await camera.startPreview();
      } catch (previewError) {
        console.warn('Falha ao iniciar a pré-visualização da câmera.', previewError);
      }
    };

    ensurePreview();

    return () => {
      if (isMounted) {
        camera.stopPreview();
      }
      isMounted = false;
    };
  }, [camera, stepIndex]);

  const getServerNow = useCallback(() => new Date(Date.now() + serverOffsetMs), [serverOffsetMs]);

  const syncServerTime = useCallback(async () => {
    setServerSyncStatus('loading');
    try {
      const resposta = await obterHorarioServidor();
      const iso = resposta?.server_time || resposta?.serverTime;
      if (!iso) {
        setServerSyncStatus('error');
        throw new Error('Resposta sem timestamp do servidor.');
      }
      const serverDate = new Date(iso);
      setServerOffsetMs(serverDate.getTime() - Date.now());
      setLastServerSync(serverDate.toISOString());
      setServerSyncStatus('success');
      return serverDate;
    } catch (error) {
      setServerSyncStatus('error');
      console.warn('Falha ao sincronizar horário com o servidor.', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    const atualizar = () => {
      if (!ativo) return;
      const agora = getServerNow();
      setServerClock(
        agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    atualizar();
    const timer = setInterval(atualizar, 1000);
    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, [getServerNow]);

  useEffect(() => {
    let cancelado = false;
    let timeoutId = null;
    const sincronizarLoop = async () => {
      try {
        await syncServerTime();
      } catch (_err) {
        // Apenas registra; a UI exibirá status de erro
      }
      if (cancelado) return;
      timeoutId = setTimeout(sincronizarLoop, 60000);
    };
    sincronizarLoop();
    return () => {
      cancelado = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [syncServerTime]);

  const montarMetadataEnvio = useCallback(
    (extras = {}) => {
      const serverDate = getServerNow();
      return {
        ...extras,
        serverTime: serverDate?.toISOString?.() || null,
        deviceTime: new Date().toISOString(),
        device: `${Platform.OS} ${Platform.Version || ''}`.trim(),
      };
    },
    [getServerNow]
  );

  const facialMetadata = useCallback(() => {
    if (!facialResult || !facialResult.status || facialResult.status === 'idle') return null;
    return {
      status: facialResult.status,
      matchScore: facialResult.matchScore ?? null,
      livenessScore: facialResult.livenessScore ?? null,
      facesDetected: facialResult.facesDetected ?? null,
      evidenceUrl: facialResult.evidenceUrl || null,
      strategy: facialResult.strategy || null,
      approved: Boolean(facialResult.approved),
      overrideReason: facialResult.overrideReason || null,
      threshold: facialResult.threshold ?? null,
      fallbackReason: facialResult.fallbackReason || null,
      timestamp: facialResult.timestamp || null,
    };
  }, [facialResult]);

  const gpsMetadata = useCallback(() => {
    if (!geoResult || !geoResult.status || geoResult.status === 'idle') return null;
    return {
      status: geoResult.status,
      distance: geoResult.distance ?? null,
      coords: geoResult.coords || null,
      coordsLabel: geoResult.coordsLabel || null,
      insideFence: geoResult.insideFence ?? null,
      mocked: geoResult.mocked ?? null,
      evidenceUrl: geoResult.evidenceUrl || null,
      overrideReason: geoResult.overrideReason || null,
      timestamp: geoResult.timestamp || null,
    };
  }, [geoResult]);

  const initializePermissions = useCallback(async () => {
    const [cameraOk, gpsOk] = await Promise.all([
      camera.requestPermission(),
      gps.requestPermission(),
    ]);
    return cameraOk && gpsOk;
  }, [camera, gps]);

  useEffect(() => {
    setSelectedType(recomendado || null);
  }, [recomendado]);

  useEffect(() => {
    if (!securitySettings.requireGeo) {
      setGeoResult((prev) => {
        if (prev?.status === 'waived') return prev;
        return {
          status: 'waived',
          message: 'Validação de GPS dispensada pela jornada.',
          insideFence: true,
          coords: null,
          coordsLabel: gpsCenter.label,
          distance: null,
          simulated: false,
          timestamp: new Date().toISOString(),
        };
      });
    } else {
      setGeoResult((prev) => (prev?.status === 'waived' ? { status: 'idle' } : prev));
    }
  }, [gpsCenter.label, securitySettings.requireGeo]);

  const selectType = useCallback((tipo) => {
    setSelectedType(tipo);
  }, []);

  const nextStep = useCallback(() => {
    setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
  }, []);

  const prevStep = useCallback(() => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((indice) => {
    setStepIndex(() => Math.min(Math.max(indice, 0), STEPS.length - 1));
  }, []);

  const runFacialValidation = useCallback(async () => {
    setFacialResult({ status: 'scanning', message: 'Capturando rosto...' });
    const granted = await camera.startPreview();
    if (!granted) {
      setFacialResult({ status: 'error', message: 'Permissão de câmera negada.' });
      return false;
    }

    try {
      const captura = await camera.captureSnapshot();
      const minimo = securitySettings.minMatchThreshold || 70;
      const resposta = await verificarFacial(captura.base64, minimo);
      const aprovado = Boolean(resposta?.approved);
      const mensagemApi = resposta?.message || (aprovado ? 'Face verificada com sucesso.' : 'Reconhecimento facial reprovado.');
      const sucessoPorFoto = aprovado && mensagemApi === PHOTO_REFERENCE_SUCCESS_MESSAGE;
      const resultado = {
        status: aprovado ? 'approved' : 'reproved',
        message: sucessoPorFoto ? 'Sucesso! Comparação realizada usando a foto cadastrada do usuário.' : mensagemApi,
        matchScore: resposta?.matchScore ?? 0,
        threshold: resposta?.threshold ?? minimo,
        evidenceUrl: resposta?.evidenceUrl || null,
        strategy: resposta?.strategy || 'encoding',
        facesDetected: resposta?.facesDetected ?? null,
        fallbackReason: resposta?.fallbackReason || null,
        approved: aprovado,
        timestamp: new Date().toISOString(),
      };
      setFacialResult(resultado);
      if (sucessoPorFoto) {
        setTimeout(() => {
          nextStep();
        }, 300);
      }
      return resultado;
    } catch (error) {
      const mensagem = error?.message || 'Erro ao validar reconhecimento facial.';
      setFacialResult({ status: 'error', message: mensagem, approved: false });
      return null;
    } finally {
      camera.stopPreview();
    }
  }, [camera, nextStep, securitySettings.minMatchThreshold]);

  const skipFacialValidation = useCallback((reason = '') => {
    camera.stopPreview();
    const resultado = {
      status: 'waived',
      message: reason || 'Reconhecimento facial dispensado. Pendência registrada.',
      matchScore: null,
      livenessScore: null,
      facesDetected: null,
      evidenceUrl: null,
      strategy: 'waived',
      approved: true,
      overrideReason: reason || null,
      timestamp: new Date().toISOString(),
    };
    setFacialResult(resultado);
    return resultado;
  }, [camera]);

  const captureGeoValidation = useCallback(async () => {
    if (!securitySettings.requireGeo) {
      const isWaived = {
        status: 'waived',
        message: 'Validação dispensada por configuração da jornada.',
        coords: null,
        coordsLabel: gpsCenter.label,
        distance: null,
        insideFence: true,
        simulated: false,
        mocked: false,
        timestamp: new Date().toISOString(),
      };
      setGeoResult(isWaived);
      return isWaived;
    }

    setGeoResult({ status: 'requesting', message: 'Capturando localização...' });

    const allowed = await gps.requestPermission();
    if (!allowed) {
      setGeoResult({ status: 'error', message: 'Permissão de localização negada.' });
      return null;
    }

    const medicao = await gps.captureLocation();
    if (!medicao) {
      setGeoResult({ status: 'error', message: 'Não foi possível capturar a localização.' });
      return null;
    }

    const coordsLabel = formatCoords(medicao.coords) || gpsCenter.label;
    const dentro = Boolean(medicao.insideFence);
    const resultado = {
      status: dentro ? 'approved' : 'blocked',
      message: dentro ? 'Dentro da cerca autorizada.' : 'Fora do perímetro configurado.',
      coords: medicao.coords,
      coordsLabel,
      distance: medicao.distance,
      insideFence: dentro,
      simulated: false,
      mocked: medicao.mocked,
      timestamp: new Date().toISOString(),
    };

    setGeoResult(resultado);
    return resultado;
  }, [gps, gpsCenter, securitySettings.requireGeo]);

  const skipGeoValidation = useCallback((reason = '') => {
    const resultado = {
      status: 'skipped',
      message: reason || 'GPS dispensado manualmente. Pendência registrada.',
      coords: null,
      coordsLabel: gpsCenter.label,
      distance: null,
      insideFence: true,
      simulated: false,
      mocked: false,
      overrideReason: reason || null,
      timestamp: new Date().toISOString(),
    };
    setGeoResult(resultado);
    return resultado;
  }, [gpsCenter.label]);

  const canConfirm = useMemo(() => {
    const facialOk =
      !securitySettings.requireFacial || facialResult.approved || facialResult.status === 'waived';
    const geoOk =
      !securitySettings.requireGeo ||
      geoResult.insideFence ||
      ['waived', 'skipped'].includes(geoResult.status);
    return Boolean(selectedType && facialOk && geoOk);
  }, [facialResult, geoResult, securitySettings.requireFacial, securitySettings.requireGeo, selectedType]);

  const skipCurrentPoint = useCallback(async (motivo = '') => {
    if (!currentPoint) return false;
    setSkipStatus('loading');
    setSkipError(null);
    try {
      const metadataPayload = montarMetadataEnvio({
        facial: facialMetadata(),
        gps: gpsMetadata(),
        skipReason: motivo || null,
      });
      await pularPonto(currentPoint.tipo, jornada?.cad_id, motivo, metadataPayload);
      setFlowPoints((prev) =>
        prev.map((ponto) =>
          ponto.id === currentPoint.id ? { ...ponto, status: 'PULADO', puladoEm: new Date().toISOString() } : ponto
        )
      );
      setSkipStatus('success');
      return true;
    } catch (error) {
      setSkipStatus('error');
      setSkipError(error.message || 'Erro ao pular ponto.');
      return false;
    }
  }, [currentPoint, facialMetadata, gpsMetadata, jornada?.cad_id, montarMetadataEnvio]);

  const confirmClockIn = useCallback(async () => {
    if (!canConfirm || submissionStatus === 'loading') return null;
    setSubmissionStatus('loading');
    setSubmissionError(null);

    try {
      let resposta = null;
      let serverTimestamp = getServerNow();
      try {
        const atualizado = await syncServerTime();
        if (atualizado) {
          serverTimestamp = atualizado;
        }
      } catch (_error) {
        // Mantém último offset conhecido
      }
      const metadataPayload = montarMetadataEnvio({
        facial: facialMetadata(),
        gps: gpsMetadata(),
      });
      resposta = await marcarPontoIndividual(selectedType, jornada?.cad_id, metadataPayload);

      const recibo = {
        nsr: resposta?.nsr || gerarNSR(),
        mensagem: resposta?.mensagem || 'Ponto registrado com sucesso.',
        horario: serverTimestamp?.toISOString?.() || new Date().toISOString(),
        tipo: selectedType,
        offline: Boolean(resposta?.offline),
        geo: geoResult,
        facial: facialResult,
      };

      setReceipt(recibo);
      setSubmissionStatus('success');
      goToStep(STEPS.length - 1);
      return recibo;
    } catch (error) {
      setSubmissionStatus('error');
      setSubmissionError(error.message || 'Erro ao registrar ponto.');
      return null;
    }
  }, [canConfirm, facialMetadata, facialResult, geoResult, getServerNow, goToStep, gpsMetadata, jornada?.cad_id, montarMetadataEnvio, selectedType, submissionStatus, syncServerTime]);

  const resetFlow = useCallback(() => {
    setStepIndex(0);
    setFacialResult({ status: 'idle' });
    setGeoResult({ status: 'idle' });
    setReceipt(null);
    setSubmissionStatus('idle');
    setSubmissionError(null);
    setSelectedType(recomendado);
  }, [recomendado]);

  return {
    steps: STEPS,
    currentStep: STEPS[stepIndex],
    stepIndex,
    availableTypes: currentPoint ? [currentPoint.tipo] : [],
    recommendedType: recomendado,
    selectedType,
    facialResult,
    geoResult,
    currentPoint,
    skippedPoints,
    skipCurrentPoint,
    skipStatus,
    skipError,
    canConfirm,
    submissionStatus,
    submissionError,
    receipt,
    serverClock,
    serverSyncStatus,
    lastServerSync,
    gps,
    camera,
    geoRequired: securitySettings.requireGeo,
    gpsTargetLabel: gpsCenter.label,
    initializePermissions,
    selectType,
    nextStep,
    prevStep,
    goToStep,
    runFacialValidation,
    skipFacialValidation,
    captureGeoValidation,
    skipGeoValidation,
    confirmClockIn,
    resetFlow,
    formatarHorario,
    syncServerTime,
    securitySettings,
  };
}
