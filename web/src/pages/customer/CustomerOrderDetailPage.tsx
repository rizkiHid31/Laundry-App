import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface OrderItem {
  id: string;
  quantity: number;
  pricePerUnit: number;
  laundryItem: { name: string; unit: string };
}

interface OrderDetail {
  id: string;
  invoiceNumber: string;
  status: string;
  totalPrice: number;
  totalKg: number;
  createdAt: string;
  pickupRequest: {
    scheduledAt: string;
    address: { label: string; fullAddress: string };
    outlet: { name: string };
  };
  orderItems: OrderItem[];
}

const statusColors: Record<string, string> = {
  PROCESSING: 'bg-orange-100 text-orange-800',
  WASHING: 'bg-blue-100 text-blue-800',
  IRONING: 'bg-indigo-100 text-indigo-800',
  PACKING: 'bg-violet-100 text-violet-800',
  WAITING_PAYMENT: 'bg-amber-100 text-amber-800',
  READY_TO_DELIVER: 'bg-teal-100 text-teal-800',
  ON_DELIVERY: 'bg-sky-100 text-sky-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CONFIRMED: 'bg-green-100 text-green-800',
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PROCESSING: 'Processing',
    WASHING: 'Washing',
    IRONING: 'Ironing',
    PACKING: 'Packing',
    WAITING_PAYMENT: 'Waiting Payment',
    READY_TO_DELIVER: 'Ready to Deliver',
    ON_DELIVERY: 'On Delivery',
    DELIVERED: 'Delivered',
    CONFIRMED: 'Confirmed',
  };
  return labels[status] || status;
};

export default function CustomerOrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !orderId) return;

    const fetchOrder = async () => {
      try {
        const response = await fetch(`${API}/api/customers/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch order details');
        }
        setOrder(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [token, orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-2xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <p className="text-rose-700 text-lg font-semibold">{error}</p>
          <button
            onClick={() => navigate('/customer/orders')}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Order Details</h1>
            <p className="text-slate-600 mt-2">Track your laundry order progress and review order summary.</p>
          </div>
          <button
            onClick={() => navigate('/customer/orders')}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Orders
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Invoice</p>
              <h2 className="text-2xl font-semibold text-slate-900">{order.invoiceNumber}</h2>
            </div>
            <div className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${statusColors[order.status] ?? 'bg-slate-100 text-slate-700'}`}>
              {getStatusLabel(order.status)}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Pickup Address</p>
              <p className="font-semibold text-slate-900">{order.pickupRequest.address.label}</p>
              <p className="text-sm text-slate-600">{order.pickupRequest.address.fullAddress}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Scheduled</p>
              <p className="font-semibold text-slate-900">{new Date(order.pickupRequest.scheduledAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              <p className="text-sm text-slate-600">Outlet: {order.pickupRequest.outlet.name}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Order Total</p>
              <p className="text-2xl font-bold text-slate-900">Rp{Number(order.totalPrice).toLocaleString('id-ID')}</p>
              <p className="text-sm text-slate-600">{order.totalKg} kg</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Items</h3>
            <div className="grid gap-4">
              {order.orderItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{item.laundryItem.name}</p>
                      <p className="text-sm text-slate-600">{item.laundryItem.unit}</p>
                    </div>
                    <div className="text-sm text-slate-600">
                      Qty: {item.quantity} • Rp{Number(item.pricePerUnit).toLocaleString('id-ID')} / unit
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
