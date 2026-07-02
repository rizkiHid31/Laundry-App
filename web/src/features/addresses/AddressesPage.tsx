import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const ADDRESS_PATH = '/api/addresses';

interface AddressItem {
  id: string;
  label: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  isPrimary: boolean;
  createdAt: string;
}

interface AddressFormValues {
  label: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

interface StatusMessage {
  success: boolean;
  message: string;
}

const defaultValues: AddressFormValues = {
  label: '',
  fullAddress: '',
  latitude: 0,
  longitude: 0,
};

export default function AddressesPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formValues, setFormValues] = useState<AddressFormValues>(defaultValues);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [loading, setLoading] = useState(true);

  const coordinateSummary = useMemo(() => {
    if (!formValues.latitude && !formValues.longitude) return 'Belum ada koordinat';
    return `${formValues.latitude.toFixed(6)}, ${formValues.longitude.toFixed(6)}`;
  }, [formValues.latitude, formValues.longitude]);

  const showStatus = (success: boolean, message: string) => setStatus({ success, message });

  const request = async <T = any>(path: string, options: { method?: string; json?: unknown } = {}) => {
    if (!token) throw new Error('Silakan login terlebih dahulu.');

    const response = await fetch(`${API_URL}${path}`, {
      method: options.method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.json ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.json ? JSON.stringify(options.json) : undefined,
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'Terjadi kesalahan.');
    return payload as T;
  };

  const fetchAddresses = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const result = await request<{ data: AddressItem[] }>(ADDRESS_PATH);
      setAddresses(result.data ?? []);
    } catch (error) {
      showStatus(false, error instanceof Error ? error.message : 'Gagal memuat alamat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchAddresses();
  }, [token, navigate]);

  const handleChange = (field: keyof AddressFormValues, value: string | number) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setFormValues(defaultValues);
    setEditingId(null);
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      showStatus(false, 'Browser Anda belum mendukung geolocation.');
      return;
    }

    setIsCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormValues((current) => ({
          ...current,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        showStatus(true, 'Koordinat berhasil diambil.');
        setIsCapturingLocation(false);
      },
      () => {
        showStatus(false, 'Izin lokasi ditolak atau tidak dapat mengambil lokasi.');
        setIsCapturingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const saveAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const method = editingId ? 'PUT' : 'POST';
    const path = editingId ? `${ADDRESS_PATH}/${editingId}` : ADDRESS_PATH;

    try {
      await request<{ message: string }>(path, { method, json: formValues });
      showStatus(true, editingId ? 'Alamat berhasil diperbarui.' : 'Alamat berhasil disimpan.');
      resetForm();
      fetchAddresses();
    } catch (error) {
      showStatus(false, error instanceof Error ? error.message : 'Terjadi kesalahan.');
    }
  };

  const editAddress = ({ id, label, fullAddress, latitude, longitude }: AddressItem) => {
    setEditingId(id);
    setFormValues({ label, fullAddress, latitude, longitude });
  };

  const deleteAddress = async (id: string) => {
    if (!token || !window.confirm('Hapus alamat ini?')) return;

    try {
      await request<{ message: string }>(`${ADDRESS_PATH}/${id}`, { method: 'DELETE' });
      showStatus(true, 'Alamat berhasil dihapus.');
      if (editingId === id) resetForm();
      fetchAddresses();
    } catch (error) {
      showStatus(false, error instanceof Error ? error.message : 'Terjadi kesalahan.');
    }
  };

  const updatePrimary = async (id: string) => {
    if (!token) return;

    try {
      await request<{ message: string }>(`${ADDRESS_PATH}/${id}`, { method: 'PUT', json: { isPrimary: true } });
      showStatus(true, 'Alamat utama berhasil diperbarui.');
      fetchAddresses();
    } catch (error) {
      showStatus(false, error instanceof Error ? error.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Alamat Saya</h1>
              <p className="text-sm text-slate-600">Tambah, edit, hapus, dan tetapkan alamat utama.</p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm hover:bg-slate-100"
              onClick={() => navigate('/customer')}
            >
              Kembali ke Dashboard
            </button>
          </div>

          {status && (
            <div className={`mb-6 rounded-lg border p-4 text-sm ${status.success ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {status.message}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold mb-4">Form Alamat</h2>
              <form className="grid gap-4" onSubmit={saveAddress}>
                <label className="grid gap-2 text-sm">
                  <span>Label alamat</span>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={formValues.label}
                    onChange={(e) => handleChange('label', e.target.value)}
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm">
                  <span>Alamat lengkap</span>
                  <textarea
                    className="min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={formValues.fullAddress}
                    onChange={(e) => handleChange('fullAddress', e.target.value)}
                    required
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm">
                    <span>Latitude</span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      value={formValues.latitude}
                      onChange={(e) => handleChange('latitude', Number(e.target.value))}
                      required
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span>Longitude</span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      value={formValues.longitude}
                      onChange={(e) => handleChange('longitude', Number(e.target.value))}
                      required
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium">Koordinat terpilih</p>
                      <p className="text-xs text-slate-600">{coordinateSummary}</p>
                    </div>

                    <button
                      type="button"
                      onClick={captureLocation}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
                      disabled={isCapturingLocation}
                    >
                      {isCapturingLocation ? 'Mengambil lokasi...' : 'Ambil lokasi saat ini'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-slate-300 px-5 py-2 text-sm hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 text-sm text-white hover:bg-blue-700">
                    {editingId ? 'Perbarui Alamat' : 'Tambah Alamat'}
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Daftar Alamat</h2>
                  <p className="text-sm text-slate-600">Pilih alamat utama, edit, atau hapus alamat tersimpan.</p>
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-slate-500">Memuat alamat...</p>
              ) : addresses.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada alamat tersimpan.</p>
              ) : (
                <div className="space-y-4">
                  {addresses.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-slate-900">{item.label}</span>
                            {item.isPrimary && (
                              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">Utama</span>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-slate-600">{item.fullAddress}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            Koordinat: {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-right">
                          {!item.isPrimary && (
                            <button
                              type="button"
                              onClick={() => updatePrimary(item.id)}
                              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                              Jadikan Utama
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => editAddress(item)}
                            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAddress(item.id)}
                            className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
