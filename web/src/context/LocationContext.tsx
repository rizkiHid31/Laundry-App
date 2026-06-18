import React, { createContext, useContext, useEffect, useState } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  granted: boolean;
  loading: boolean;
  error: string | null;
  requestLocation: () => void;
}

const LocationContext = createContext<LocationState | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [granted, setGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const saveCoords = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setGranted(true);
    localStorage.setItem('userLocation', JSON.stringify({ lat, lng }));
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung geolocation');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        saveCoords(pos.coords.latitude, pos.coords.longitude);
        setError(null);
        setLoading(false);
      },
      () => {
        setError('Izin lokasi ditolak. Beberapa fitur mungkin terbatas.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    const saved = localStorage.getItem('userLocation');
    if (saved) {
      const { lat, lng } = JSON.parse(saved);
      saveCoords(lat, lng);
      setLoading(false);
      return;
    }
    requestLocation();
  }, []);

  return (
    <LocationContext.Provider
      value={{ latitude, longitude, granted, loading, error, requestLocation }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
};
