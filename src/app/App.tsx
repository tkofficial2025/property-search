import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { QuickPropertySearch } from '@/app/components/QuickPropertySearch';
import { FeaturedPropertiesCarousel } from '@/app/components/FeaturedPropertiesCarousel';
import { Header } from '@/app/components/Header';
import { TokyoWardsSection } from '@/app/components/TokyoWardsSection';
import { BuyPropertiesPage } from '@/app/pages/BuyPropertiesPage';
import { PropertyDetailPage } from '@/app/pages/PropertyDetailPage';
import { ConsultationPage } from '@/app/pages/ConsultationPage';
import { CookiePolicyPage } from '@/app/pages/CookiePolicyPage';
import { TermsOfServicePage } from '@/app/pages/TermsOfServicePage';
import { PrivacyPolicyPage } from '@/app/pages/PrivacyPolicyPage';
import { PropertyRegisterPage } from '@/app/pages/PropertyRegisterPage';
import type { HeroSearchParams } from '@/lib/searchFilters';
import {
  type Page,
  getPageFromPath,
  getPathFromPage,
  getPathname,
  pushState,
  replaceState,
} from '@/lib/routes';
import { useLanguage } from './contexts/LanguageContext';

export default function App() {
  return <AppContent />;
}

function AppContent() {
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState<Page>(() => getPageFromPath(getPathname()));
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [heroSearchParams, setHeroSearchParams] = useState<HeroSearchParams | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [detailSource, setDetailSource] = useState<'buy'>('buy');

  useEffect(() => {
    const syncFromUrl = () => {
      const path = getPathname();
      const params = new URLSearchParams(window.location.search);
      const page = getPageFromPath(path);
      setCurrentPage(page);

      const propId = params.get('property');
      const source = params.get('source') as 'buy' | null;
      if (propId && !isNaN(Number(propId))) {
        setSelectedPropertyId(Number(propId));
        if (source === 'buy') setDetailSource(source);
      } else {
        setSelectedPropertyId(null);
      }
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  const handleNavigate = (page: Page) => {
    if (page === 'home') {
      setSelectedWard(null);
      setHeroSearchParams(null);
    }
    setSelectedPropertyId(null);
    setCurrentPage(page);
    const path = getPathFromPage(page);
    pushState(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHeroSearch = (params: HeroSearchParams) => {
    setHeroSearchParams(params);
    setSelectedWard(null);
    setSelectedPropertyId(null);
    setCurrentPage(params.propertyType);
    pushState(getPathFromPage(params.propertyType));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWardClick = (categoryCode: string, page: 'buy') => {
    setSelectedWard(null);
    setHeroSearchParams({
      propertyType: 'buy',
      selectedAreas: [],
      propertyCategories: [categoryCode],
    });
    setCurrentPage(page);
    pushState(getPathFromPage(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProperty = (id: number, source: 'buy') => {
    setSelectedPropertyId(id);
    setDetailSource(source);
    const path = getPathFromPage(source);
    pushState(path, `?property=${id}&source=${source}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromProperty = () => {
    setSelectedPropertyId(null);
    replaceState(getPathFromPage(detailSource));
  };

  if (selectedPropertyId != null) {
    return (
      <PropertyDetailPage
        propertyId={selectedPropertyId}
        source={detailSource}
        onNavigate={handleNavigate}
        onBack={handleBackFromProperty}
      />
    );
  }

  if (currentPage === 'buy') {
    return (
      <BuyPropertiesPage
        onNavigate={handleNavigate}
        selectedWard={selectedWard}
        onSelectProperty={(id) => handleSelectProperty(id, 'buy')}
        initialSearchParams={heroSearchParams}
      />
    );
  }

  if (currentPage === 'consultation') {
    return <ConsultationPage onNavigate={handleNavigate} />;
  }

  if (currentPage === 'register') {
    return <PropertyRegisterPage onNavigate={handleNavigate} />;
  }

  if (currentPage === 'cookie') {
    return <CookiePolicyPage onNavigate={handleNavigate} />;
  }

  if (currentPage === 'terms') {
    return <TermsOfServicePage onNavigate={handleNavigate} />;
  }

  if (currentPage === 'privacy') {
    return <PrivacyPolicyPage onNavigate={handleNavigate} />;
  }

  return (
    <div className="min-h-screen bg-white w-full">
      <Header onNavigate={handleNavigate} currentPage={currentPage} />

      <section className="relative min-h-[100vw] md:min-h-screen flex items-center justify-center pt-14 md:pt-20 overflow-visible">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/tokyo.jpg)',
              transform: 'scale(1.05)',
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-5 md:py-32 md:pb-48 overflow-visible">
          <div className="max-w-4xl mx-auto text-center overflow-visible">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1
                className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-3 md:mb-6 tracking-tight leading-tight"
                style={{ textShadow: '0 6px 12px rgba(0,0,0,0.5)' }}
              >
                {t('app.title')}
              </h1>
            </motion.div>

            <motion.p
              className="text-xs sm:text-sm md:text-lg text-white/90 mb-5 md:mb-10 leading-snug md:leading-relaxed px-1"
              style={{ textShadow: '0 6px 12px rgba(0,0,0,0.6)' }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t('hero.subtitle')}
            </motion.p>

            <div className="mt-4 md:mt-8">
              <QuickPropertySearch onSearch={handleHeroSearch} />
            </div>
          </div>
        </div>
      </section>

      <FeaturedPropertiesCarousel
        onSelectProperty={handleSelectProperty}
        onViewAllClick={() => handleNavigate('buy')}
        title={t('section.featured.title')}
        subtitle={t('section.featured.subtitle')}
      />

      <TokyoWardsSection
        onWardClick={handleWardClick}
        title={t('section.areas.title')}
        subtitle={t('section.areas.subtitle')}
      />

    </div>
  );
}
