import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';

interface StationItem { laundryItem: { name: string }; quantityInput: number; }
interface HistoryRecord {
  id: string;
  station: string;
  status: 'COMPLETED' | 'BYPASSED';
  completedAt: string;
  stationItems: StationItem[];
  order: {
    invoiceNumber: string;
    pickupRequest: { customer: { name: string } };
  };
}
interface Meta { page: number; totalPages: number; total: number; }

const stationLabel: Record<string, string> = { WASHING: 'Cuci', IRONING: 'Setrika', PACKING: 'Packing' };
const stationColor: Record<string, string> = {
  WASHING: 'bg-blue-100 text-blue-700',
  IRONING: 'bg-orange-100 text-orange-700',
  PACKING: 'bg-purple-100 text-purple-700',
};

export default function WorkerHistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const res = await api.get('/api/workers/history', { params: { page, limit: 10 } });
    setRecords(res.data.data ?? []);
    setMeta(res.data.meta ?? { page: 1, totalPages: 1, total: 0 });
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-4 pt-20 sm:pt-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Riwayat Pekerjaan ({meta.total})</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat...</div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
          Belum ada riwayat pekerjaan
        </div>
      ) : (
        <ul className="space-y-3">
          {records.map((r) => (
            <li key={r.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{r.order.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">{r.order.pickupRequest.customer.name}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stationColor[r.station]}`}>
                    {stationLabel[r.station] ?? r.station}
                  </span>
                  {r.status === 'BYPASSED' && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">Bypass</span>
                  )}
                </div>
              </div>

              {r.stationItems.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-2 mb-2">
                  {r.stationItems.map((item, i) => (
                    <p key={i} className="text-xs text-gray-600">
                      {item.laundryItem.name} × {item.quantityInput}
                    </p>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400">Selesai: {fmtDate(r.completedAt)}</p>
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
