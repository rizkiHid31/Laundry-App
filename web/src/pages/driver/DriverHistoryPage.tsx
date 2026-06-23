import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';

interface PickupRecord {
  id: string;
  arrivedAtOutlet: string;
  customer: { name: string };
  address: { label: string; fullAddress: string };
}

interface DeliveryRecord {
  id: string;
  deliveredAt: string;
  order: { invoiceNumber: string; totalPrice: number };
  address: { label: string; fullAddress: string };
}

interface Meta { page: number; totalPages: number; total: number; }

export default function DriverHistoryPage() {
  const [tab, setTab] = useState<'pickup' | 'delivery'>('pickup');
  const [pickups, setPickups] = useState<PickupRecord[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [pickupMeta, setPickupMeta] = useState<Meta>({ page: 1, totalPages: 1, total: 0 });
  const [deliveryMeta, setDeliveryMeta] = useState<Meta>({ page: 1, totalPages: 1, total: 0 });
  const [pickupPage, setPickupPage] = useState(1);
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPickups = useCallback(async () => {
    const res = await api.get('/api/drivers/pickups/history', { params: { page: pickupPage, limit: 10 } });
    setPickups(res.data.data ?? []);
    setPickupMeta(res.data.meta ?? { page: 1, totalPages: 1, total: 0 });
  }, [pickupPage]);

  const fetchDeliveries = useCallback(async () => {
    const res = await api.get('/api/drivers/deliveries/history', { params: { page: deliveryPage, limit: 10 } });
    setDeliveries(res.data.data ?? []);
    setDeliveryMeta(res.data.meta ?? { page: 1, totalPages: 1, total: 0 });
  }, [deliveryPage]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPickups(), fetchDeliveries()]).finally(() => setLoading(false));
  }, [fetchPickups, fetchDeliveries]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const Pagination = ({ meta, onPage }: { meta: Meta; onPage: (p: number) => void }) =>
    meta.totalPages > 1 ? (
      <div className="flex justify-center gap-2 mt-4">
        <button onClick={() => onPage(Math.max(1, meta.page - 1))} disabled={meta.page === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-40">Prev</button>
        <span className="px-3 py-1 text-sm text-gray-600">{meta.page} / {meta.totalPages}</span>
        <button onClick={() => onPage(Math.min(meta.totalPages, meta.page + 1))} disabled={meta.page === meta.totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-40">Next</button>
      </div>
    ) : null;

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Memuat...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Riwayat Driver</h1>

      <div className="flex bg-white rounded-xl shadow-sm mb-4 p-1">
        {(['pickup', 'delivery'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'pickup' ? `Pickup (${pickupMeta.total})` : `Delivery (${deliveryMeta.total})`}
          </button>
        ))}
      </div>

      {tab === 'pickup' ? (
        <div className="bg-white rounded-xl shadow-sm p-4">
          {pickups.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Belum ada riwayat pickup</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {pickups.map((p) => (
                <li key={p.id} className="py-3">
                  <p className="font-medium text-gray-800 text-sm">{p.customer.name}</p>
                  <p className="text-xs text-gray-500">{p.address.fullAddress}</p>
                  <p className="text-xs text-gray-400 mt-1">Tiba: {fmtDate(p.arrivedAtOutlet)}</p>
                </li>
              ))}
            </ul>
          )}
          <Pagination meta={pickupMeta} onPage={setPickupPage} />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-4">
          {deliveries.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Belum ada riwayat delivery</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {deliveries.map((d) => (
                <li key={d.id} className="py-3">
                  <p className="font-medium text-gray-800 text-sm">{d.order.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">{d.address.fullAddress}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Dikirim: {fmtDate(d.deliveredAt)} · Rp {Number(d.order.totalPrice).toLocaleString('id-ID')}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Pagination meta={deliveryMeta} onPage={setDeliveryPage} />
        </div>
      )}
    </div>
  );
}
