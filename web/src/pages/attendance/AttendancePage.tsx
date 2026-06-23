import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';

interface Shift {
  id: string;
  shiftDate: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'ABSENT' | 'PRESENT' | 'COMPLETED';
}

interface Meta {
  page: number;
  totalPages: number;
  total: number;
}

export default function AttendancePage() {
  const [today, setToday] = useState<Shift | null>(null);
  const [history, setHistory] = useState<Shift[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchToday = useCallback(async () => {
    const res = await api.get('/api/attendance/today');
    setToday(res.data.data);
  }, []);

  const fetchHistory = useCallback(async () => {
    const res = await api.get('/api/attendance/my', { params: { page, limit: 10 } });
    setHistory(res.data.data ?? []);
    setMeta(res.data.meta ?? { page: 1, totalPages: 1, total: 0 });
  }, [page]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchToday(), fetchHistory()]).finally(() => setLoading(false));
  }, [fetchToday, fetchHistory]);

  const handleAction = async (action: 'clock-in' | 'clock-out') => {
    setActionLoading(true);
    setMessage('');
    try {
      const res = await api.post(`/api/attendance/${action}`);
      setMessage(res.data.message);
      await fetchToday();
      await fetchHistory();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setActionLoading(false);
    }
  };

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const statusBadge = (s: Shift['status']) => {
    const map = { ABSENT: 'bg-gray-100 text-gray-600', PRESENT: 'bg-blue-100 text-blue-700', COMPLETED: 'bg-green-100 text-green-700' };
    const label = { ABSENT: 'Absen', PRESENT: 'Hadir', COMPLETED: 'Selesai' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[s]}`}>{label[s]}</span>;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Memuat...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Absensi</h1>

      {/* Status Hari Ini */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Hari Ini</h2>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-600 mb-1">Clock In</p>
            <p className="text-xl font-bold text-blue-800">{fmt(today?.checkIn ?? null)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-green-600 mb-1">Clock Out</p>
            <p className="text-xl font-bold text-green-800">{fmt(today?.checkOut ?? null)}</p>
          </div>
        </div>

        {message && (
          <p className="text-sm text-center mb-3 text-blue-600">{message}</p>
        )}

        <div className="flex gap-3">
          <button
            disabled={!!today?.checkIn || actionLoading}
            onClick={() => handleAction('clock-in')}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition"
          >
            Clock In
          </button>
          <button
            disabled={!today?.checkIn || !!today?.checkOut || actionLoading}
            onClick={() => handleAction('clock-out')}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-700 transition"
          >
            Clock Out
          </button>
        </div>
      </div>

      {/* Riwayat */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Riwayat ({meta.total})
        </h2>
        {history.length === 0 ? (
          <p className="text-center text-gray-400 py-4">Belum ada data</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {history.map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{fmtDate(s.shiftDate)}</p>
                  <p className="text-xs text-gray-500">In: {fmt(s.checkIn)} · Out: {fmt(s.checkOut)}</p>
                </div>
                {statusBadge(s.status)}
              </li>
            ))}
          </ul>
        )}

        {meta.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">{page} / {meta.totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
