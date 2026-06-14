import { useLocation, useNavigate, Link } from 'react-router-dom';

export default function CheckEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as any)?.email || '';

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-gray-600 mb-4">No email provided</p>
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">
            Go back to register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">Check Your Email</h1>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            We've sent a verification email to:
          </p>
          <p className="text-lg font-semibold text-blue-600 break-all">{email}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-700 font-medium mb-2">What to do next:</p>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Check your email inbox for a verification link</li>
            <li>Click the link to verify your email</li>
            <li>Set your password on the verification page</li>
            <li>Login with your credentials</li>
          </ol>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600">
            The verification link will expire in 1 hour.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Go to Login
          </button>
          <p className="text-sm text-gray-600">
            Didn't receive the email?{' '}
            <Link to="/verify-email" className="text-blue-600 font-semibold hover:underline">
              Resend verification
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
