import { useState, useEffect } from 'react';
import { User, Eye, EyeOff } from 'lucide-react';
import { Header } from '@/app/components/Header';
import { supabase } from '@/lib/supabase';

type NavPage = 'home' | 'buy' | 'rent' | 'consultation' | 'category' | 'blog' | 'about' | 'account' | 'signup' | 'favorites';
type AccountView = 'signin' | 'forgot' | 'reset';

interface MyAccountPageProps {
  onNavigate: (page: NavPage) => void;
}

export function MyAccountPage({ onNavigate }: MyAccountPageProps) {
  const [view, setView] = useState<AccountView>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // メールのリセットリンクで開いた場合、URL の #type=recovery を即チェック（イベントより先に発火する場合があるため）
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      if (params.get('type') === 'recovery') {
        setView('reset');
      }
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setView('reset');
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    onNavigate('favorites');
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    const trimEmail = email.trim();
    if (!trimEmail) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    const redirectTo = `${window.location.origin}/account`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(trimEmail, { redirectTo });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSuccessMessage('Password reset email sent. Please check your inbox and click the link to set a new password.');
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSuccessMessage('Password updated. You can now sign in with your new password.');
    setView('signin');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onNavigate={onNavigate} currentPage="account" />

      <div className="pt-28 pb-20 min-h-screen flex items-center justify-center px-4">
        <div className="w-full" style={{ maxWidth: '480px' }}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 py-12 px-6 sm:px-8">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-full border-2 border-[#C1121F] flex items-center justify-center">
                <User className="w-8 h-8 text-[#C1121F]" strokeWidth={1.5} />
              </div>
            </div>

            {view === 'signin' && (
              <>
                <h1 className="text-xl font-bold text-gray-900 text-center mb-1">
                  Sign in your account
                </h1>
                <p className="text-gray-500 text-center text-sm mb-10">
                  Enter your details to access your account
                </p>

                {error && (
                  <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="account-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email
                    </label>
                    <input
                      id="account-email"
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label htmlFor="account-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="account-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-sm text-[#C1121F] hover:underline font-medium"
                      onClick={() => { setView('forgot'); setError(null); setSuccessMessage(null); }}
                    >
                      Forgot your password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 md:py-3 bg-[#C1121F] hover:bg-[#A00F1A] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-md"
                  >
                    {loading ? 'Signing in...' : 'Log in'}
                  </button>
                </form>
              </>
            )}

            {view === 'forgot' && (
              <>
                <h1 className="text-xl font-bold text-gray-900 text-center mb-1">
                  Forgot your password?
                </h1>
                <p className="text-gray-500 text-center text-sm mb-10">
                  Enter your email and we&apos;ll send you a link to reset your password.
                </p>

                {error && (
                  <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
                    {error}
                  </div>
                )}
                {successMessage && (
                  <div className="mb-4 p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl">
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleForgotSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                      autoComplete="email"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#C1121F] hover:bg-[#A00F1A] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-md"
                  >
                    {loading ? 'Sending...' : 'Send reset email'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setView('signin'); setError(null); setSuccessMessage(null); }}
                    className="w-full py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Back to sign in
                  </button>
                </form>
              </>
            )}

            {view === 'reset' && (
              <>
                <h1 className="text-xl font-bold text-gray-900 text-center mb-1">
                  Set new password
                </h1>
                <p className="text-gray-500 text-center text-sm mb-10">
                  Enter your new password below.
                </p>

                {error && (
                  <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
                    {error}
                  </div>
                )}
                {successMessage && (
                  <div className="mb-4 p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl">
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleResetSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                      New password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      placeholder="New password (min 8 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                      autoComplete="new-password"
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#C1121F] hover:bg-[#A00F1A] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-md"
                  >
                    {loading ? 'Updating...' : 'Update password'}
                  </button>
                </form>
              </>
            )}

            {view === 'signin' && (
              <p className="text-center text-gray-600 text-sm mt-8">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('signup')}
                  className="text-[#C1121F] font-semibold hover:underline"
                >
                  Sign up.
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
