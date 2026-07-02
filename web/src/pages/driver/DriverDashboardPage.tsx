import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [activePickup, setActivePickup] = useState<Pickup | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [availPickups, setAvailPickups] = useState<Pickup[]>([]);
  const [availDeliveries, setAvailDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchAll = useCallback(async () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const [ap, ad, vp, vd] = await Promise.all([
      fetch(`${API}/api/drivers/pickups/active`, { headers }).then((r) => r.json()),
      fetch(`${API}/api/drivers/deliveries/active`, { headers }).then((r) => r.json()),
      fetch(`${API}/api/drivers/pickups/available`, { headers }).then((r) => r.json()),
      fetch(`${API}/api/drivers/deliveries/available`, { headers }).then((r) => r.json()),
    ]);

    setActivePickup(ap.data ?? null);
    setActiveDelivery(ad.data ?? null);
    setAvailPickups(vp.data ?? []);
    setAvailDeliveries(vd.data ?? []);
  }, [token]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (active) setLoading(true);
      try {
        await fetchAll();
      } finally {
        if (active) setLoading(false);
      }
    };

    if (token) {
      void load();
    }

    return () => {
      active = false;
    };
  }, [token, fetchAll]);

  const action = async (url: string, method = 'POST') => {
    if (!token) return;
    setMessage('');
    const res = await fetch(`${API}${url}`, { method, headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setMessage(data.message);
    if (res.ok) await fetchAll();
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Memuat...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Driver</h1>
        <button
          onClick={handleLogout}
          className="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
        >
          Logout
        </button>
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
