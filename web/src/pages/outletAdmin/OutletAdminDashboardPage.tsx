import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface OutletMetrics {
  totalOrders: number;
  ordersToday: number;
  totalRevenue: number;
  revenueToday: number;
  activeStations: number;
  activeEmployees: number;
}

interface Order {
  id: string;
  invoiceNumber: string;
  status: 'PROCESSING' | 'READY' | 'DELIVERED';
  totalPrice: number;
  totalKg: number;
  customer: { name: string };
  createdAt: string;
}

interface Employee {
  id: string;
  user: { name: string; email: string };
  isActive: boolean;
}

const statusColors: Record<string, string> = {
  PROCESSING: 'bg-orange-100 text-orange-800',
  READY: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-blue-100 text-blue-800',
};

export default function OutletAdminDashboardPage() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const [metrics, setMetrics] = useState<OutletMetrics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'employees'>('overview');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [metricsRes, ordersRes, employeesRes] = await Promise.all([
          fetch(`${API}/api/admin/metrics`, { headers }),
          fetch(`${API}/api/admin/orders?limit=10`, { headers }),
          fetch(`${API}/api/admin/employees`, { headers }),
        ]);

        const metricsData = await metricsRes.json();
        const ordersData = await ordersRes.json();
        const employeesData = await employeesRes.json();

        if (metricsRes.ok) setMetrics(metricsData.data);
        if (ordersRes.ok) setOrders(ordersData.data || []);
        if (employeesRes.ok) setEmployees(employeesData.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setMessage('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading outlet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Outlet Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome, {user?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {message && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{message}</div>}

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-500 text-xs font-medium uppercase">Total Orders</div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{metrics.totalOrders}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-500 text-xs font-medium uppercase">Today</div>
              <div className="text-2xl font-bold text-blue-600 mt-2">{metrics.ordersToday}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-500 text-xs font-medium uppercase">Total Revenue</div>
              <div className="text-2xl font-bold text-gray-900 mt-2">Rp{(metrics.totalRevenue / 1000000).toFixed(1)}M</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-500 text-xs font-medium uppercase">Today's Revenue</div>
              <div className="text-2xl font-bold text-green-600 mt-2">Rp{(metrics.revenueToday / 1000).toFixed(0)}K</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-500 text-xs font-medium uppercase">Stations Active</div>
              <div className="text-2xl font-bold text-purple-600 mt-2">{metrics.activeStations}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-500 text-xs font-medium uppercase">Employees</div>
              <div className="text-2xl font-bold text-orange-600 mt-2">{metrics.activeEmployees}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-4 text-center font-medium ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-6 py-4 text-center font-medium ${
                activeTab === 'orders'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Recent Orders
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex-1 px-6 py-4 text-center font-medium ${
                activeTab === 'employees'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Employees
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-gray-600">Orders This Week</span>
                      <span className="font-semibold">{metrics?.ordersToday}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-gray-600">Active Stations</span>
                      <span className="font-semibold">{metrics?.activeStations}/3</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-gray-600">Active Employees</span>
                      <span className="font-semibold">{metrics?.activeEmployees}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded border border-green-200">
                      <p className="text-sm text-gray-600">Today's Revenue</p>
                      <p className="text-2xl font-bold text-green-600">Rp{(metrics?.revenueToday || 0).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-blue-600">Rp{(metrics?.totalRevenue || 0).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="divide-y">
              {orders.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">No orders found</div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{order.invoiceNumber}</h4>
                        <p className="text-sm text-gray-600 mt-1">Customer: {order.customer?.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('id-ID')} -{' '}
                          {new Date(order.createdAt).toLocaleTimeString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                        <p className="text-xl font-bold text-gray-900 mt-2">
                          Rp{order.totalPrice?.toLocaleString('id-ID')}
                        </p>
                        <p className="text-sm text-gray-500">{order.totalKg} kg</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div className="divide-y">
              {employees.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">No employees found</div>
              ) : (
                employees.map((emp) => (
                  <div key={emp.id} className="p-6 hover:bg-gray-50 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">{emp.user?.name}</h4>
                      <p className="text-sm text-gray-600">{emp.user?.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          emp.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
