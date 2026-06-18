const EARTH_RADIUS_KM = 6371;

export const toRad = (deg: number): number => (deg * Math.PI) / 180;

export const haversineKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const findNearestOutlet = <
  T extends { latitude: number | null; longitude: number | null; serviceRadiusKm: number }
>(
  outlets: T[],
  lat: number,
  lng: number
): (T & { distanceKm: number }) | null => {
  let nearest: (T & { distanceKm: number }) | null = null;
  for (const outlet of outlets) {
    if (!outlet.latitude || !outlet.longitude) continue;
    const distanceKm = haversineKm(lat, lng, outlet.latitude, outlet.longitude);
    if (distanceKm > outlet.serviceRadiusKm) continue;
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { ...outlet, distanceKm };
    }
  }
  return nearest;
};
