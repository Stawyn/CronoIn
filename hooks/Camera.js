import { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import { Camera, CameraType } from 'expo-camera';

const resolveCameraType = () => {
	const frontFromCameraType = CameraType?.front;
	const frontFromConstants = Camera?.Constants?.Type?.front;
	const frontFromType = Camera?.Type?.front;
	return frontFromCameraType || frontFromConstants || frontFromType || 'front';
};

export function useCameraFlow() {
	const cameraRef = useRef(null);
	const [permissionStatus, setPermissionStatus] = useState(null);
	const [isActive, setIsActive] = useState(false);
	const [error, setError] = useState(null);
	const defaultCameraType = useMemo(() => resolveCameraType(), []);

	useEffect(() => {
		let mounted = true;
		const syncExistingPermission = async () => {
			try {
				const current = await Camera.getCameraPermissionsAsync();
				if (!mounted) return;
				setPermissionStatus(current?.status || null);
			} catch (err) {
				console.warn('Não foi possível ler o status atual da câmera.', err);
			}
		};
		syncExistingPermission();
		return () => {
			mounted = false;
		};
	}, []);

	const requestPermission = useCallback(async () => {
		try {
			const { status } = await Camera.requestCameraPermissionsAsync();
			setPermissionStatus(status);
			if (status !== 'granted') {
				setError('Permissão de câmera negada.');
				return false;
			}
			setError(null);
			return true;
		} catch (err) {
			console.error('Erro ao solicitar permissão da câmera', err);
			setError('Não foi possível solicitar a permissão da câmera.');
			return false;
		}
	}, []);

	const startPreview = useCallback(async () => {
		if (permissionStatus !== 'granted') {
			const granted = await requestPermission();
			if (!granted) return false;
		}
		setIsActive(true);
		return true;
	}, [permissionStatus, requestPermission]);

	const stopPreview = useCallback(() => {
		setIsActive(false);
	}, []);

	const captureSnapshot = useCallback(async (options = {}) => {
		if (!cameraRef.current) {
			throw new Error('A câmera ainda não foi inicializada.');
		}

		const { quality = 0.6 } = options;
		const resultado = await cameraRef.current.takePictureAsync({
			base64: true,
			quality,
			skipProcessing: true,
		});

		if (!resultado?.base64) {
			throw new Error('Não foi possível capturar a imagem da câmera.');
		}

		let mimeType = 'image/jpeg';
		let rawPayload = resultado.base64;
		// On web the base64 field already comes as a data URI, so strip the header before sanitizing.
		if (typeof rawPayload === 'string' && rawPayload.includes(',')) {
			const [header, body] = rawPayload.split(',', 2);
			if (body) {
				rawPayload = body;
				const mimeMatch = header.match(/data:(.*?);/);
				if (mimeMatch?.[1]) {
					mimeType = mimeMatch[1];
				}
			}
		}

		const sanitized = rawPayload.replace(/[^A-Za-z0-9+/=]/g, '');
		const sanitizedRemainder = sanitized.length % 4;
		const paddingLength = sanitizedRemainder === 0 ? 0 : 4 - sanitizedRemainder;
		const base = sanitized.padEnd(sanitized.length + paddingLength, '=');

		const payload = `data:${mimeType};base64,${base}`;
		return {
			...resultado,
			base64: payload,
		};
	}, []);

	return {
		cameraRef,
		permissionStatus,
		isActive,
		error,
		requestPermission,
		startPreview,
		stopPreview,
		cameraType: defaultCameraType,
		captureSnapshot,
	};
}
