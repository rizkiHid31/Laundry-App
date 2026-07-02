import opencage from 'opencage-api-client';

const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY;

interface GeocodeResult {
  formatted: string;
  latitude: number;
  longitude: number;
  timezone?: string | null;
  country?: string | null;
  city?: string | null;
  road?: string | null;
}

interface ReverseGeocodeResult extends GeocodeResult {
  road?: string | null;
  city?: string | null;
  country?: string | null;
}

/**
 * Forward geocode: Convert address to coordinates
 */
export async function forwardGeocode(address: string): Promise<GeocodeResult | null> {
  if (!OPENCAGE_API_KEY) {
    console.warn('OPENCAGE_API_KEY not configured');
    return null;
  }

  try {
    const data = await opencage.geocode({ q: address });

    if (data.status.code === 200 && data.results.length > 0) {
      const place = data.results[0]!;
      const result: GeocodeResult = {
        formatted: place.formatted,
        latitude: place.geometry.lat,
        longitude: place.geometry.lng,
        timezone: place.annotations?.timezone?.name || null,
        country: place.components?.country || null,
        city: place.components?.city || place.components?.town || null,
        road: place.components?.road || null,
      };
      return result;
    }
    return null;
  } catch (error) {
    console.error('Forward geocoding error:', error);
    return null;
  }
}

/**
 * Reverse geocode: Convert coordinates to address
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
  if (!OPENCAGE_API_KEY) {
    console.warn('OPENCAGE_API_KEY not configured');
    return null;
  }

  try {
    const data = await opencage.geocode({ q: `${latitude}, ${longitude}` });

    if (data.status.code === 200 && data.results.length > 0) {
      const place = data.results[0]!;
      const result: ReverseGeocodeResult = {
        formatted: place.formatted,
        latitude: place.geometry.lat,
        longitude: place.geometry.lng,
        timezone: place.annotations?.timezone?.name || null,
        country: place.components?.country || null,
        city: place.components?.city || place.components?.town || null,
        road: place.components?.road || null,
      };
      return result;
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula (in km)
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
