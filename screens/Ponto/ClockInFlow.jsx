import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { colors, spacing, radius } from '../../theme';
import { useClockInFlow } from '../../hooks/useClockInFlow';

const AnimatedView = Animated.View;

function FacialScannerOverlay({ scanning, message, staticMode = false }) {
  const scanLine = useRef(new Animated.Value(0)).current;
  const scanLoop = useRef(null);

  useEffect(() => {
    const stopAnimations = () => {
      scanLoop.current?.stop();
    };

    if (scanning) {
      scanLine.setValue(0);
      scanLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLine, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scanLine, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      scanLoop.current.start();
    } else {
      stopAnimations();
      scanLine.setValue(0);
    }

    return () => {
      stopAnimations();
    };
  }, [scanning, scanLine]);

  const translateY = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [-90, 90],
  });

  const progressWidth = scanning ? '70%' : '100%';

  const containerStyle = staticMode ? styles.scannerOverlayStatic : styles.scannerOverlayActive;

  return (
    <View style={containerStyle} pointerEvents={staticMode ? 'auto' : 'none'}>
      <View style={styles.scannerOval}>
        <Ionicons name="person" size={staticMode ? 76 : 60} color="rgba(255,255,255,0.9)" />
      </View>
      {scanning && (
        <AnimatedView style={[styles.scanLine, { transform: [{ translateY }] }]} />
      )}
      <View style={styles.scannerMessageBox}>
        <Text style={styles.scannerMessageText}>{message}</Text>
      </View>
      <View style={styles.scannerProgressTrack}>
        <View style={[styles.scannerProgressFill, { width: progressWidth }]} />
      </View>
    </View>
  );
}

export default function ClockInFlowScreen({ navigation, route }) {
  const { jornada, pontosDoDia } = route.params || {};

  const flow = useClockInFlow({
    pontosPlanejados: pontosDoDia || [],
    jornada,
  });
  const cameraApi = flow.camera;

  useEffect(() => {
    flow.initializePermissions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      cameraApi.stopPreview();
    };
  }, [cameraApi.stopPreview]);

  const closeFlow = () => {
    navigation.goBack();
  };

  const getGeoStatusStyle = (inside) => ({
    color: inside ? colors.success : colors.danger,
    fontWeight: '600',
    marginTop: spacing.s,
  });

  const renderTypeStep = () => (
    <View>
      <Text style={styles.stepTitle}>Próximo ponto obrigatório</Text>
      <Text style={styles.stepSubtitle}>A jornada deve seguir a sequência definida. Caso não consiga registrar, pule e justificaremos no histórico.</Text>
      {flow.currentPoint ? (
        <>
          <View style={styles.currentPointCard}>
            <View style={styles.currentPointRow}>
              <Text style={styles.currentPointLabel}>Tipo</Text>
              <Text style={styles.currentPointValue}>{flow.currentPoint.tipo}</Text>
            </View>
            <View style={styles.currentPointRow}>
              <Text style={styles.currentPointLabel}>Horário previsto</Text>
              <Text style={styles.currentPointValue}>{flow.currentPoint.horario}</Text>
            </View>
            <View style={styles.currentPointRow}>
              <Text style={styles.currentPointLabel}>Status atual</Text>
              <Text style={[styles.currentPointValue, styles.tagPendente]}>Pendente</Text>
            </View>
          </View>
          {flow.skippedPoints.length > 0 && (
            <View style={styles.skippedContainer}>
              <Text style={styles.skippedTitle}>Pontos pulados</Text>
              <View style={styles.skippedTags}>
                {flow.skippedPoints.map((ponto) => (
                  <View key={ponto.id} style={styles.skippedTag}>
                    <Ionicons name="alert" size={14} color={colors.warning} />
                    <Text style={styles.skippedTagText}>{ponto.tipo}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <TouchableOpacity
            style={[styles.primaryButton, !flow.selectedType && styles.primaryButtonDisabled]}
            disabled={!flow.selectedType}
            onPress={flow.nextStep}
          >
            <Text style={styles.primaryButtonText}>Continuar para validações</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.emptyCard}>
            <Ionicons name="checkbox" size={28} color={colors.success} />
            <Text style={styles.emptyCardTitle}>Todos os pontos foram resolvidos hoje.</Text>
            <Text style={styles.emptyCardSubtitle}>Retorne ao dashboard para recarregar a jornada.</Text>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={closeFlow}>
            <Text style={styles.primaryButtonText}>Voltar ao Dashboard</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderFacialStep = () => {
    const isScanning =
      flow.facialResult.status === 'scanning' ||
      (flow.camera.isActive && (flow.facialResult.status === 'idle' || !flow.facialResult.status));
    const overlayMessage =
      flow.facialResult.status === 'scanning'
        ? 'Detectando pessoa real...'
        : flow.facialResult.message || 'Posicione seu rosto dentro do enquadramento iluminado.';

    return (
      <View>
        <Text style={styles.stepTitle}>Validação Facial</Text>
        <Text style={styles.stepSubtitle}>Mantenha o rosto centralizado e em boa iluminação.</Text>
        <View style={styles.cameraWrapper}>
          {flow.camera.permissionStatus === 'granted' ? (
            <View style={styles.scannerSurface}>
              <CameraView
                ref={flow.camera.cameraRef}
                style={styles.cameraPreview}
                facing={flow.camera.cameraType}
                isActive={flow.camera.isActive !== false}
              />
              <View style={styles.cameraDimmer} />
              <View style={styles.scannerTopBar} />
              <FacialScannerOverlay scanning={isScanning} message={overlayMessage} />
            </View>
          ) : (
            <View style={[styles.scannerSurface, styles.scannerPlaceholderSurface]}>
              <View style={styles.scannerPlaceholderGradient} />
              <View style={styles.scannerTopBar} />
              <View style={styles.placeholderContent}>
                <FacialScannerOverlay
                  scanning={false}
                  message="Permita o acesso à câmera para iniciar"
                  staticMode
                />
                <TouchableOpacity style={styles.permissionButton} onPress={flow.camera.requestPermission}>
                  <Text style={styles.permissionButtonText}>Conceder permissão</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      <TouchableOpacity style={styles.secondaryButton} onPress={flow.runFacialValidation}>
        <Text style={styles.secondaryButtonText}>
          {flow.facialResult.status === 'scanning' ? 'Processando...' : 'Validar reconhecimento'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.justifyLink} onPress={flow.skipFacialValidation}>
        <Text style={styles.justifyLinkText}>Pular facial e justificar</Text>
      </TouchableOpacity>
      {flow.facialResult.message && (
        <Text style={[styles.feedbackText, flow.facialResult.approved ? styles.feedbackSuccess : styles.feedbackError]}>
          {flow.facialResult.message}
        </Text>
      )}
      <TouchableOpacity
        style={[styles.primaryButton, !flow.facialResult.approved && styles.primaryButtonDisabled]}
        disabled={!flow.facialResult.approved}
        onPress={flow.nextStep}
      >
        <Text style={styles.primaryButtonText}>Avançar para GPS</Text>
      </TouchableOpacity>
      </View>
    );
  };

  const renderGeoStep = () => (
    <View>
      <Text style={styles.stepTitle}>Validação de Geolocalização</Text>
      <Text style={styles.stepSubtitle}>
        {flow.geoRequired
          ? 'Capturamos a sua posição e verificamos se está dentro da cerca autorizada.'
          : 'Esta jornada dispensou a validação obrigatória de GPS. Você pode prosseguir.'}
      </Text>
      {flow.gpsTargetLabel && (
        <Text style={[styles.stepSubtitle, { fontStyle: 'italic' }]}>Referência: {flow.gpsTargetLabel}</Text>
      )}
      <View style={styles.geoCard}>
        <Text style={styles.geoLabel}>Coordenadas</Text>
        <Text style={styles.geoValue}>{flow.geoResult.coordsLabel || 'Aguardando captura...'}</Text>
        <Text style={styles.geoLabel}>Distância até o centro</Text>
        <Text style={styles.geoValue}>{flow.geoResult.distance ? `${flow.geoResult.distance}m` : '--'}</Text>
        <Text style={getGeoStatusStyle(flow.geoResult.insideFence)}>
          {flow.geoResult.status === 'approved'
            ? 'Dentro da cerca liberada'
            : flow.geoResult.status === 'waived'
              ? 'Validação dispensada'
              : flow.geoResult.status === 'skipped'
                ? 'Justificado manualmente'
                : 'Fora da cerca ou não validado'}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.secondaryButton, !flow.geoRequired && styles.secondaryButtonDisabled]}
        onPress={flow.captureGeoValidation}
        disabled={!flow.geoRequired}
      >
        <Text style={styles.secondaryButtonText}>
          {flow.geoRequired
            ? flow.geoResult.status === 'requesting'
              ? 'Capturando...'
              : 'Capturar localização'
            : 'GPS dispensado'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.justifyLink, !flow.geoRequired && styles.justifyLinkDisabled]}
        onPress={flow.skipGeoValidation}
        disabled={!flow.geoRequired}
      >
        <Text style={[styles.justifyLinkText, !flow.geoRequired && styles.justifyLinkTextDisabled]}>Justificar ausência de GPS</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.primaryButton, !flow.geoResult.insideFence && styles.primaryButtonDisabled]}
        disabled={!flow.geoResult.insideFence}
        onPress={flow.nextStep}
      >
        <Text style={styles.primaryButtonText}>Avançar para resumo</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReviewStep = () => (
    <View>
      <Text style={styles.stepTitle}>Revise antes de confirmar</Text>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Tipo selecionado</Text>
        <Text style={styles.reviewValue}>{flow.selectedType}</Text>
      </View>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Facial</Text>
        <Text style={[styles.reviewValue, flow.facialResult.approved ? styles.feedbackSuccess : styles.feedbackError]}>
          {flow.facialResult.approved ? 'Aprovado' : 'Pendente'}
        </Text>
      </View>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>GPS</Text>
        <Text style={[styles.reviewValue, flow.geoResult.insideFence ? styles.feedbackSuccess : styles.feedbackError]}>
          {flow.geoResult.status === 'waived'
            ? 'Dispensado'
            : flow.geoResult.status === 'skipped'
              ? 'Justificado'
              : flow.geoResult.insideFence
                ? 'Dentro da área'
                : 'Fora da área'}
        </Text>
      </View>
      {flow.submissionError && <Text style={[styles.feedbackText, styles.feedbackError]}>{flow.submissionError}</Text>}
      <TouchableOpacity
        style={[styles.primaryButton, (!flow.canConfirm || flow.submissionStatus === 'loading') && styles.primaryButtonDisabled]}
        disabled={!flow.canConfirm || flow.submissionStatus === 'loading'}
        onPress={flow.confirmClockIn}
      >
        <Text style={styles.primaryButtonText}>
          {flow.submissionStatus === 'loading' ? 'Registrando...' : 'Confirmar marcação'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderReceiptStep = () => (
    <View>
      <Text style={styles.stepTitle}>Recibo da marcação</Text>
      <View style={styles.receiptCard}>
        <Text style={styles.receiptLabel}>NSR</Text>
        <Text style={styles.receiptValue}>{flow.receipt?.nsr}</Text>
        <Text style={styles.receiptLabel}>Tipo</Text>
        <Text style={styles.receiptValue}>{flow.receipt?.tipo}</Text>
        <Text style={styles.receiptLabel}>Horário</Text>
        <Text style={styles.receiptValue}>{flow.formatarHorario(flow.receipt?.horario)}</Text>
        <Text style={styles.receiptLabel}>Status</Text>
        <Text style={styles.receiptValue}>{flow.receipt?.offline ? 'Pendente de sincronização' : 'Sincronizado'}</Text>
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={closeFlow}>
        <Text style={styles.primaryButtonText}>Voltar ao Dashboard</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.secondaryButton, { marginTop: spacing.s }]}
        onPress={() => {
          flow.resetFlow();
          flow.goToStep(0);
        }}
      >
        <Text style={styles.secondaryButtonText}>Registrar outro ponto</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (flow.currentStep) {
      case 'tipo':
        return renderTypeStep();
      case 'facial':
        return renderFacialStep();
      case 'geo':
        return renderGeoStep();
      case 'review':
        return renderReviewStep();
      case 'receipt':
        return renderReceiptStep();
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.stepper}>
        {flow.steps.map((step, index) => (
          <View key={step} style={styles.stepperItem}>
            <View style={[styles.stepBullet, index <= flow.stepIndex && styles.stepBulletActive]}>
              <Text style={styles.stepBulletText}>{index + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, index === flow.stepIndex && styles.stepLabelActive]}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>{renderCurrentStep()}</View>

      {flow.stepIndex > 0 && flow.stepIndex < flow.steps.length - 1 && flow.currentStep !== 'receipt' && (
        <TouchableOpacity style={styles.linkButton} onPress={flow.prevStep}>
          <Text style={styles.linkButtonText}>Voltar etapa</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.linkButton} onPress={closeFlow}>
        <Text style={styles.linkButtonText}>Cancelar fluxo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.l, paddingBottom: spacing.xxl },
  stepper: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.l },
  stepperItem: { alignItems: 'center', flex: 1 },
  stepBullet: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  stepBulletActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepBulletText: { color: '#fff', fontWeight: '600' },
  stepLabel: { marginTop: spacing.s, color: colors.muted, textTransform: 'capitalize' },
  stepLabelActive: { color: colors.text, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: radius.l, padding: spacing.l },
  stepTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  stepSubtitle: { color: colors.muted, marginTop: spacing.s, marginBottom: spacing.m },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.m, marginBottom: spacing.l },
  typeCard: { flexBasis: '48%', borderWidth: 1, borderColor: colors.border, borderRadius: radius.m, padding: spacing.m },
  typeCardSelected: { borderColor: colors.primary, backgroundColor: '#EFF5FF' },
  typeLabel: { marginTop: spacing.s, fontWeight: '600', color: colors.text },
  recommendedTag: { marginTop: spacing.xs, fontSize: 12, color: colors.primary },
  primaryButton: { backgroundColor: colors.primary, borderRadius: radius.m, paddingVertical: spacing.m, alignItems: 'center', marginTop: spacing.l },
  primaryButtonDisabled: { backgroundColor: colors.border },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: { borderRadius: radius.m, borderWidth: 1, borderColor: colors.primary, paddingVertical: spacing.m, alignItems: 'center', marginTop: spacing.m },
  secondaryButtonDisabled: { opacity: 0.6 },
  secondaryButtonText: { color: colors.primary, fontWeight: '600' },
  cameraWrapper: { width: '100%', minHeight: 420, borderRadius: radius.l, marginBottom: spacing.l },
  scannerSurface: { flex: 1, minHeight: '100%', borderRadius: radius.l, overflow: 'hidden', borderWidth: 1, borderColor: '#09213a', backgroundColor: '#041225', position: 'relative' },
  scannerPlaceholderSurface: { padding: spacing.l },
  scannerPlaceholderGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: '#041a2f' },
  placeholderContent: { flex: 1, justifyContent: 'space-between' },
  cameraPreview: { flex: 1 },
  cameraDimmer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2, 10, 18, 0.55)' },
  scannerTopBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#23d7ff', zIndex: 2 },
  scannerOverlayActive: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: spacing.l, zIndex: 3 },
  scannerOverlayStatic: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.l },
  scannerOval: { width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderColor: 'rgba(36, 221, 255, 0.8)', backgroundColor: 'rgba(4, 25, 43, 0.65)', alignItems: 'center', justifyContent: 'center' },
  scanLine: { position: 'absolute', width: '70%', height: 2, backgroundColor: '#2bf9ff', shadowColor: '#2bf9ff', shadowOpacity: 0.6, shadowRadius: 10, opacity: 0.9 },
  scannerMessageBox: { marginTop: spacing.l },
  scannerMessageText: { color: '#c3e8ff', fontWeight: '600', letterSpacing: 0.5, textAlign: 'center' },
  scannerProgressTrack: { height: 6, width: '100%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginTop: spacing.m, overflow: 'hidden' },
  scannerProgressFill: { height: '100%', backgroundColor: '#22d7ff', borderRadius: 4 },
  permissionButton: { alignSelf: 'center', marginTop: spacing.l, paddingVertical: spacing.m, paddingHorizontal: spacing.xl, borderRadius: radius.m, backgroundColor: colors.primary },
  permissionButtonText: { color: '#fff', fontWeight: '600', letterSpacing: 0.5 },
  feedbackText: { marginTop: spacing.s, fontWeight: '600' },
  feedbackSuccess: { color: colors.success },
  feedbackError: { color: colors.danger },
  geoCard: { backgroundColor: '#F7F9FC', borderRadius: radius.m, padding: spacing.m },
  geoLabel: { color: colors.muted, textTransform: 'uppercase', fontSize: 12 },
  geoValue: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.s },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.m },
  reviewLabel: { color: colors.muted },
  reviewValue: { fontWeight: '600' },
  receiptCard: { backgroundColor: '#F7F9FC', borderRadius: radius.m, padding: spacing.m, marginBottom: spacing.l, marginTop: spacing.m },
  receiptLabel: { color: colors.muted, marginTop: spacing.s },
  receiptValue: { fontSize: 18, fontWeight: '600', color: colors.text },
  linkButton: { marginTop: spacing.m, alignItems: 'center' },
  linkButtonText: { color: colors.muted, textDecorationLine: 'underline' },
  justifyLink: { marginTop: spacing.s, alignItems: 'center' },
  justifyLinkDisabled: { opacity: 0.6 },
  justifyLinkText: { color: colors.danger, textDecorationLine: 'underline', fontWeight: '600' },
  justifyLinkTextDisabled: { color: colors.muted },
  currentPointCard: { backgroundColor: '#F7F9FC', borderRadius: radius.m, padding: spacing.m, marginTop: spacing.m },
  currentPointRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.s },
  currentPointLabel: { color: colors.muted, fontSize: 13, textTransform: 'uppercase' },
  currentPointValue: { fontSize: 18, fontWeight: '600', color: colors.text },
  tagPendente: { color: colors.warning },
  skippedContainer: { marginTop: spacing.m },
  skippedTitle: { fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  skippedTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  skippedTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5E6', borderRadius: radius.s, paddingHorizontal: spacing.s, paddingVertical: spacing.xs },
  skippedTagText: { marginLeft: spacing.xs, color: colors.warning, fontWeight: '600' },
  emptyCard: { backgroundColor: '#F0FFF3', borderRadius: radius.m, padding: spacing.l, alignItems: 'center', marginTop: spacing.l },
  emptyCardTitle: { fontWeight: '600', color: colors.text, marginTop: spacing.s, textAlign: 'center' },
  emptyCardSubtitle: { color: colors.muted, marginTop: spacing.xs, textAlign: 'center' },
});
