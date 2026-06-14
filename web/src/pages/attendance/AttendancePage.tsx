import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useApi } from '../../hooks/useApi';

interface Shift {
  id: string;
  shiftDate: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}

interface Meta { page: number; limit: number; total: number; totalPages: number }

const todayStr = new Date().toISOString().split('T')[0];

export default function AttendancePage() {
  const { apiFetch } = useApi();
  const [todayShift, setTodayShift] = useState<Shift | null>(null);
  const [logs, setLogs] = useState<Shift[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      const res = await apiFetch(`/attendance/my-log?page=${page}&limit=10`);
      setLogs(res.data);
      setMeta(res.meta);
      const found = res.data.find((s: Shift) => s.shiftDate.startsWith(todayStr));
      setTodayShift(found ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data absensi');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleAction = async (action: 'check-in' | 'check-out') => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/attendance/${action}`, { method: 'POST' });
      setSuccess(action === 'check-in' ? 'Check-in berhasil!' : 'Check-out berhasil!');
      await fetchLogs();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal melakukan aksi');
    } finally {
      setActionLoading(false);
    }
  };

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  const statusColor = (status: string) => {
    if (status === 'PRESENT') return 'bg-green-100 text-green-700';
    if (status === 'COMPLETED') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Absensi</h1>
          <p className="text-gray-600 mt-1">Kelola check-in dan check-out harian</p>
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

        {/* Today Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Status Hari Ini</h2>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="flex items-center gap-8 flex-wrap">
              <div>
                <p className="text-sm text-gray-500 mb-1">Check-in</p>
                <p className="text-xl font-bold text-gray-900">{fmt(todayShift?.checkIn ?? null)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Check-out</p>
                <p className="text-xl font-bold text-gray-900">{fmt(todayShift?.checkOut ?? null)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor(todayShift?.status ?? 'ABSENT')}`}>
                  {todayShift?.status ?? 'ABSENT'}
                </span>
              </div>
              <div className="ml-auto">
                {(!todayShift || todayShift.status === 'ABSENT') && (
                  <button
                    onClick={() => handleAction('check-in')}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Loading...' : 'Check-in'}
                  </button>
                )}
                {todayShift?.status === 'PRESENT' && (
                  <button
                    onClick={() => handleAction('check-out')}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Loading...' : 'Check-out'}
                  </button>
                )}
                {todayShift?.status === 'COMPLETED' && (
                  <span className="text-sm text-gray-500">Shift selesai hari ini</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Log Table */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">Riwayat Absensi</h2>
          </div>
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Belum ada data absensi</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3 text-left font-medium">Tanggal</th>
                  <th className="px-6 py-3 text-left font-medium">Check-in</th>
                  <th className="px-6 py-3 text-left font-medium">Check-out</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((shift) => (
                  <tr key={shift.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{fmtDate(shift.shiftDate)}</td>
                    <td className="px-6 py-3 text-gray-600">{fmt(shift.checkIn)}</td>
                    <td className="px-6 py-3 text-gray-600">{fmt(shift.checkOut)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(shift.status)}`}>
                        {shift.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {meta && meta.totalPages > 1 && (
            <div className="px-6 py-4 flex justify-between items-center border-t text-sm">
              <span className="text-gray-500">Total: {meta.total} data</span>
              <div className="flex gap-2">
                {Array.from({ length: meta.totalPages }, (_, i) => (
                  <button key={i} onClick={() => fetchLogs(i + 1)}
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
