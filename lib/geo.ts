export const DEFAULT_RADIUS_KM = 25
export const MAX_RADIUS_KM = 100

export function clampRadius(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_RADIUS_KM
  return Math.min(Math.max(value, 1), MAX_RADIUS_KM)
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a))
}

export function boundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111
  const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.01)
  const lngDelta = radiusKm / (111 * cosLat)
  return {
    minLat: Math.max(-90, lat - latDelta),
    maxLat: Math.min(90, lat + latDelta),
    minLng: Math.max(-180, lng - lngDelta),
    maxLng: Math.min(180, lng + lngDelta),
  }
}

export function isValidCoordinate(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

export function publicCoordinate(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return null
  return Number(value.toFixed(2))
}
