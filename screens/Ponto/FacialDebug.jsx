import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform, Image } from 'react-native';
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useCameraFlow } from '../../hooks/Camera';
import { verificarFacial } from '../../services/RegistroPontoService';
import { colors, spacing, radius } from '../../theme';
import { CURRENT_USER_ID } from '../../api/api';

const formatJson = (obj) => {
  if (!obj) return '';
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    return String(obj);
  }
};

export default function FacialDebugScreen() {
  const camera = useCameraFlow();
  const [usuId, setUsuId] = useState(String(CURRENT_USER_ID));
  const [minMatch, setMinMatch] = useState('75');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [lastPayload, setLastPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [galleryReview, setGalleryReview] = useState(null);

  const parsedUsuId = useMemo(() => {
    const value = parseInt(usuId, 10);
    return Number.isFinite(value) ? value : CURRENT_USER_ID;
  }, [usuId]);

  const parsedThreshold = useMemo(() => {
    const value = parseFloat(minMatch);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
    return 70;
  }, [minMatch]);

  const runVerification = useCallback(
    async (base64Source, originLabel) => {
      setLoading(true);
      setStatus('sending');
      setResult(null);
      setError(null);
      const payloadSnapshot = {
        usu_id: parsedUsuId,
        minimo_match: parsedThreshold,
        origin: originLabel,
        timestamp: new Date().toISOString(),
      };
      setLastPayload(payloadSnapshot);
      try {
        const response = await verificarFacial(base64Source, parsedThreshold, parsedUsuId);
        setResult({ ...response, testedAt: new Date().toISOString(), origin: originLabel });
        setStatus('success');
      } catch (err) {
        setError(err?.message || 'Falha ao verificar facial.');
        setStatus('error');
      } finally {
        setLoading(false);
      }
    },
    [parsedThreshold, parsedUsuId]
  );

  const handleCapture = useCallback(async () => {
    setGalleryReview(null);
    const granted = await camera.startPreview();
    if (!granted) {
      setError('Permissão de câmera negada.');
      return;
    }
    try {
      const snapshot = await camera.captureSnapshot();
      setCapturedPreview(snapshot?.uri || null);
      await runVerification(snapshot.base64, 'camera');
    } catch (err) {
      setError(err?.message || 'Erro ao capturar imagem.');
    } finally {
      camera.stopPreview();
    }
  }, [camera, runVerification]);

  const handleGalleryPick = useCallback(async () => {
    setCapturedPreview(null);
    const { status: libStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (libStatus !== 'granted') {
      setError('Permissão para acessar a galeria foi negada.');
      return;
    }
    const resultPicker = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      quality: 0.8,
    });
    if (resultPicker.canceled || !resultPicker.assets?.length) {
      return;
    }
    const asset = resultPicker.assets[0];
    if (!asset.base64) {
      setError('Não foi possível ler a imagem selecionada.');
      return;
    }
    const mimeType = asset.type || 'image/jpeg';
    const base64Data = `data:${mimeType};base64,${asset.base64}`;
    setGalleryReview(asset.uri || null);
    await runVerification(base64Data, 'galeria');
  }, [runVerification]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Laboratório de Reconhecimento Facial</Text>
      <Text style={styles.subtitle}>
        Use esta área para capturar imagens, disparar o endpoint `/ponto/facial/verify` e visualizar exatamente o que a API está retornando.
      </Text>

      <View style={styles.formRow}>
        <View style={styles.formControl}>
          <Text style={styles.label}>usu_id</Text>
          <TextInput
            value={usuId}
            onChangeText={setUsuId}
            keyboardType="numeric"
            placeholder="ID do usuário"
            style={styles.input}
          />
        </View>
        <View style={styles.formControl}>
          <Text style={styles.label}>Mínimo (%)</Text>
          <TextInput
            value={minMatch}
            onChangeText={setMinMatch}
            keyboardType="numeric"
            placeholder="70"
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.cameraWrapper}>
        <CameraView
          ref={camera.cameraRef}
          style={styles.cameraPreview}
          facing={camera.cameraType}
          isActive={camera.isActive}
        />
        {!camera.isActive && (
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraOverlayText}>
              Pressione “Capturar com câmera” para ligar a pré-visualização.
            </Text>
          </View>
        )}
      </View>

      {(capturedPreview || galleryReview) && (
        <View style={styles.previewStrip}>
          <Text style={styles.label}>Última imagem enviada</Text>
          <Image
            source={{ uri: capturedPreview || galleryReview }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleCapture} disabled={loading}>
          {loading && status === 'sending' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Capturar com câmera</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleGalleryPick} disabled={loading}>
          <Text style={styles.secondaryButtonText}>Enviar da galeria</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.statusText}>Estado atual: {status}</Text>
        {loading && <ActivityIndicator style={styles.statusIndicator} color={colors.primary} />}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {result ? (
          <View style={styles.resultBlock}>
            <Text style={styles.resultTitle}>Última resposta ({result.origin})</Text>
            <Text style={styles.resultText}>approved: {String(result.approved)}</Text>
            <Text style={styles.resultText}>matchScore: {result.matchScore}</Text>
            <Text style={styles.resultText}>threshold: {result.threshold}</Text>
            <Text style={styles.resultText}>strategy: {result.strategy}</Text>
            {result.message ? <Text style={styles.resultText}>message: {result.message}</Text> : null}
          </View>
        ) : null}
      </View>

      <View style={styles.jsonCard}>
        <Text style={styles.sectionTitle}>Último payload enviado</Text>
        <Text style={styles.jsonText}>{formatJson(lastPayload) || '---'}</Text>
      </View>

      <View style={styles.jsonCard}>
        <Text style={styles.sectionTitle}>Resposta completa / erro</Text>
        <Text style={styles.jsonText}>{formatJson(result || (error ? { error } : null)) || '---'}</Text>
      </View>

      <View style={styles.helperCard}>
        <Text style={styles.sectionTitle}>Dicas rápidas</Text>
        <Text style={styles.helperText}>• 404 com mensagem “Usuário não possui biometria” significa que o colaborador ainda não tem foto/assinatura salva. Use o fluxo de cadastro/edição completo para enviar `usu_foto_base64`.</Text>
        <Text style={styles.helperText}>• Use este laboratório para confirmar se a foto capturada chega como base64 válido antes de executar o fluxo real.</Text>
        <Text style={styles.helperText}>• Em produção, remova ou proteja esta tela por trás de uma permissão específica.</Text>
        {Platform.OS === 'web' && (
          <Text style={styles.helperText}>• No navegador, conceda permissão de câmera e use HTTPS sempre que possível.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.l,
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.s,
  },
  subtitle: {
    color: colors.muted,
    marginBottom: spacing.l,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.l,
    marginBottom: spacing.l,
  },
  formControl: {
    flex: 1,
  },
  label: {
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.m,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    backgroundColor: '#fff',
  },
  cameraWrapper: {
    height: 260,
    borderRadius: radius.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.m,
  },
  cameraPreview: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.l,
  },
  cameraOverlayText: {
    color: '#fff',
    textAlign: 'center',
  },
  previewStrip: {
    marginBottom: spacing.l,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: radius.m,
    marginTop: spacing.s,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.m,
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#fff',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: radius.l,
    padding: spacing.l,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.s,
  },
  statusText: {
    color: colors.muted,
    marginBottom: spacing.s,
  },
  statusIndicator: {
    marginBottom: spacing.s,
  },
  errorText: {
    color: colors.danger,
    fontWeight: '600',
  },
  resultBlock: {
    marginTop: spacing.m,
    backgroundColor: '#f7f8fa',
    borderRadius: radius.m,
    padding: spacing.m,
  },
  resultTitle: {
    fontWeight: '600',
    marginBottom: spacing.s,
  },
  resultText: {
    color: colors.text,
    marginBottom: 2,
  },
  jsonCard: {
    backgroundColor: '#fff',
    borderRadius: radius.l,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.l,
  },
  jsonText: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    color: '#333',
    fontSize: 13,
  },
  helperCard: {
    backgroundColor: '#fff',
    borderRadius: radius.l,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  helperText: {
    color: colors.muted,
    marginBottom: spacing.s,
  },
});
