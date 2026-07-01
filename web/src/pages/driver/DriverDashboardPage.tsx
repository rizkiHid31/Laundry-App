import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

interface Pickup {
  id: string;
  scheduledAt: string;
  status: string;
  customer: { name: string };
  address: { label: string; fullAddress: string };
}

interface Delivery {
  id: string;
  createdAt: string;
  status: string;
  order: { invoiceNumber: string; totalPrice: number };
  address: { label: string; fullAddress: string };
}

export default function DriverDashboardPage() {
  const [activePickup, setActivePickup] = useState<Pickup | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [availPickups, setAvailPickups] = useState<Pickup[]>([]);
  const [availDeliveries, setAvailDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchAll = useCallback(async () => {
    const [ap, ad, vp, vd] = await Promise.all([
      api.get('/api/drivers/pickups/active'),
      api.get('/api/drivers/deliveries/active'),
      api.get('/api/drivers/pickups/available'),
      api.get('/api/drivers/deliveries/available'),
    ]);
    setActivePickup(ap.data.data ?? null);
    setActiveDelivery(ad.data.data ?? null);
    setAvailPickups(vp.data.data ?? []);
    setAvailDeliveries(vd.data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const action = async (url: string, method: 'POST' | 'PATCH' = 'POST') => {
    setMessage('');
    try {
      const res = await api({ method, url });
      setMessage(res.data.message);
      fetchAll();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Memuat...</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-4 pt-20 sm:pt-24 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Driver</h1>
        <Link to="/driver/history" className="text-sm text-blue-600 font-medium hover:underline">
          Riwayat →
        </Link>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">{message}</div>
      )}

      {/* Order Aktif */}
      {(activePickup || activeDelivery) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-yellow-700 uppercase mb-3">Order Aktif</p>
          {activePickup && (
            <div>
              <p className="font-medium text-gray-800">{activePickup.customer.name}</p>
              <p className="text-sm text-gray-500 mb-3">{activePickup.address.fullAddress}</p>
              <button
                onClick={() => action(`/api/drivers/pickups/${activePickup.id}/arrive`, 'PATCH')}
                className="w-full py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600"
              >
                Tiba di Outlet
              </button>
            </div>
          )}
          {activeDelivery && (
            <div>
              <p className="font-medium text-gray-800">Invoice: {activeDelivery.order.invoiceNumber}</p>
              <p className="text-sm text-gray-500 mb-3">{activeDelivery.address.fullAddress}</p>
              <button
                onClick={() => action(`/api/drivers/deliveries/${activeDelivery.id}/complete`, 'PATCH')}
                className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Selesai Antar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pickup Tersedia */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
          Pickup Tersedia ({availPickups.length})
        </h2>
        {availPickups.length === 0 ? (
          <p className="text-center text-gray-400 py-4 text-sm">Tidak ada pickup</p>
        ) : (
          <ul className="space-y-3">
            {availPickups.map((p) => (
              <li key={p.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{p.customer.name}</p>
                    <p className="text-xs text-gray-500">{p.address.label} · {p.address.fullAddress}</p>
                    <p className="text-xs text-gray-400 mt-1">Jadwal: {fmtDate(p.scheduledAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => action(`/api/drivers/pickups/${p.id}/accept`)}
                  disabled={!!activePickup || !!activeDelivery}
                  className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-blue-700"
                >
                  Ambil Pickup
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delivery Tersedia */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
          Delivery Tersedia ({availDeliveries.length})
        </h2>
        {availDeliveries.length === 0 ? (
          <p className="text-center text-gray-400 py-4 text-sm">Tidak ada delivery</p>
        ) : (
          <ul className="space-y-3">
            {availDeliveries.map((d) => (
              <li key={d.id} className="border rounded-lg p-3">
                <div className="mb-2">
                  <p className="font-medium text-gray-800 text-sm">{d.order.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">{d.address.label} · {d.address.fullAddress}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Rp {Number(d.order.totalPrice).toLocaleString('id-ID')}
                  </p>
                </div>
                <button
                  onClick={() => action(`/api/drivers/deliveries/${d.id}/accept`)}
                  disabled={!!activePickup || !!activeDelivery}
                  className="w-full py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-green-700"
                >
                  Ambil Delivery
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
