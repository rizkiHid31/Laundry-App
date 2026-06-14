import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useApi } from '../../hooks/useApi';

interface Station {
  id: string;
  station: string;
  status: string;
  order: { invoiceNumber: string; status: string; totalKg: number };
}

interface Meta { page: number; total: number; totalPages: number }

const STATION_COLOR: Record<string, string> = {
  WASHING: 'bg-blue-100 text-blue-700',
  IRONING: 'bg-orange-100 text-orange-700',
  PACKING: 'bg-purple-100 text-purple-700',
};

export default function WorkerDashboardPage() {
  const { apiFetch } = useApi();
  const [stations, setStations] = useState<Station[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/worker/orders?page=${page}&limit=10`);
      setStations(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat order');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Tersedia</h1>
            <p className="text-gray-600 mt-1">Daftar station yang perlu dikerjakan</p>
          </div>
          <button onClick={() => fetchOrders()}
            className="px-4 py-2 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition">
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
            {error.toLowerCase().includes('check in') && (
              <p className="text-red-600 mt-1 text-sm">
                Silakan <Link to="/attendance" className="underline font-semibold">lakukan Check-in</Link> terlebih dahulu.
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : stations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-xl font-semibold text-gray-900 mb-2">Tidak ada order menunggu</p>
            <p className="text-gray-600">Semua pekerjaan sudah selesai</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stations.map((s) => (
              <div key={s.id} className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between hover:shadow-lg transition">
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATION_COLOR[s.station] ?? 'bg-gray-100 text-gray-600'}`}>
                    {s.station}
                  </span>
                  <div>
                    <p className="font-bold text-gray-900">{s.order.invoiceNumber}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{s.order.totalKg} kg</p>
                  </div>
                </div>
                <Link
                  to={`/worker/station/${s.id}`}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  Kerjakan
                </Link>
              </div>
            ))}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: meta.totalPages }, (_, i) => (
              <button key={i} onClick={() => fetchOrders(i + 1)}
                className={`w-9 h-9 rounded-lg text-sm font-medium ${meta.page === i + 1 ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
