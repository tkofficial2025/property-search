import { Header } from '@/app/components/Header';
import { useLanguage } from '@/app/contexts/LanguageContext';
import type { Page } from '@/lib/routes';

interface ConsultationPageProps {
  onNavigate?: (page: Page) => void;
}

export function ConsultationPage({ onNavigate }: ConsultationPageProps) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} currentPage="consultation" />
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-gray-700 text-sm leading-relaxed mb-8">{t('internal.consultation')}</p>
        <button
          type="button"
          onClick={() => onNavigate?.('home')}
          className="px-6 py-3 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
        >
          {t('nav.home')}
        </button>
      </div>
    </div>
  );
}
