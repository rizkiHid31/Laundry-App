import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useApi } from '../../hooks/useApi';

interface HistoryItem {
  id: string;
  station: string;
  status: string;
  completedAt: string | null;
  order: { invoiceNumber: string; status: string };
}

interface Meta { page: number; total: number; totalPages: number }

const today = new Date().toISOString().split('T')[0];
const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

const STATION_COLOR: Record<string, string> = {
  WASHING: 'bg-blue-100 text-blue-700',
  IRONING: 'bg-orange-100 text-orange-700',
  PACKING: 'bg-purple-100 text-purple-700',
};

export default function WorkerHistoryPage() {
  const { apiFetch } = useApi();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(
        `/worker/history?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=15`
      );
      setItems(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat riwayat');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, startDate, endDate]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Riwayat Kerja</h1>
          <p className="text-gray-600 mt-1">History pekerjaan yang sudah diselesaikan</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Dari Tanggal</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Sampai Tanggal</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={() => fetchHistory(1)}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
              Filter
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md">
          {loading ? (
            <div className="p-10 flex justify-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-gray-500">Belum ada riwayat kerja pada periode ini</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3 text-left font-medium">Invoice</th>
                  <th className="px-6 py-3 text-left font-medium">Station</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                  <th className="px-6 py-3 text-left font-medium">Selesai</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold text-gray-900">{item.order.invoiceNumber}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATION_COLOR[item.station] ?? 'bg-gray-100 text-gray-600'}`}>
                        {item.station}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{fmt(item.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {meta && meta.totalPages > 1 && (
            <div className="px-6 py-4 flex justify-between items-center border-t text-sm">
              <span className="text-gray-500">{meta.total} data</span>
              <div className="flex gap-2">
                {Array.from({ length: meta.totalPages }, (_, i) => (
                  <button key={i} onClick={() => fetchHistory(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium ${meta.page === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
