export const DEFAULT_SECURITY_SETTINGS = {
  requireFacial: true,
  requireGeo: true,
  livenessType: 'passive',
  minMatchThreshold: 85,
  fenceBehavior: 'alert', // alert | block | justify
  fenceRadiusMeters: 200,
  detectGpsMock: true,
  allowOffline: true,
};

export const SECURITY_CENTER_COORDS = {
  latitude: -23.55052,
  longitude: -46.633308,
  label: 'Av. Paulista, 1000 - São Paulo/SP',
};
