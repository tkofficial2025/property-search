import { Heart, Calendar, User, LogOut } from 'lucide-react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import type { Page } from '@/lib/routes';

type AccountPage = 'favorites' | 'activity' | 'profile';

interface AccountSubHeaderProps {
  currentPage: AccountPage;
  onNavigate: (page: Page) => void;
  userName: string;
  onLogout: () => void;
}

export function AccountSubHeader({ currentPage, onNavigate, userName, onLogout }: AccountSubHeaderProps) {
  const { t } = useLanguage();

  const baseClass = 'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors';
  const activeClass = 'bg-[#C1121F] text-white';
  const inactiveClass = 'text-gray-600 bg-gray-100 hover:bg-gray-200';

  return (
    <div className="md:hidden sticky top-14 z-20 bg-gray-100 border-b border-gray-200 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <nav className="flex items-center gap-1 overflow-x-auto min-w-0">
          <button
            type="button"
            onClick={() => onNavigate('favorites')}
            className={`${baseClass} ${currentPage === 'favorites' ? activeClass : inactiveClass}`}
          >
            <Heart className="w-4 h-4 flex-shrink-0" />
            {t('account.favorites')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('activity')}
            className={`${baseClass} ${currentPage === 'activity' ? activeClass : inactiveClass}`}
          >
            <Calendar className="w-4 h-4 flex-shrink-0" />
            {t('account.activity')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className={`${baseClass} ${currentPage === 'profile' ? activeClass : inactiveClass}`}
          >
            <User className="w-4 h-4 flex-shrink-0" />
            {t('account.profile')}
          </button>
        </nav>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-medium text-gray-900 truncate max-w-[100px]" title={userName}>
            {userName || t('account.user')}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-900"
            aria-label={t('account.logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
