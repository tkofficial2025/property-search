import { Header } from '@/app/components/Header';
import { useLanguage } from '@/app/contexts/LanguageContext';

type NavPage = 'home' | 'buy' | 'rent' | 'consultation' | 'category' | 'blog' | 'about' | 'cookie' | 'terms';

interface TermsOfServicePageProps {
  onNavigate: (page: NavPage) => void;
}

export function TermsOfServicePage({ onNavigate }: TermsOfServicePageProps) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} currentPage="about" />

      <div className="max-w-4xl mx-auto px-6 py-20 pb-16">
        <p className="text-sm text-gray-600 text-center mb-1">{t('terms.company')}</p>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2">{t('terms.title')}</h1>
        <p className="text-sm text-gray-500 text-center mb-8">{t('terms.last_updated')}</p>

        <div className="prose prose-sm md:prose prose-gray max-w-none space-y-6 text-sm md:text-base text-gray-700">
          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('terms.s1_title')}</h2>
            <p>{t('terms.s1_p1')}</p>
            <p>{t('terms.s1_p2')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('terms.s2_title')}</h2>
            <p>{t('terms.s2_p1')}</p>
            <p>{t('terms.s2_p2')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('terms.s3_title')}</h2>
            <p>{t('terms.s3_p1')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms.s3_li1')}</li>
              <li>{t('terms.s3_li2')}</li>
              <li>{t('terms.s3_li3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('terms.s4_title')}</h2>
            <p>{t('terms.s4_p1')}</p>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mt-4 mb-2">{t('terms.s4_h1')}</h3>
            <p>{t('terms.s4_p2')}</p>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mt-4 mb-2">{t('terms.s4_h2')}</h3>
            <p>{t('terms.s4_p3')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('terms.s5_title')}</h2>
            <p>{t('terms.s5_p1')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms.s5_li1')}</li>
              <li>{t('terms.s5_li2')}</li>
              <li>{t('terms.s5_li3')}</li>
              <li>{t('terms.s5_li4')}</li>
              <li>{t('terms.s5_li5')}</li>
              <li>{t('terms.s5_li6')}</li>
              <li>{t('terms.s5_li7')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('terms.s6_title')}</h2>
            <p>{t('terms.s6_p1')}</p>
            <p>{t('terms.s6_p2')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('terms.s7_title')}</h2>
            <p>{t('terms.s7_p1')}</p>
            <p>{t('terms.s7_p2')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('terms.s8_title')}</h2>
            <p>{t('terms.s8_p1')}</p>
            <p>{t('terms.s8_p2')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('terms.s9_title')}</h2>
            <p>{t('terms.s9_p1')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('terms.s10_title')}</h2>
            <p>{t('terms.s10_p1')}</p>
            <p>{t('terms.s10_p2')}</p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">{t('terms.s11_title')}</h2>
            <p>{t('terms.s11_p1')}</p>
            <div className="bg-gray-50 rounded-lg p-6 mt-4">
              <p className="font-semibold text-gray-900">{t('terms.company')}</p>
              <p>{t('terms.s11_email')} <a href="mailto:information@tkofficial.net" className="text-[#C1121F] hover:underline">information@tkofficial.net</a></p>
              <p>{t('terms.s11_address')} 77 Space 102, 3-1-5 Kita-Otsuka, Toshima-ku, Tokyo 170-0004, Japan</p>
            </div>
          </section>

          <p className="text-gray-500 text-sm mt-12">{t('terms.copyright')}</p>
        </div>
      </div>
    </div>
  );
}
