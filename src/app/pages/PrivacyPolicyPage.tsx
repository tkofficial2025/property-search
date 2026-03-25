import { Header } from '@/app/components/Header';
import { useLanguage } from '@/app/contexts/LanguageContext';
import type { Page } from '@/lib/routes';

interface PrivacyPolicyPageProps {
  onNavigate: (page: Page) => void;
}

export function PrivacyPolicyPage({ onNavigate }: PrivacyPolicyPageProps) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} currentPage="about" />
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">{t('privacy.title')}</h1>
        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{t('internal.placeholder')}</p>
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="mt-8 px-6 py-3 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
        >
          {t('nav.home')}
        </button>
      </div>
    </div>
  );
}
