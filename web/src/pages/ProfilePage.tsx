import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile, updatePassword, updateEmail, uploadProfilePicture, resendVerificationEmail, logout } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    province: user?.province || '',
    postalCode: user?.postalCode || '',
  });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [emailData, setEmailData] = useState({ newEmail: user?.email || '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      await updatePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateEmail(emailData.newEmail);
      setSuccess('Verification email sent to the new address');
      setShowEmailForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!photoFile) throw new Error('Please choose a photo');
      await uploadProfilePicture(photoFile);
      setSuccess('Profile picture uploaded successfully');
      setShowPhotoForm(false);
      setPhotoFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await resendVerificationEmail(user.email);
      setSuccess('Verification email sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  const profilePhoto = user.profilePicture || user.photoUrl;

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
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
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt={user.firstName}
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
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()}
                  </p>
                </div>
              </div>

              {!isEditing ? (
                <>
                  {/* Profile Info */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">First Name</p>
                        <p className="font-semibold text-gray-900">{user.firstName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Name</p>
                        <p className="font-semibold text-gray-900">{user.lastName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-semibold text-gray-900">{user.phone || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-semibold text-gray-900">{user.email}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-semibold text-gray-900">{user.address || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">City</p>
                        <p className="font-semibold text-gray-900">{user.city || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Province</p>
                        <p className="font-semibold text-gray-900">{user.province || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Postal Code</p>
                        <p className="font-semibold text-gray-900">{user.postalCode || 'Not set'}</p>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-gray-700 font-medium mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-gray-700 font-medium mb-2">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Province</label>
                      <input
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-gray-700 font-medium mb-2">Postal Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
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
            {/* Account Settings */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Account Settings</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowPasswordForm((prev) => !prev);
                    setShowEmailForm(false);
                    setShowPhotoForm(false);
                  }}
                  className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  {showPasswordForm ? 'Hide Password Form' : 'Change Password'}
                </button>
                <button
                  onClick={() => {
                    setShowEmailForm((prev) => !prev);
                    setShowPasswordForm(false);
                    setShowPhotoForm(false);
                  }}
                  className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  {showEmailForm ? 'Hide Email Form' : 'Update Email'}
                </button>
                <button
                  onClick={() => {
                    setShowPhotoForm((prev) => !prev);
                    setShowPasswordForm(false);
                    setShowEmailForm(false);
                  }}
                  className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  {showPhotoForm ? 'Hide Photo Form' : 'Upload Profile Picture'}
                </button>
              </div>

              {showPasswordForm && (
                <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Current password"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="New password"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50">
                    {loading ? 'Saving...' : 'Update Password'}
                  </button>
                </form>
              )}

              {showEmailForm && (
                <form onSubmit={handleEmailSubmit} className="mt-4 space-y-3">
                  <input
                    type="email"
                    value={emailData.newEmail}
                    onChange={(e) => setEmailData({ newEmail: e.target.value })}
                    placeholder="New email"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50">
                    {loading ? 'Sending...' : 'Send Verification'}
                  </button>
                </form>
              )}

              {showPhotoForm && (
                <form onSubmit={handlePhotoSubmit} className="mt-4 space-y-3">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="w-full text-sm"
                  />
                  <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50">
                    {loading ? 'Uploading...' : 'Upload Photo'}
                  </button>
                </form>
              )}
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
                <button onClick={handleVerifyEmail} disabled={loading} className="w-full text-sm text-blue-600 hover:underline disabled:opacity-50">
                  {loading ? 'Sending...' : 'Verify Email'}
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
