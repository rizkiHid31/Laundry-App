import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useApi } from '../../hooks/useApi';

interface LaundryItem { id: string; name: string; unit: string }
interface OrderItem { laundryItemId: string; quantity: number; laundryItem: LaundryItem }
interface StationItem { laundryItemId: string; quantityInput: number; laundryItem: LaundryItem }
interface BypassRequest { id: string; reason: string; status: string; adminNote: string | null }
interface Station {
  id: string;
  station: string;
  status: string;
  workerId: string | null;
  order: {
    id: string;
    invoiceNumber: string;
    status: string;
    totalKg: number;
    orderItems: OrderItem[];
  };
  stationItems: StationItem[];
  bypassRequests: BypassRequest[];
}

const STATION_COLOR: Record<string, string> = {
  WASHING: 'bg-blue-100 text-blue-700',
  IRONING: 'bg-orange-100 text-orange-700',
  PACKING: 'bg-purple-100 text-purple-700',
};

export default function StationDetailPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();
  const { apiFetch } = useApi();

  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [itemQty, setItemQty] = useState<Record<string, number>>({});
  const [bypassReason, setBypassReason] = useState('');
  const [showBypassForm, setShowBypassForm] = useState(false);

  const fetchStation = useCallback(async () => {
    try {
      const res = await apiFetch(`/worker/stations/${stationId}`);
      setStation(res.data);
      const items: Record<string, number> = {};
      if (res.data.stationItems.length > 0) {
        res.data.stationItems.forEach((si: StationItem) => {
          items[si.laundryItemId] = si.quantityInput;
        });
      } else {
        res.data.order.orderItems.forEach((oi: OrderItem) => {
          items[oi.laundryItemId] = oi.quantity;
        });
      }
      setItemQty(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, stationId]);

  useEffect(() => { fetchStation(); }, [fetchStation]);

  const doPost = async (path: string, body?: object) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/worker/stations/${stationId}/${path}`, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
      await fetchStation();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Aksi gagal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = () => doPost('start');

  const handleSubmitItems = async () => {
    const items = Object.entries(itemQty).map(([laundryItemId, quantityInput]) => ({ laundryItemId, quantityInput }));
    await doPost('items', { items });
    setSuccess('Item berhasil disimpan');
  };

  const handleComplete = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/worker/stations/${stationId}/complete`, { method: 'POST' });
      setSuccess('Station selesai! Kembali ke daftar order...');
      setTimeout(() => navigate('/worker'), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyelesaikan station');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBypass = async () => {
    if (!bypassReason.trim()) { setError('Alasan bypass wajib diisi'); return; }
    await doPost('bypass', { reason: bypassReason });
    setBypassReason('');
    setShowBypassForm(false);
    setSuccess('Permintaan bypass terkirim, menunggu persetujuan admin');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!station) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <p className="text-gray-600 text-lg">Station tidak ditemukan</p>
          <Link to="/worker" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Kembali
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const pendingBypass = station.bypassRequests.find((b) => b.status === 'PENDING');
  const approvedBypass = station.bypassRequests.find((b) => b.status === 'APPROVED');

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/worker" className="text-gray-500 hover:text-gray-700 font-medium">← Kembali</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 font-medium">Detail Station</span>
        </div>

        {/* Header info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{station.order.invoiceNumber}</h1>
              <p className="text-gray-600 mt-1">{station.order.totalKg} kg total</p>
            </div>
            <span className={`px-4 py-2 rounded-full font-semibold text-sm ${STATION_COLOR[station.station] ?? 'bg-gray-100 text-gray-600'}`}>
              {station.station}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {pendingBypass && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 font-medium">Permintaan bypass sedang menunggu persetujuan admin</p>
          </div>
        )}
        {approvedBypass && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">Bypass disetujui — Anda bisa menyelesaikan station ini</p>
          </div>
        )}

        {/* Reference items */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Item Order (Referensi)</h2>
          <div className="space-y-2">
            {station.order.orderItems.map((oi) => (
              <div key={oi.laundryItemId} className="flex justify-between py-2 border-b last:border-0">
                <span className="text-gray-700">{oi.laundryItem.name}</span>
                <span className="font-semibold text-gray-900">{oi.quantity} {oi.laundryItem.unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PENDING */}
        {station.status === 'PENDING' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 mb-4">Klik tombol di bawah untuk mulai mengerjakan station ini.</p>
            <button onClick={handleStart} disabled={actionLoading}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
              {actionLoading ? 'Loading...' : 'Mulai Kerjakan'}
            </button>
          </div>
        )}

        {/* IN_PROGRESS */}
        {station.status === 'IN_PROGRESS' && (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-900">Input Hasil {station.station}</h2>

            <div className="space-y-3">
              {station.order.orderItems.map((oi) => (
                <div key={oi.laundryItemId} className="flex items-center gap-4">
                  <label className="flex-1 text-gray-700">
                    {oi.laundryItem.name}
                    <span className="text-gray-400 text-sm ml-2">(target: {oi.quantity})</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={itemQty[oi.laundryItemId] ?? 0}
                    onChange={(e) => setItemQty((prev) => ({ ...prev, [oi.laundryItemId]: Number(e.target.value) }))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            <button onClick={handleSubmitItems} disabled={actionLoading}
              className="w-full bg-gray-800 text-white font-semibold py-2 rounded-lg hover:bg-gray-900 transition disabled:opacity-50">
              {actionLoading ? 'Menyimpan...' : 'Simpan Item'}
            </button>

            <div className="border-t pt-4 flex gap-3">
              <button onClick={handleComplete} disabled={actionLoading}
                className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                {actionLoading ? 'Loading...' : 'Selesaikan Station'}
              </button>
              {!pendingBypass && !approvedBypass && (
                <button onClick={() => setShowBypassForm(!showBypassForm)}
                  className="px-4 py-2 border-2 border-orange-400 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition">
                  Bypass
                </button>
              )}
            </div>

            {showBypassForm && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <label className="block text-gray-700 font-medium mb-2">Alasan Bypass</label>
                <textarea rows={3} value={bypassReason} onChange={(e) => setBypassReason(e.target.value)}
                  placeholder="Jelaskan alasan jumlah tidak sesuai..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-3 mt-3">
                  <button onClick={handleBypass} disabled={actionLoading}
                    className="px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition disabled:opacity-50">
                    Kirim Permintaan
                  </button>
                  <button onClick={() => setShowBypassForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition">
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPLETED / BYPASSED */}
        {(station.status === 'COMPLETED' || station.status === 'BYPASSED') && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Station {station.status}</h2>
            <p className="text-gray-600 mb-6">Pekerjaan pada station ini sudah selesai</p>
            <Link to="/worker" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
              Kembali ke Daftar Order
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
