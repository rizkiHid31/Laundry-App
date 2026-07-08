import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';

interface ReportedItem { laundryItemId: string; quantityInput: number; }
interface OrderItem { laundryItemId: string; quantity: number; laundryItem: { name: string }; }
interface BypassRecord {
  id: string;
  reason: string;
  reportedItems: ReportedItem[];
  createdAt: string;
  station: {
    station: 'WASHING' | 'IRONING' | 'PACKING';
    worker: { user: { name: string } } | null;
    order: { invoiceNumber: string; orderItems: OrderItem[] };
  };
}

interface Meta { page: number; totalPages: number; total: number; }

const stationLabel: Record<string, string> = { WASHING: 'Cuci', IRONING: 'Setrika', PACKING: 'Packing' };

export default function BypassApprovalPage() {
  const [bypasses, setBypasses] = useState<BypassRecord[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const fetchBypasses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/workers/bypass/pending', { params: { page, limit: 20 } });
      setBypasses(res.data.data ?? []);
      setMeta(res.data.meta ?? { page: 1, totalPages: 1, total: 0 });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchBypasses(); }, [fetchBypasses]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const itemName = (b: BypassRecord, laundryItemId: string) =>
    b.station.order.orderItems.find((i) => i.laundryItemId === laundryItemId)?.laundryItem.name ?? '-';

  const handleDecision = async (id: string, decision: 'approve' | 'reject') => {
    const adminNote = (noteDraft[id] ?? '').trim();
    if (adminNote.length < 5) {
      setError('Keterangan wajib diisi minimal 5 karakter');
      return;
    }
    setProcessingId(id);
    setError('');
    try {
      await api.patch(`/api/workers/bypass/${id}/${decision}`, { adminNote });
      await fetchBypasses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memproses bypass');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-4 pt-20 sm:pt-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Persetujuan Bypass</h1>
        <p className="text-sm text-gray-500 mb-6">
          Request bypass muncul saat worker menemukan jumlah item tidak sesuai dan tidak bisa melanjutkan proses tanpa persetujuan admin.
        </p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Memuat...</div>
        ) : bypasses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
            Tidak ada bypass request yang menunggu persetujuan
          </div>
        ) : (
          <ul className="space-y-3">
            {bypasses.map((b) => (
              <li key={b.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{b.station.order.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">
                      {stationLabel[b.station.station] ?? b.station.station} · {b.station.worker?.user.name ?? '-'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{fmtDate(b.createdAt)}</span>
                </div>

                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2 mb-2">{b.reason}</p>

                {b.reportedItems.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-2 mb-3">
                    <p className="text-xs text-gray-500 mb-1">Jumlah dilaporkan worker:</p>
                    {b.reportedItems.map((item, i) => (
                      <p key={i} className="text-xs text-gray-700">
                        {itemName(b, item.laundryItemId)} × {item.quantityInput}
                      </p>
                    ))}
                  </div>
                )}

                <textarea
                  value={noteDraft[b.id] ?? ''}
                  onChange={(e) => setNoteDraft((prev) => ({ ...prev, [b.id]: e.target.value }))}
                  placeholder="Keterangan admin (min. 5 karakter)..."
                  rows={2}
                  className="w-full border rounded-lg p-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDecision(b.id, 'approve')}
                    disabled={processingId === b.id}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    Setujui
                  </button>
                  <button
                    onClick={() => handleDecision(b.id, 'reject')}
                    disabled={processingId === b.id}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    Tolak
                  </button>
                </div>
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
    </div>
  );
}
