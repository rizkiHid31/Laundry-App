import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

interface ItemInput { laundryItemId: string; quantityInput: number; name: string; }
interface OrderItem { laundryItemId: string; quantity: number; laundryItem: { name: string; unit: string }; }
interface StationData {
  id: string;
  station: string;
  status: string;
  order: {
    invoiceNumber: string;
    orderItems: OrderItem[];
    pickupRequest: { customer: { name: string } };
  };
}

export default function StationDetailPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();

  const [station, setStation] = useState<StationData | null>(null);
  const [items, setItems] = useState<ItemInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [showBypass, setShowBypass] = useState(false);
  const [bypassReason, setBypassReason] = useState('');

  const fetchStation = useCallback(async () => {
    const res = await api.get('/api/workers/orders', { params: { limit: 100 } });
    const found: StationData | undefined = (res.data.data ?? []).find((s: StationData) => s.id === stationId);
    if (found) {
      setStation(found);
      setItems(found.order.orderItems.map((i) => ({
        laundryItemId: i.laundryItemId,
        quantityInput: i.quantity,
        name: i.laundryItem.name,
      })));
    }
    setLoading(false);
  }, [stationId]);

  useEffect(() => { fetchStation(); }, [fetchStation]);

  const updateQty = (laundryItemId: string, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    setItems((prev) => prev.map((i) => i.laundryItemId === laundryItemId ? { ...i, quantityInput: num } : i));
  };

  const handleComplete = async () => {
    setSubmitting(true);
    setMessage('');
    setIsError(false);
    try {
      await api.post(`/api/workers/orders/${stationId}/complete`, { items });
      setMessage('Station selesai!');
      setTimeout(() => navigate('/worker'), 1500);
    } catch (error: any) {
      setIsError(true);
      setMessage(error.response?.data?.message || 'Terjadi kesalahan');
      if (error.response?.data?.mismatches) setShowBypass(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBypass = async () => {
    if (bypassReason.trim().length < 10) {
      setMessage('Alasan minimal 10 karakter');
      setIsError(true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/api/workers/orders/${stationId}/bypass`, { reason: bypassReason });
      setMessage(res.data.message);
      setIsError(false);
      setTimeout(() => navigate('/worker'), 1500);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Terjadi kesalahan');
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const stationLabel: Record<string, string> = { WASHING: 'Cuci', IRONING: 'Setrika', PACKING: 'Packing' };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Memuat...</div>;
  if (!station) return <div className="min-h-screen flex items-center justify-center text-gray-400">Station tidak ditemukan</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto">
      <button onClick={() => navigate('/worker')} className="text-blue-600 text-sm mb-4 flex items-center gap-1">
        ← Kembali
      </button>

      <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-xl font-bold text-gray-900">{station.order.invoiceNumber}</h1>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {stationLabel[station.station] ?? station.station}
          </span>
        </div>
        <p className="text-sm text-gray-500">Customer: {station.order.pickupRequest.customer.name}</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${isError ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Input ulang quantity */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Input Ulang Item</h2>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.laundryItemId} className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-800 flex-1">{item.name}</span>
              <input
                type="number"
                min={0}
                value={item.quantityInput}
                onChange={(e) => updateQty(item.laundryItemId, e.target.value)}
                className="w-20 border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleComplete}
        disabled={submitting}
        className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50 mb-3"
      >
        {submitting ? 'Memproses...' : 'Selesaikan Station'}
      </button>

      {/* Bypass */}
      {showBypass && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-800 mb-2 text-sm">Jumlah tidak sesuai — Minta Bypass</h3>
          <textarea
            value={bypassReason}
            onChange={(e) => setBypassReason(e.target.value)}
            placeholder="Jelaskan alasan perbedaan item (min. 10 karakter)..."
            rows={3}
            className="w-full border border-red-200 rounded-lg p-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-red-300"
          />
          <button
            onClick={handleBypass}
            disabled={submitting}
            className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            Kirim Bypass Request
          </button>
        </div>
      )}
    </div>
  );
}
