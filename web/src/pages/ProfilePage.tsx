import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const roleLabel: Record<string, string> = {
    worker: 'Worker',
    driver: 'Driver',
    outlet_admin: 'Outlet Admin',
    super_admin: 'Super Admin',
    customer: 'Customer',
  };
  const employment = user?.outletEmployees?.[0];
  const allRoleNames = (user?.userRoles ?? []).map((ur) => ur.role.name);
  const employeeRoleNames = allRoleNames.filter((name) => name !== 'customer');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please login first</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 sm:pt-28 pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account information</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              {/* Profile Picture */}
              <div className="flex items-center gap-6 mb-8 pb-8 border-b">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                  {user.photoUrl ? (
                    <img
                      src={user.photoUrl}
                      alt={user.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <svg
                      className="w-12 h-12 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {allRoleNames.map((name) => (
                      <span
                        key={name}
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                      >
                        {roleLabel[name] ?? name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {!isEditing ? (
                <>
                  {/* Profile Info */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-semibold text-gray-900">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-8 w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Edit Profile
                  </button>
                </>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Employment Info */}
            {employment && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Employment Info</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Outlet</p>
                    <p className="font-semibold text-gray-900">{employment.outlet.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Role</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {employeeRoleNames.map((name) => (
                        <span
                          key={name}
                          className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                        >
                          {roleLabel[name] ?? name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${employment.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="font-semibold text-gray-900">
                        {employment.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500">Bergabung Sejak</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(employment.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Account Settings */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Account Settings</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                  Change Password
                </button>
                <button className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                  Update Email
                </button>
                <button className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                  Upload Profile Picture
                </button>
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Verification Status</h3>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${user.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="font-semibold text-gray-900">
                  {user.isVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
              {!user.isVerified && (
                <button className="w-full text-sm text-blue-600 hover:underline">
                  Verify Email
                </button>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white font-semibold py-2 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
