import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useApi } from '../../hooks/useApi';

interface Pickup {
  id: string;
  status: string;
  scheduledAt: string;
  customer: { firstName: string; lastName: string };
  address: { label: string; fullAddress: string };
}

interface Delivery {
  id: string;
  status: string;
  order: { invoiceNumber: string; totalPrice: number | null };
  address: { label: string; fullAddress: string };
}

export default function DriverDashboardPage() {
  const { apiFetch } = useApi();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, dRes] = await Promise.all([
        apiFetch('/driver/pickups'),
        apiFetch('/driver/deliveries'),
      ]);
      setPickups(pRes.data);
      setDeliveries(dRes.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const doAction = async (key: string, fn: () => Promise<void>, successMsg: string) => {
    setActionLoading(key);
    setError('');
    setSuccess('');
    try {
      await fn();
      setSuccess(successMsg);
      await fetchAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Aksi gagal');
    } finally {
      setActionLoading(null);
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Driver</h1>
            <p className="text-gray-600 mt-1">Kelola pickup dan pengantaran</p>
          </div>
          <button onClick={fetchAll}
            className="px-4 py-2 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition">
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
            {error.toLowerCase().includes('check in') && (
              <p className="text-red-600 mt-1 text-sm">
                Silakan <Link to="/attendance" className="underline font-semibold">lakukan Check-in</Link> terlebih dahulu.
              </p>
            )}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pickups */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Pickup Menunggu
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">{pickups.length}</span>
              </h2>
              {pickups.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                  Tidak ada pickup yang menunggu
                </div>
              ) : (
                <div className="space-y-3">
                  {pickups.map((p) => (
                    <div key={p.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-lg">
                            {p.customer.firstName} {p.customer.lastName}
                          </p>
                          <p className="text-gray-600 mt-1">{p.address.fullAddress}</p>
                          <p className="text-sm text-gray-500 mt-1">Jadwal: {fmtDate(p.scheduledAt)}</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end shrink-0">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
                            {p.status.replace(/_/g, ' ')}
                          </span>
                          {p.status === 'WAITING_DRIVER' && (
                            <button
                              onClick={() => doAction(p.id + 'accept', () => apiFetch(`/driver/pickups/${p.id}/accept`, { method: 'POST' }), 'Pickup diterima! Segera menuju ke lokasi pelanggan.')}
                              disabled={actionLoading === p.id + 'accept'}
                              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                              Ambil Pickup
                            </button>
                          )}
                          {p.status === 'ON_THE_WAY' && (
                            <button
                              onClick={() => doAction(p.id + 'arrived', () => apiFetch(`/driver/pickups/${p.id}/arrived`, { method: 'PATCH' }), 'Status diperbarui: Tiba di outlet')}
                              disabled={actionLoading === p.id + 'arrived'}
                              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                              Tiba di Outlet
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Deliveries */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Pengantaran Menunggu
                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">{deliveries.length}</span>
              </h2>
              {deliveries.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                  Tidak ada pengantaran yang menunggu
                </div>
              ) : (
                <div className="space-y-3">
                  {deliveries.map((d) => (
                    <div key={d.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-lg">{d.order.invoiceNumber}</p>
                          <p className="text-gray-600 mt-1">{d.address.fullAddress}</p>
                          {d.order.totalPrice && (
                            <p className="text-sm text-gray-500 mt-1">
                              Total: Rp {Number(d.order.totalPrice).toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 items-end shrink-0">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                            {d.status.replace(/_/g, ' ')}
                          </span>
                          {d.status === 'WAITING_DRIVER' && (
                            <button
                              onClick={() => doAction(d.id + 'accept', () => apiFetch(`/driver/deliveries/${d.id}/accept`, { method: 'POST' }), 'Pengantaran dimulai!')}
                              disabled={actionLoading === d.id + 'accept'}
                              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                              Antar Sekarang
                            </button>
                          )}
                          {d.status === 'ON_THE_WAY' && (
                            <button
                              onClick={() => doAction(d.id + 'delivered', () => apiFetch(`/driver/deliveries/${d.id}/delivered`, { method: 'PATCH' }), 'Order berhasil diantarkan!')}
                              disabled={actionLoading === d.id + 'delivered'}
                              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                              Sudah Diantar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
