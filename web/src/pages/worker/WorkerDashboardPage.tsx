import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface OrderItem { laundryItem: { name: string; unit: string }; quantity: number; }
interface Station {
  id: string;
  station: 'WASHING' | 'IRONING' | 'PACKING';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BYPASSED';
  workerId: string | null;
  order: {
    invoiceNumber: string;
    orderItems: OrderItem[];
    pickupRequest: { scheduledAt: string; customer: { name: string } };
  };
}
interface Meta { page: number; totalPages: number; total: number; }

const stationLabel: Record<string, string> = { WASHING: 'Cuci', IRONING: 'Setrika', PACKING: 'Packing' };
const stationColor: Record<string, string> = {
  WASHING: 'bg-blue-100 text-blue-700',
  IRONING: 'bg-orange-100 text-orange-700',
  PACKING: 'bg-purple-100 text-purple-700',
};

export default function WorkerDashboardPage() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [stationFilter, setStationFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchOrders = useCallback(async () => {
    if (!token) return;

    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (stationFilter) params.set('station', stationFilter);
    const res = await fetch(`${API}/api/workers/orders?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setStations(data.data ?? []);
    setMeta(data.meta ?? { page: 1, totalPages: 1, total: 0 });
  }, [token, page, stationFilter]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (active) setLoading(true);
      try {
        await fetchOrders();
      } finally {
        if (active) setLoading(false);
      }
    };

    if (token) {
      void load();
    }

    return () => {
      active = false;
    };
  }, [token, fetchOrders]);

  const startStation = async (stationId: string) => {
    if (!token) return;
    setMessage('');
    setLoading(true);
    const res = await fetch(`${API}/api/workers/orders/${stationId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setMessage(data.message);
    if (res.ok) await fetchOrders();
    setLoading(false);
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Worker</h1>
        <button
          onClick={handleLogout}
          className="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
        >
          Logout
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">Halo, {user?.name ?? ((`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()) || 'Worker')}</p>

      {message && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">{message}</div>
      )}

      {/* Filter Station */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['', 'WASHING', 'IRONING', 'PACKING'].map((s) => (
          <button
            key={s}
            onClick={() => { setStationFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
              stationFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'Semua' : stationLabel[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat...</div>
      ) : stations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
          Tidak ada order yang perlu dikerjakan
        </div>
      ) : (
        <ul className="space-y-3">
          {stations.map((s) => (
            <li key={s.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800">{s.order.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">{s.order.pickupRequest.customer.name} · {fmtDate(s.order.pickupRequest.scheduledAt)}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stationColor[s.station]}`}>
                  {stationLabel[s.station]}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-2 mb-3">
                <p className="text-xs text-gray-500 mb-1">Item:</p>
                {s.order.orderItems.map((item, i) => (
                  <p key={i} className="text-xs text-gray-700">{item.laundryItem.name} × {item.quantity} {item.laundryItem.unit}</p>
                ))}
              </div>

              {s.status === 'PENDING' ? (
                <button
                  onClick={() => startStation(s.id)}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Mulai Kerjakan
                </button>
              ) : s.status === 'IN_PROGRESS' ? (
                <Link
                  to={`/worker/orders/${s.id}`}
                  className="block w-full py-2 bg-orange-500 text-white rounded-lg text-sm font-medium text-center hover:bg-orange-600"
                >
                  Lanjut Proses
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded bg-white disabled:opacity-40">Prev</button>
          <span className="px-3 py-1 text-sm text-gray-600">{page} / {meta.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="px-3 py-1 text-sm border rounded bg-white disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
