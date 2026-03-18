import { Header } from '@/app/components/Header';
import { useLanguage } from '@/app/contexts/LanguageContext';

type NavPage = 'home' | 'buy' | 'rent' | 'consultation' | 'category' | 'blog' | 'about' | 'cookie' | 'terms' | 'privacy';

interface PrivacyPolicyPageProps {
  onNavigate: (page: NavPage) => void;
}

export function PrivacyPolicyPage({ onNavigate }: PrivacyPolicyPageProps) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} currentPage="about" />

      <div className="max-w-4xl mx-auto px-6 py-20 pb-16">
        <p className="text-sm text-gray-600 text-center mb-1">{t('privacy.company')}</p>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2">{t('privacy.title')}</h1>
        <p className="text-sm text-gray-500 text-center mb-2">{t('privacy.effective')}</p>
        <p className="text-sm text-gray-500 text-center mb-8">{t('privacy.last_updated')}</p>

        <div className="prose prose-sm md:prose prose-gray max-w-none space-y-6 text-sm md:text-base text-gray-700">
          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('privacy.s1_title')}</h2>
            <p>{t('privacy.s1_p1')}</p>
            <p>{t('privacy.s1_p2')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('privacy.s2_title')}</h2>
            <p>{t('privacy.s2_p1')}</p>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mt-4 mb-2">{t('privacy.s2_h1')}</h3>
            <p>{t('privacy.s2_p2')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.s2_li1')}</li>
              <li>{t('privacy.s2_li2')}</li>
            </ul>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mt-4 mb-2">{t('privacy.s2_h2')}</h3>
            <p>{t('privacy.s2_p3')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('privacy.s3_title')}</h2>
            <p>{t('privacy.s3_p1')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.s3_li1')}</li>
              <li>{t('privacy.s3_li2')}</li>
              <li>{t('privacy.s3_li3')}</li>
              <li>{t('privacy.s3_li4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('privacy.s4_title')}</h2>
            <p>{t('privacy.s4_p1')}</p>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mt-4 mb-2">{t('privacy.s4_ga')}</h3>
            <p>{t('privacy.s4_ga_p')}</p>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mt-4 mb-2">{t('privacy.s4_adv')}</h3>
            <p>{t('privacy.s4_adv_p')}</p>
            <p>{t('privacy.s4_p2')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('privacy.s5_title')}</h2>
            <p>{t('privacy.s5_p1')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.s5_li1')}</li>
              <li>{t('privacy.s5_li2')}</li>
              <li>{t('privacy.s5_li3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('privacy.s6_title')}</h2>
            <p>{t('privacy.s6_p1')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('privacy.s7_title')}</h2>
            <p>{t('privacy.s7_p1')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.s7_li1')}</li>
              <li>{t('privacy.s7_li2')}</li>
              <li>{t('privacy.s7_li3')}</li>
              <li>{t('privacy.s7_li4')}</li>
            </ul>
            <p>{t('privacy.s7_p2')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('privacy.s8_title')}</h2>
            <p>{t('privacy.s8_p1')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('privacy.s9_title')}</h2>
            <p>{t('privacy.s9_p1')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('privacy.s10_title')}</h2>
            <p>{t('privacy.s10_p1')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('privacy.s11_title')}</h2>
            <p>{t('privacy.s11_p1')}</p>
            <div className="bg-gray-50 rounded-lg p-6 mt-4">
              <p className="font-semibold text-gray-900">{t('privacy.company')}</p>
              <p>{t('privacy.s11_address')} 77 Space 102, 3-1-5 Kita-Otsuka, Toshima-ku, Tokyo 170-0004, Japan</p>
              <p>{t('privacy.s11_email')} <a href="mailto:information@tkofficial.net" className="text-[#C1121F] hover:underline">information@tkofficial.net</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('privacy.s12_title')}</h2>
            <p>{t('privacy.s12_p1')}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
