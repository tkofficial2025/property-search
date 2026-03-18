import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowRight, MapPin } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { getPropertyImageUrl } from '@/lib/propertyImageUrl';
import { StationLineLogo } from '@/app/components/StationLineLogo';
import { useRef, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  type FeaturedProperty,
  type SupabasePropertyRow,
  mapSupabaseRowToFeaturedProperty,
} from '@/lib/properties';
import { useCurrency } from '@/app/contexts/CurrencyContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { getStationDisplay } from '@/lib/stationNames';
import { fetchTranslationsForProperties, type PropertyTranslationResult } from '@/lib/translate-property';

export interface FeaturedPropertiesCarouselProps {
  onSelectProperty?: (id: number, source: 'rent' | 'buy') => void;
  onViewAllClick?: () => void;
  title?: string;
  subtitle?: string;
}

export function FeaturedPropertiesCarousel({ onSelectProperty, onViewAllClick, title, subtitle }: FeaturedPropertiesCarouselProps = {}) {
  const { t, language } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [properties, setProperties] = useState<FeaturedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [translationMap, setTranslationMap] = useState<Map<number, PropertyTranslationResult>>(new Map());
  const { formatPrice } = useCurrency();
  const displayTitle = title ?? t('section.featured.title');
  const displaySubtitle = subtitle ?? t('section.featured.subtitle');

  useEffect(() => {
    async function fetchFeaturedProperties() {
      setLoading(true);
      const featured = await supabase
        .from('properties')
        .select('*')
        .eq('is_featured', true)
        .limit(12);
      if (import.meta.env.DEV) {
        console.log('[Featured] is_featured=true', {
          count: featured.data?.length ?? 0,
          error: featured.error?.message,
          code: featured.error?.code,
        });
      }
      let rows = featured.data ?? [];
      if (rows.length === 0 && !featured.error) {
        const fallback = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(12);
        if (fallback.data?.length) rows = fallback.data;
        if (import.meta.env.DEV) console.log('[Featured] Fallback used', fallback.data?.length ?? 0);
      }
      setProperties(
        Array.isArray(rows)
          ? rows.map((row) => mapSupabaseRowToFeaturedProperty(row as SupabasePropertyRow))
          : []
      );
      setLoading(false);
    }
    fetchFeaturedProperties();
  }, []);

  const propertiesIdsKey = properties.map((p) => p.id).sort((a, b) => a - b).join(',');
  useEffect(() => {
    if (language !== 'zh' || properties.length === 0) {
      setTranslationMap(new Map());
      return;
    }
    let cancelled = false;
    const items = properties.map((p) => ({ id: p.id, title: p.title, address: p.location }));
    fetchTranslationsForProperties(items, language).then((map) => {
      if (!cancelled) setTranslationMap(map);
    });
    return () => { cancelled = true; };
  }, [language, propertiesIdsKey]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  return (
    <section className="py-10 md:py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-6 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">{displayTitle}</h2>
            <p className="text-xs md:text-lg text-gray-600">{displaySubtitle}</p>
          </motion.div>

          <motion.a
            href="#"
            onClick={onViewAllClick ? (e) => { e.preventDefault(); onViewAllClick(); } : undefined}
            className="hidden md:flex items-center gap-2 text-gray-600 hover:text-[#C1121F] transition-colors group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="font-medium">{t('section.featured.view_all')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.a>
        </div>

        {/* Carousel Container */}
        <div className="relative group/carousel -mx-2 md:mx-0 px-2 md:px-0">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all opacity-0 group-hover/carousel:opacity-100 hover:scale-110"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
          )}

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all opacity-0 group-hover/carousel:opacity-100 hover:scale-110"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6 text-gray-900" />
            </button>
          )}

          {/* モバイル: 右端フェード＋スワイプ案内 */}
          <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-[1] md:hidden" aria-hidden />
          <div className="absolute right-3 bottom-6 flex items-center gap-1 text-gray-400 text-xs pointer-events-none z-[1] md:hidden">
            <span className="font-medium">{t('section.featured.swipe')}</span>
            <ChevronRight className="w-4 h-4" />
          </div>

          {/* Scrollable Cards Container */}
          <motion.div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-4 pl-px"
            onScroll={handleScroll}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {loading && (
              <div className="flex-shrink-0 w-[340px] md:w-[380px] flex items-center justify-center py-12 text-gray-500">
                {t('section.featured.loading')}
              </div>
            )}
            {!loading && properties.length === 0 && (
              <div className="flex-shrink-0 w-full flex items-center justify-center py-12 text-gray-500">
                {t('section.featured.empty')}
              </div>
            )}
            {!loading && properties.map((property, index) => (
              <motion.div
                key={property.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectProperty?.(property.id, property.type === 'Rent' ? 'rent' : 'buy')}
                onKeyDown={(e) => e.key === 'Enter' && onSelectProperty?.(property.id, property.type === 'Rent' ? 'rent' : 'buy')}
                className="flex-shrink-0 w-[340px] md:w-[380px] snap-start group/card cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                  {/* Property Image */}
                  <div className="relative h-56 overflow-hidden">
                    <ImageWithFallback
                      src={getPropertyImageUrl(property.image, 'listing')}
                      alt={language === 'zh' ? (translationMap.get(property.id)?.title_zh ?? property.title) : property.title}
                      className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    {/* Type Badge */}
                    <div
                      className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                        property.type === 'Buy'
                          ? 'bg-[#C1121F] text-white'
                          : 'bg-white text-gray-900'
                      }`}
                    >
                      {property.type === 'Rent' ? t('activity.for_rent') : t('activity.for_sale')}
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1 group-hover/card:text-[#C1121F] transition-colors">
                      {language === 'zh' ? (translationMap.get(property.id)?.title_zh ?? property.title) : property.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">{language === 'zh' ? (translationMap.get(property.id)?.address_zh ?? property.location) : property.location}</p>

                    {/* Property Stats */}
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
                      <span>{property.beds} {t('property.bed')}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>{property.baths} {t('property.bath')}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>{property.size}</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-gray-100">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatPrice(property.priceYen, property.type === 'Rent' ? 'rent' : 'buy')}
                      </span>
                    </div>

                    {/* Station Info */}
                    {property.station && (
                      <div className="flex items-center gap-2">
                        <StationLineLogo 
                          stationName={property.station} 
                          size={18} 
                          className="flex-shrink-0" 
                        />
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600">
                          {getStationDisplay(property.station, language)}
                          {property.walkingMinutes && ` • ${property.walkingMinutes} ${t('property.walk.min')}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Mobile View All Link */}
        <motion.a
          href="#"
          onClick={onViewAllClick ? (e) => { e.preventDefault(); onViewAllClick(); } : undefined}
          className="flex md:hidden items-center justify-center gap-2 text-gray-600 hover:text-[#C1121F] transition-colors group mt-8 cursor-pointer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="font-medium">{t('section.featured.view_all_properties')}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </motion.a>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
