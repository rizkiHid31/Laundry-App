import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';

interface ShiftRecord {
  id: string;
  shiftDate: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'ABSENT' | 'PRESENT' | 'COMPLETED';
  employee: { user: { name: string; email: string } };
}

interface Meta { page: number; totalPages: number; total: number; }

export default function AttendanceReportPage() {
  const [records, setRecords] = useState<ShiftRecord[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (dateFrom) params['dateFrom'] = dateFrom;
      if (dateTo) params['dateTo'] = dateTo;

      const res = await api.get('/api/attendance/report', { params });
      setRecords(res.data.data ?? []);
      setMeta(res.data.meta ?? { page: 1, totalPages: 1, total: 0 });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [page, dateFrom, dateTo]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  const statusStyle: Record<string, string> = {
    ABSENT: 'bg-gray-100 text-gray-600',
    PRESENT: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
  };
  const statusLabel: Record<string, string> = { ABSENT: 'Absen', PRESENT: 'Hadir', COMPLETED: 'Selesai' };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Laporan Absensi Karyawan</h1>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            Reset
          </button>
          <span className="text-sm text-gray-500 ml-auto">Total: {meta.total} record</span>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Memuat...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Karyawan</th>
                  <th className="px-4 py-3 text-left">Tanggal</th>
                  <th className="px-4 py-3 text-center">Clock In</th>
                  <th className="px-4 py-3 text-center">Clock Out</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">Tidak ada data</td></tr>
                ) : records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{r.employee.user.name}</p>
                      <p className="text-xs text-gray-400">{r.employee.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(r.shiftDate)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{fmt(r.checkIn)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{fmt(r.checkOut)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle[r.status]}`}>
                        {statusLabel[r.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {meta.totalPages > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-40">Prev</button>
                <span className="px-3 py-1 text-sm text-gray-600">{page} / {meta.totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
