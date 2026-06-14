import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useApi } from '../../hooks/useApi';

interface Shift {
  id: string;
  shiftDate: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  employee: {
    user: { firstName: string; lastName: string; email: string; role: string };
  };
}

interface Meta { page: number; total: number; totalPages: number }

const today = new Date().toISOString().split('T')[0];
const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

export default function AttendanceReportPage() {
  const { apiFetch } = useApi();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(
        `/attendance/report?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=15`
      );
      setShifts(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  const statusColor = (status: string) => {
    if (status === 'PRESENT') return 'bg-green-100 text-green-700';
    if (status === 'COMPLETED') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  };

  const present = shifts.filter((s) => s.status === 'PRESENT' || s.status === 'COMPLETED').length;
  const absent = shifts.filter((s) => s.status === 'ABSENT').length;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Laporan Absensi</h1>
          <p className="text-gray-600 mt-1">Rekap kehadiran seluruh karyawan</p>
        </div>

        {/* Filter */}
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
            <button onClick={() => fetchReport(1)}
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

        {/* Summary */}
        {!loading && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">Total Data</p>
              <p className="text-3xl font-bold text-gray-900">{meta?.total ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-sm text-green-600 mb-1">Hadir</p>
              <p className="text-3xl font-bold text-green-700">{present}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">Absen</p>
              <p className="text-3xl font-bold text-gray-600">{absent}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md">
          {loading ? (
            <div className="p-10 flex justify-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : shifts.length === 0 ? (
            <div className="p-10 text-center text-gray-500">Tidak ada data absensi pada periode ini</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-medium">Karyawan</th>
                  <th className="px-5 py-3 text-left font-medium">Role</th>
                  <th className="px-5 py-3 text-left font-medium">Tanggal</th>
                  <th className="px-5 py-3 text-left font-medium">Check-in</th>
                  <th className="px-5 py-3 text-left font-medium">Check-out</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr key={shift.id} className="border-b hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900">
                        {shift.employee.user.firstName} {shift.employee.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{shift.employee.user.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {shift.employee.user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{fmtDate(shift.shiftDate)}</td>
                    <td className="px-5 py-3 text-gray-600">{fmt(shift.checkIn)}</td>
                    <td className="px-5 py-3 text-gray-600">{fmt(shift.checkOut)}</td>
                    <td className="px-5 py-3">
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
            <div className="px-5 py-4 flex justify-between items-center border-t text-sm">
              <span className="text-gray-500">{meta.total} data</span>
              <div className="flex gap-2">
                {Array.from({ length: meta.totalPages }, (_, i) => (
                  <button key={i} onClick={() => fetchReport(i + 1)}
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
