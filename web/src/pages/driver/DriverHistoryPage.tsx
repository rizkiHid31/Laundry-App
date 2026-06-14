import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useApi } from '../../hooks/useApi';

interface Pickup {
  id: string;
  arrivedAtOutlet: string | null;
  customer: { firstName: string; lastName: string };
  address: { fullAddress: string };
}

interface Delivery {
  id: string;
  deliveredAt: string | null;
  order: { invoiceNumber: string };
  address: { fullAddress: string };
}

export default function DriverHistoryPage() {
  const { apiFetch } = useApi();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'pickups' | 'deliveries'>('pickups');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/driver/history');
      setPickups(res.data.pickups);
      setDeliveries(res.data.deliveries);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat riwayat');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Riwayat Driver</h1>
          <p className="text-gray-600 mt-1">History pickup dan pengantaran yang sudah selesai</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          <button onClick={() => setTab('pickups')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${tab === 'pickups' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            Pickup ({pickups.length})
          </button>
          <button onClick={() => setTab('deliveries')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${tab === 'deliveries' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            Pengantaran ({deliveries.length})
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          {loading ? (
            <div className="p-10 flex justify-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : tab === 'pickups' ? (
            pickups.length === 0 ? (
              <div className="p-10 text-center text-gray-500">Belum ada riwayat pickup</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3 text-left font-medium">Pelanggan</th>
                    <th className="px-6 py-3 text-left font-medium">Alamat</th>
                    <th className="px-6 py-3 text-left font-medium">Tiba di Outlet</th>
                  </tr>
                </thead>
                <tbody>
                  {pickups.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold text-gray-900">
                        {p.customer.firstName} {p.customer.lastName}
                      </td>
                      <td className="px-6 py-3 text-gray-600 text-xs max-w-xs truncate">{p.address.fullAddress}</td>
                      <td className="px-6 py-3 text-gray-600">{fmt(p.arrivedAtOutlet)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            deliveries.length === 0 ? (
              <div className="p-10 text-center text-gray-500">Belum ada riwayat pengantaran</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3 text-left font-medium">Invoice</th>
                    <th className="px-6 py-3 text-left font-medium">Alamat</th>
                    <th className="px-6 py-3 text-left font-medium">Waktu Antar</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d) => (
                    <tr key={d.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold text-gray-900">{d.order.invoiceNumber}</td>
                      <td className="px-6 py-3 text-gray-600 text-xs max-w-xs truncate">{d.address.fullAddress}</td>
                      <td className="px-6 py-3 text-gray-600">{fmt(d.deliveredAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
