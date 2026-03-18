import { Header } from '@/app/components/Header';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface CookiePolicyPageProps {
  onNavigate: (page: 'home' | 'buy' | 'rent' | 'consultation' | 'category' | 'blog' | 'about' | 'cookie') => void;
}

export function CookiePolicyPage({ onNavigate }: CookiePolicyPageProps) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} currentPage="about" />

      <div className="max-w-4xl mx-auto px-6 py-20 pb-16">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2">{t('cookie.title')}</h1>
        <p className="text-sm text-gray-500 text-center mb-8">{t('cookie.last_updated')}</p>

        <div className="prose prose-sm md:prose prose-gray max-w-none space-y-6 text-sm md:text-base text-gray-700">
          <p>{t('cookie.intro1')}</p>
          <p>{t('cookie.intro2')}</p>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-10 mb-3">{t('cookie.s1_title')}</h2>
            <p>{t('cookie.s1_p1')}</p>
            <p>{t('cookie.s1_p2')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-10 mb-3">{t('cookie.s2_title')}</h2>
            <p>{t('cookie.s2_p1')}</p>
            <p className="text-sm md:text-base font-semibold">{t('cookie.s2_specifically')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('cookie.s2_li1')}</li>
              <li>{t('cookie.s2_li2')}</li>
              <li>{t('cookie.s2_li3')}</li>
              <li>{t('cookie.s2_li4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-10 mb-3">{t('cookie.s3_title')}</h2>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mt-4 mb-2">{t('cookie.s3_h1')}</h3>
            <p>{t('cookie.s3_p1')}</p>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mt-4 mb-2">{t('cookie.s3_h2')}</h3>
            <p>{t('cookie.s3_p2')}</p>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mt-4 mb-2">{t('cookie.s3_h3')}</h3>
            <p>{t('cookie.s3_p3')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-10 mb-3">{t('cookie.s4_title')}</h2>
            <p>{t('cookie.s4_p1')}</p>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mt-4 mb-2">{t('cookie.s4_ga')}</h3>
            <p>{t('cookie.s4_ga_p1')}</p>
            <p>
              {t('cookie.s4_ga_link')}{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#C1121F] hover:underline">Google</a>.
            </p>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mt-4 mb-2">{t('cookie.s4_partners')}</h3>
            <p>{t('cookie.s4_partners_p')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-10 mb-3">{t('cookie.s5_title')}</h2>
            <p>{t('cookie.s5_p1')}</p>
            <p>{t('cookie.s5_p2')}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#C1121F] hover:underline">Google Chrome</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#C1121F] hover:underline">Safari</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-[#C1121F] hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-[#C1121F] hover:underline">Microsoft Edge</a></li>
            </ul>
            <p>
              {t('cookie.s5_p3')}{' '}
              <a href="http://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-[#C1121F] hover:underline">http://tools.google.com/dlpage/gaoptout</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-10 mb-3">{t('cookie.s6_title')}</h2>
            <p>{t('cookie.s6_intro')}</p>
            <div className="bg-gray-50 rounded-lg p-6 mt-4">
              <p className="font-semibold text-gray-900">{t('cookie.s6_company')}</p>
              <p>{t('cookie.s6_email')} <a href="mailto:information@tkofficial.net" className="text-[#C1121F] hover:underline">information@tkofficial.net</a></p>
              <p>{t('cookie.s6_address')} 77 Space 102, 3-1-5 Kita-Otsuka, Toshima-ku, Tokyo 170-0004, Japan</p>
              <p>{t('cookie.s6_website')} <a href="https://www.tkofficial.net" target="_blank" rel="noopener noreferrer" className="text-[#C1121F] hover:underline">https://www.tkofficial.net</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">{t('cookie.s7_title')}</h2>
            <p>{t('cookie.s7_p1')}</p>
            <p>{t('cookie.s7_p2')}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
