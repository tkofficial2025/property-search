import { useState, useEffect } from 'react';
import { Heart, User, LogOut, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Header } from '@/app/components/Header';
import { AccountSubHeader } from '@/app/components/AccountSubHeader';
import { useLanguage } from '@/app/contexts/LanguageContext';
import type { Page } from '@/lib/routes';

interface ProfilePageProps {
  onNavigate: (page: Page) => void;
}

type ProfileTab = 'information' | 'password';

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { t } = useLanguage();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [activeTab, setActiveTab] = useState<ProfileTab>('information');
  const [saving, setSaving] = useState(false);
  const [infoMessage, setInfoMessage] = useState<'success' | 'error' | null>(null);
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const first = (user.user_metadata?.first_name as string) ?? '';
        const last = (user.user_metadata?.last_name as string) ?? '';
        setFirstName(first);
        setLastName(last);
        setUserName([first, last].filter(Boolean).join(' ') || user.email || 'User');
        setUserEmail(user.email ?? '');
      } else {
        onNavigate('account');
      }
    };
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- redirect once when not logged in
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('home');
  };

  const handleSaveInformation = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMessage(null);
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName },
    });
    setSaving(false);
    if (error) {
      setInfoMessage('error');
      return;
    }
    setUserName([firstName, lastName].filter(Boolean).join(' ') || userEmail || '');
    setInfoMessage('success');
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (passwordNew.length < 8) {
      setPasswordMessage('error');
      return;
    }
    if (passwordNew !== passwordConfirm) {
      setPasswordMessage('error');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwordNew });
    setSaving(false);
    if (error) {
      setPasswordMessage('error');
      return;
    }
    setPasswordMessage('success');
    setPasswordCurrent('');
    setPasswordNew('');
    setPasswordConfirm('');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onNavigate={onNavigate} currentPage="account" />
      <AccountSubHeader currentPage="profile" onNavigate={onNavigate} userName={userName} onLogout={handleLogout} />
      <div className="flex flex-col md:flex-row pt-20">
      <div className="flex flex-1 min-w-0">
      {/* Sidebar - hidden on mobile, sub-header used instead */}
      <aside className="hidden md:flex w-64 min-h-[calc(100vh-5rem)] bg-gray-200 border-r border-gray-300 flex-col flex-shrink-0">
        <nav className="p-3 flex-1 pt-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">{t('account.user')}</div>
          <button
            type="button"
            onClick={() => onNavigate('favorites')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-300/50 mt-1"
          >
            <Heart className="w-5 h-5" />
            {t('account.favorites')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('activity')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-300/50 mt-1"
          >
            <Calendar className="w-5 h-5" />
            {t('account.activity')}
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-300 text-gray-900 font-medium mt-1"
          >
            <User className="w-5 h-5 text-[#C1121F]" />
            {t('account.profile')}
          </button>
        </nav>
        <div className="p-3 border-t border-gray-300 mt-auto space-y-2">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#C1121F]/20 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-[#C1121F]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{userName || t('account.user')}</p>
              <p className="text-xs text-gray-500 truncate">{userEmail || '—'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-300/50 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            {t('account.logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-[calc(100vh-5rem)] bg-white p-4 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('profile.title')}</h1>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-gray-200 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('information')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'information'
                ? 'border-[#C1121F] text-[#C1121F]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('profile.tab_information')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'password'
                ? 'border-[#C1121F] text-[#C1121F]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('profile.tab_password')}
          </button>
        </div>

        {activeTab === 'information' && (
          <form onSubmit={handleSaveInformation} className="max-w-2xl space-y-6">
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="profile-firstname" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('profile.first_name')}
                </label>
                <input
                  id="profile-firstname"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                  placeholder={t('profile.first_name')}
                />
              </div>
              <div>
                <label htmlFor="profile-lastname" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('profile.last_name')}
                </label>
                <input
                  id="profile-lastname"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                  placeholder={t('profile.last_name')}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('profile.email_address')}
              </label>
              <input
                id="profile-email"
                type="email"
                value={userEmail}
                readOnly
                className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-xl text-gray-600 bg-gray-50"
              />
            </div>

            {infoMessage === 'success' && (
              <p className="text-sm text-green-600">{t('profile.saved_success')}</p>
            )}
            {infoMessage === 'error' && (
              <p className="text-sm text-red-600">{t('profile.saved_error')}</p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-60 transition-colors"
              >
                {saving ? t('profile.saving') : t('profile.save')}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={handleSavePassword} className="max-w-md space-y-4">
            <div>
              <label htmlFor="profile-current-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('profile.current_password')}
              </label>
              <input
                id="profile-current-password"
                type="password"
                value={passwordCurrent}
                onChange={(e) => setPasswordCurrent(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                placeholder={t('profile.current_password')}
              />
            </div>
            <div>
              <label htmlFor="profile-new-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('profile.new_password')}
              </label>
              <input
                id="profile-new-password"
                type="password"
                value={passwordNew}
                onChange={(e) => setPasswordNew(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                placeholder={t('profile.password_placeholder')}
              />
            </div>
            <div>
              <label htmlFor="profile-confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('profile.confirm_password')}
              </label>
              <input
                id="profile-confirm-password"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                placeholder={t('profile.confirm_password')}
              />
            </div>
            {passwordMessage === 'success' && (
              <p className="text-sm text-green-600">{t('profile.password_success')}</p>
            )}
            {passwordMessage === 'error' && (
              <p className="text-sm text-red-600">{t('profile.password_error')}</p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-60 transition-colors"
              >
                {saving ? t('profile.updating') : t('profile.update_password')}
              </button>
            </div>
          </form>
        )}
      </main>
      </div>
      </div>
    </div>
  );
}
