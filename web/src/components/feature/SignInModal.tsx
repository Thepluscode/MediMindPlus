import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';
import logger from '../../utils/logger';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

export default function SignInModal({ isOpen, onClose, defaultMode = 'signin' }: SignInModalProps) {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsSignUp(defaultMode === 'signup');
      setError('');
    }
  }, [isOpen, defaultMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Split full name into first and last name
        const nameParts = name.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        await authService.register({
          firstName,
          lastName,
          email,
          password
        });
      } else {
        await authService.login(email, password);
      }

      logger.info('Auth form submitted successfully', {
        service: 'auth',
        mode: isSignUp ? 'signup' : 'signin',
      });

      onClose();
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Something went wrong. Please try again.';
      setError(msg);
      logger.error('Auth form error', { service: 'auth', error: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer z-10"
        >
          <i className="ri-close-line text-xl"></i>
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-blue-50 to-teal-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
              <i className="ri-brain-line text-white text-2xl"></i>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
              MediMindPlus
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            {isSignUp
              ? 'Start your journey to better health'
              : 'Sign in to access your health dashboard'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6">
          {isSignUp && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <i className="ri-user-line text-slate-400 text-lg"></i>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                <i className="ri-mail-line text-slate-400 text-lg"></i>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                <i className="ri-lock-line text-slate-400 text-lg"></i>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-lg`}></i>
              </button>
            </div>
          </div>

          {!isSignUp && (
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer whitespace-nowrap"
              >
                Forgot password?
              </button>
            </div>
          )}

          {isSignUp && (
            <div className="mb-6">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  required
                />
                <span className="text-sm text-slate-600">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading
              ? (isSignUp ? 'Creating Account...' : 'Signing In...')
              : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-google-fill text-lg text-red-500"></i>
              <span className="text-sm font-medium text-slate-700">Google</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-apple-fill text-lg text-slate-800"></i>
              <span className="text-sm font-medium text-slate-700">Apple</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 pb-8 text-center">
          <p className="text-sm text-slate-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer whitespace-nowrap"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
