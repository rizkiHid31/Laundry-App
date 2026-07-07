import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';

interface OrderRecord {
  id: string;
  invoiceNumber: string;
  totalPrice: string | null;
  updatedAt: string;
  payment: { status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'; amount: string; paidAt: string | null } | null;
  pickupRequest: { customer: { name: string } };
}

interface Meta { page: number; totalPages: number; total: number; }

const paymentStatusStyle: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-200 text-gray-600',
};
const paymentStatusLabel: Record<string, string> = {
  PENDING: 'Belum Bayar', PAID: 'Lunas', FAILED: 'Gagal', EXPIRED: 'Kedaluwarsa',
};

export default function OrdersWaitingPaymentPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/workers/orders/waiting-payment', { params: { page, limit: 20 } });
      setOrders(res.data.data ?? []);
      setMeta(res.data.meta ?? { page: 1, totalPages: 1, total: 0 });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleRetry = async (orderId: string) => {
    setProcessingId(orderId);
    setError('');
    try {
      await api.post(`/api/workers/orders/${orderId}/retry-payment`);
      await fetchOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memproses order');
    } finally {
      setProcessingId(null);
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-4 pt-20 sm:pt-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Menunggu Pembayaran</h1>
        <p className="text-sm text-gray-500 mb-6">
          Order yang sudah selesai packing tapi belum dibayar. Setelah customer membayar, klik "Cek &amp; Lanjutkan"
          agar order lanjut ke tahap pengiriman dan bisa diambil driver.
        </p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Memuat...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Invoice</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-center">Total</th>
                  <th className="px-4 py-3 text-center">Status Bayar</th>
                  <th className="px-4 py-3 text-center">Update Terakhir</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Tidak ada order menunggu pembayaran</td></tr>
                ) : orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{o.invoiceNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{o.pickupRequest.customer.name}</td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {o.totalPrice ? `Rp${Number(o.totalPrice).toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatusStyle[o.payment?.status ?? 'PENDING']}`}>
                        {paymentStatusLabel[o.payment?.status ?? 'PENDING']}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{fmtDate(o.updatedAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRetry(o.id)}
                        disabled={o.payment?.status !== 'PAID' || processingId === o.id}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={o.payment?.status !== 'PAID' ? 'Customer belum membayar' : undefined}
                      >
                        {processingId === o.id ? 'Memproses...' : 'Cek & Lanjutkan'}
                      </button>
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
