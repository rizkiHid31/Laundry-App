import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface PickupRequest {
  id: string;
  scheduledAt: string;
  status: 'WAITING_DRIVER' | 'DRIVER_ACCEPTED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  address: {
    label: string;
    fullAddress: string;
    latitude: number;
    longitude: number;
  };
  outlet: {
    name: string;
    latitude: number;
    longitude: number;
  };
}

interface Order {
  id: string;
  invoiceNumber: string;
  status: string;
  totalPrice: number;
  totalKg: number;
  createdAt: string;
  pickupRequest: PickupRequest;
}

const statusColors: Record<string, string> = {
  WAITING_DRIVER: 'bg-yellow-100 text-yellow-800',
  DRIVER_ACCEPTED: 'bg-blue-100 text-blue-800',
  IN_TRANSIT: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  PROCESSING: 'bg-orange-100 text-orange-800',
  READY: 'bg-green-100 text-green-800',
  READY_TO_DELIVER: 'bg-teal-100 text-teal-800',
  ON_DELIVERY: 'bg-sky-100 text-sky-800',
  WAITING_PAYMENT: 'bg-amber-100 text-amber-800',
  WASHING: 'bg-blue-100 text-blue-800',
  IRONING: 'bg-indigo-100 text-indigo-800',
  PACKING: 'bg-violet-100 text-violet-800',
};

const getStatusIcon = (status: string) => {
  const icons: Record<string, string> = {
    WAITING_DRIVER: '⏳',
    DRIVER_ACCEPTED: '✅',
    IN_TRANSIT: '🚗',
    DELIVERED: '📦',
    CANCELLED: '❌',
    PROCESSING: '⚙️',
    READY: '✨',
    READY_TO_DELIVER: '📦',
    ON_DELIVERY: '🚚',
    WAITING_PAYMENT: '💳',
    WASHING: '🧺',
    IRONING: '🧼',
    PACKING: '📦',
  };
  return icons[status] || '•';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    WAITING_DRIVER: 'Waiting for Driver',
    DRIVER_ACCEPTED: 'Driver Accepted',
    IN_TRANSIT: 'In Transit',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    PROCESSING: 'Processing',
    READY: 'Ready',
    READY_TO_DELIVER: 'Ready to Deliver',
    ON_DELIVERY: 'On Delivery',
    WAITING_PAYMENT: 'Awaiting Payment',
    WASHING: 'Washing',
    IRONING: 'Ironing',
    PACKING: 'Packing',
  };
  return labels[status] || status;
};

export default function CustomerDashboardPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API}/api/customers/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setOrders(data.data || []);
      } catch {
        setMessage('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const activeOrders = orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === 'DELIVERED');
  const totalSpent = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
              <p className="text-blue-100">Manage your laundry orders and track deliveries</p>
            </div>
            <button
              onClick={() => navigate('/customer/orders/new')}
              className="bg-white text-blue-600 px-5 sm:px-6 py-2 sm:py-3 rounded-lg font-bold hover:bg-blue-50 transition transform hover:scale-105"
            >
              + New Order
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/20 backdrop-blur rounded-lg p-4 border border-white/30">
              <div className="text-blue-100 text-sm font-medium">Active Orders</div>
              <div className="text-3xl sm:text-4xl font-bold text-white mt-2">{activeOrders.length}</div>
              <div className="text-xs text-blue-100 mt-1">In progress</div>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg p-4 border border-white/30">
              <div className="text-blue-100 text-sm font-medium">Completed</div>
              <div className="text-3xl sm:text-4xl font-bold text-white mt-2">{completedOrders.length}</div>
              <div className="text-xs text-blue-100 mt-1">Delivered</div>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg p-4 border border-white/30">
              <div className="text-blue-100 text-sm font-medium">Total Spent</div>
              <div className="text-2xl sm:text-3xl font-bold text-white mt-2">
                Rp{(totalSpent / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-blue-100 mt-1">Lifetime</div>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg p-4 border border-white/30">
              <div className="text-blue-100 text-sm font-medium">Total Orders</div>
              <div className="text-3xl sm:text-4xl font-bold text-white mt-2">{orders.length}</div>
              <div className="text-xs text-blue-100 mt-1">All time</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {message && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-medium">
            {message}
          </div>
        )}

        {/* Active Orders Section */}
        {activeOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">⚡ Active Orders</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition transform hover:scale-105 overflow-hidden border-l-4 border-blue-500">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Invoice</p>
                        <p className="text-lg font-bold text-gray-900">{order.invoiceNumber}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status]}`}>
                        {getStatusIcon(order.status)} {getStatusLabel(order.status)}
                      </span>
                    </div>

                    {/* Info Grid */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-start gap-2">
                        <span className="text-lg mt-0.5">📍</span>
                        <div className="text-sm">
                          <p className="font-semibold text-gray-900">{order.pickupRequest.address.label}</p>
                          <p className="text-gray-600">{order.pickupRequest.outlet.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span>📅</span>
                        <span className="text-gray-700">{new Date(order.pickupRequest.scheduledAt).toLocaleString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span>⚖️</span>
                        <span className="text-gray-700 font-semibold">{order.totalKg} kg</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-gray-600 font-medium">Total Amount</p>
                      <p className="text-2xl font-bold text-blue-600">Rp{(order.totalPrice || 0).toLocaleString('id-ID')}</p>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => navigate(`/customer/orders/${order.id}`)}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                    >
                      Track Order →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Orders Section */}
        {completedOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">✅ Completed Orders</h2>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="divide-y">
                {completedOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="p-4 sm:p-6 hover:bg-gray-50 cursor-pointer transition flex items-center justify-between"
                    onClick={() => navigate(`/customer/orders/${order.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl">✅</span>
                        <h3 className="font-bold text-gray-900">{order.invoiceNumber}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${statusColors[order.status]}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        📍 {order.pickupRequest.address.label} • {order.totalKg} kg • {new Date(order.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">Rp{(order.totalPrice || 0).toLocaleString('id-ID')}</p>
                      <p className="text-xs text-blue-600 hover:text-blue-700 font-semibold">View Details →</p>
                    </div>
                  </div>
                ))}
              </div>
              {completedOrders.length > 5 && (
                <div className="p-4 text-center bg-gray-50">
                  <button
                    onClick={() => navigate('/customer/orders')}
                    className="text-blue-600 hover:text-blue-700 font-bold text-sm"
                  >
                    View all {completedOrders.length} completed orders →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {orders.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">Start your laundry journey with us. Place your first order now!</p>
            <button
              onClick={() => navigate('/customer/orders/new')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold"
            >
              Place Your First Order
            </button>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="bg-white rounded-lg p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/addresses')}>
            <div className="text-4xl mb-3">📍</div>
            <h3 className="font-bold text-gray-900 mb-2">Manage Addresses</h3>
            <p className="text-sm text-gray-600">Add, edit, or remove your saved addresses</p>
          </div>
          <div className="bg-white rounded-lg p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/customer/orders/new')}>
            <div className="text-4xl mb-3">➕</div>
            <h3 className="font-bold text-gray-900 mb-2">Create New Order</h3>
            <p className="text-sm text-gray-600">Place a new laundry order in seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
}
