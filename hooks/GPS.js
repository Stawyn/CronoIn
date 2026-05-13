import { useCallback, useState } from 'react';
import * as Location from 'expo-location';

const toRad = (value) => (value * Math.PI) / 180;

const calculateDistanceMeters = (origin, target) => {
	if (!origin || !target) return null;
	const earthRadius = 6371e3;
	const dLat = toRad(target.latitude - origin.latitude);
	const dLon = toRad(target.longitude - origin.longitude);
	const lat1 = toRad(origin.latitude);
	const lat2 = toRad(target.latitude);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return Math.round(earthRadius * c);
};

export const formatCoords = (coords) => {
	if (!coords) return '';
	return `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
};

export function useGPS({ center, radiusMeters, detectMock = true }) {
	const [permissionStatus, setPermissionStatus] = useState(null);
	const [locationStatus, setLocationStatus] = useState('idle'); // idle | requesting | success | error
	const [position, setPosition] = useState(null);
	const [distance, setDistance] = useState(null);
	const [insideFence, setInsideFence] = useState(false);
	const [error, setError] = useState(null);
	const [isMocked, setIsMocked] = useState(false);

	const requestPermission = useCallback(async () => {
		setLocationStatus('requesting');
		const { status } = await Location.requestForegroundPermissionsAsync();
		setPermissionStatus(status);
		if (status !== 'granted') {
			setError('Permissão de localização negada');
			setLocationStatus('error');
			return false;
		}
		return true;
	}, []);

	const captureLocation = useCallback(async () => {
		try {
			setError(null);
			if (permissionStatus !== 'granted') {
				const granted = await requestPermission();
				if (!granted) return null;
			}

			setLocationStatus('requesting');
			const currentPosition = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Highest,
			});
			setPosition(currentPosition.coords);

			const computedDistance = calculateDistanceMeters(currentPosition.coords, center);
			setDistance(computedDistance);
			const inside = typeof computedDistance === 'number' ? computedDistance <= radiusMeters : false;
			setInsideFence(inside);

			const mockedFlag = Boolean(currentPosition.mocked);
			setIsMocked(mockedFlag && detectMock);

			setLocationStatus('success');
			return {
				coords: currentPosition.coords,
				distance: computedDistance,
				insideFence: inside,
				mocked: mockedFlag,
			};
		} catch (err) {
			console.error('Erro ao capturar localização', err);
			setError(err.message || 'Não foi possível capturar a localização');
			setLocationStatus('error');
			return null;
		}
	}, [center, detectMock, permissionStatus, radiusMeters, requestPermission]);

	return {
		permissionStatus,
		locationStatus,
		position,
		distance,
		insideFence,
		isMocked,
		error,
		captureLocation,
		requestPermission,
	};
}

export { calculateDistanceMeters };
