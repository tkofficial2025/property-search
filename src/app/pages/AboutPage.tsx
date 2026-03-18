import { Header } from '@/app/components/Header';
import { MapPin, Phone, Mail, Award, Building2, Globe, Shield, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface AboutPageProps {
  onNavigate: (page: 'home' | 'buy' | 'rent' | 'consultation' | 'category' | 'blog' | 'about') => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} currentPage="about" />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-1 h-10 bg-[#C1121F]"></div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('about.title')}</h1>
          </div>
          <div className="max-w-4xl space-y-4 text-sm md:text-base text-gray-700 leading-relaxed">
            <p>{t('about.p1')}</p>
            <p>{t('about.p2')}</p>
            <p>{t('about.p3')}</p>
            <p>{t('about.p4')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 space-y-16">

        {/* Company Profile Table */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-1 h-10 bg-[#C1121F]"></div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{t('about.company_profile')}</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-sm md:text-base font-semibold text-gray-900 w-1/3">{t('about.company_name')}</td>
                  <td className="px-6 py-3 text-sm md:text-base text-gray-700">
                    {t('about.company_name_val')}
                    {t('about.company_name_val') !== '上京プロパティ株式会社' && <><br /><span className="text-gray-500">上京プロパティ株式会社</span></>}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-sm md:text-base font-semibold text-gray-900 w-1/3">{t('about.license')}</td>
                  <td className="px-6 py-3 text-sm md:text-base text-gray-700">
                    {t('about.license_val')}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-sm md:text-base font-semibold text-gray-900 w-1/3">{t('about.corporate_number')}</td>
                  <td className="px-6 py-3 text-sm md:text-base text-gray-700">
                    6010501054967
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-sm md:text-base font-semibold text-gray-900 w-1/3">{t('about.director')}</td>
                  <td className="px-6 py-3 text-sm md:text-base text-gray-700">
                    {t('about.director_val')}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-sm md:text-base font-semibold text-gray-900 w-1/3">{t('about.address')}</td>
                  <td className="px-6 py-3 text-sm md:text-base text-gray-700 whitespace-pre-line">
                    {t('about.address_val').replace(', Japan', '\nJapan').replace(' (邮编', '\n(邮编')}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-sm md:text-base font-semibold text-gray-900 w-1/3">{t('about.phone')}</td>
                  <td className="px-6 py-3 text-sm md:text-base text-gray-700">
                    <a 
                      href="tel:+81359808304" 
                      className="hover:text-[#C1121F] transition-colors"
                    >
                      +81-3-5980-8304
                    </a>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-sm md:text-base font-semibold text-gray-900 w-1/3">{t('about.email')}</td>
                  <td className="px-6 py-3 text-sm md:text-base text-gray-700">
                    <a 
                      href={`mailto:information@tkofficial.net?subject=${encodeURIComponent(t('about.mailto.subject'))}&body=${encodeURIComponent(t('about.mailto.body'))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#C1121F] transition-colors"
                    >
                      information@tkofficial.net
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
