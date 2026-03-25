import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface PropertyCategoryCard {
  code: string;
  label: string;
  properties: number;
  image: string;
}

export interface TokyoWardsSectionProps {
  onWardClick?: (categoryCode: string, page: 'buy') => void;
  title?: string;
  subtitle?: string;
}

const U = (id: string) => `https://images.unsplash.com/photo-${id}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080`;

const CATEGORY_BASE: Omit<PropertyCategoryCard, 'properties'>[] = [
  { code: 'bldg', label: 'ビル・マンション一棟', image: U('1545324418-cc1a3fa10c00') },
  { code: 'room', label: 'マンション一室・フロア', image: U('1560185007-5f0bb1866cab') },
  { code: 'hotel', label: 'ホテル・旅館', image: U('1445019980597-93fa8acb246c') },
  { code: 'land', label: '土地・事業用地', image: U('1500382017468-9049fed747ef') },
  { code: 'apartment', label: '収益アパート', image: U('1460317442991-0ec209397118') },
  { code: 'golf', label: 'ゴルフ場', image: U('1535131749006-b7f58c99034b') },
  { code: 'medical', label: '病院・医療施設', image: U('1584982751601-97dcc096659c') },
];

export function TokyoWardsSection({ onWardClick, title, subtitle }: TokyoWardsSectionProps) {
  const { t } = useLanguage();
  const sectionTitle = title ?? t('section.areas.explore_title');
  const sectionDesc = subtitle ?? t('section.areas.explore_desc');
  const [categories, setCategories] = useState<PropertyCategoryCard[]>(() =>
    CATEGORY_BASE.map((c) => ({ ...c, properties: 0 }))
  );

  useEffect(() => {
    async function fetchCounts() {
      const { data, error } = await supabase.from('properties').select('property_category,title,property_information');
      if (error || !data?.length) {
        setCategories((prev) => prev.map((c) => ({ ...c, properties: 0 })));
        return;
      }
      const counts: Record<string, number> = {};
      for (const c of CATEGORY_BASE) {
        counts[c.code] = 0;
      }

      for (const row of data) {
        const r = row as { property_category?: string; title?: string; property_information?: string };
        const direct = (r.property_category ?? '').trim();
        if (direct && counts[direct] != null) {
          counts[direct] += 1;
          continue;
        }
        const hay = `${r.title ?? ''} ${r.property_information ?? ''}`.toLowerCase();
        if (hay.includes('ホテル') || hay.includes('旅館') || hay.includes('hotel')) counts.hotel += 1;
        else if (hay.includes('土地') || hay.includes('用地')) counts.land += 1;
        else if (hay.includes('病院') || hay.includes('医療') || hay.includes('clinic')) counts.medical += 1;
        else if (hay.includes('ゴルフ') || hay.includes('golf')) counts.golf += 1;
        else if (hay.includes('アパート')) counts.apartment += 1;
        else if (hay.includes('区分') || hay.includes('一室') || hay.includes('フロア')) counts.room += 1;
        else counts.bldg += 1;
      }

      setCategories(
        CATEGORY_BASE.map((c) => ({ ...c, properties: counts[c.code] ?? 0 }))
      );
    }
    fetchCounts();
  }, []);

  const primary = categories.slice(0, 4);
  const secondary = categories.slice(4);

  return (
    <section className="py-12 md:py-24 bg-white overflow-x-hidden w-full">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 box-border">
        {/* Section Header */}
        <motion.div
          className="mb-6 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {sectionTitle}
          </h2>
          <p className="text-xs md:text-lg text-gray-600 max-w-2xl">
            {sectionDesc}
          </p>
        </motion.div>

        {/* Primary Categories - モバイル: 横スクロール / PC: グリッド */}
        <div className="mb-6 md:mb-12">
          <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">{t('section.areas.wards23')}</h3>

          {/* モバイル: 横スクロール */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4 md:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {primary.map((category, index) => (
              <motion.div
                key={category.code}
                className="group relative overflow-hidden rounded-2xl aspect-[3/1.3] min-h-[160px] flex-shrink-0 w-[85vw] max-w-[320px] snap-start cursor-default"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <div className="absolute inset-0 overflow-hidden">
                  <ImageWithFallback src={category.image} alt={category.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
                </div>
                <div className="relative h-full flex flex-col justify-between p-4">
                  <div></div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-0.5">{category.label}</h3>
                    <p className="text-white/90 text-xs mb-2">{t('section.areas.properties_count').replace('{n}', String(category.properties))}</p>
                    {onWardClick && (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onWardClick(category.code, 'buy'); }}
                          className="cursor-pointer px-3 py-2 bg-[#C1121F] hover:bg-[#A00F1A] text-white text-xs font-semibold rounded-lg transition-colors shadow-md"
                        >
                          {t('section.areas.view_sale')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* PC: グリッド */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6 min-w-0 w-full">
            <AnimatePresence mode="popLayout">
              {primary.map((category, index) => (
              <motion.div
                key={category.code}
                className="group relative overflow-hidden rounded-2xl aspect-[3/1.3] min-h-[200px] cursor-default min-w-0 w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="absolute inset-0 overflow-hidden">
                  <ImageWithFallback
                    src={category.image}
                    alt={category.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
                </div>
                <div className="relative h-full flex flex-col justify-between p-6">
                  <div></div>
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                      {category.label}
                    </h3>
                  <p className="text-white/90 text-sm mb-3">
                    {t('section.areas.properties_count').replace('{n}', String(category.properties))}
                  </p>
                  {onWardClick && (
                    <div className="flex gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onWardClick(category.code, 'buy');
                        }}
                        className="cursor-pointer px-4 py-2.5 bg-[#C1121F] hover:bg-[#A00F1A] text-white text-sm font-semibold rounded-lg transition-colors shadow-md"
                      >
                        {t('section.areas.view_sale')}
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Secondary Categories */}
        <div className="mb-6 md:mb-12">
          <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">{t('section.areas.outer')}</h3>
          <div className="md:grid grid-cols-2 lg:grid-cols-3 gap-6 min-w-0 w-full flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {secondary.map((category, index) => (
              <motion.div
                key={category.code}
                className="group relative overflow-hidden rounded-2xl aspect-[3/1.3] min-h-[160px] md:min-h-[200px] cursor-default w-[85vw] max-w-[320px] md:w-full md:max-w-none snap-start"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="absolute inset-0 overflow-hidden">
                  <ImageWithFallback src={category.image} alt={category.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
                </div>
                <div className="relative h-full flex flex-col justify-between p-4 md:p-6">
                  <div />
                  <div>
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-0.5 md:mb-1">{category.label}</h3>
                    <p className="text-white/90 text-xs md:text-sm mb-2 md:mb-3">
                      {t('section.areas.properties_count').replace('{n}', String(category.properties))}
                    </p>
                    {onWardClick && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onWardClick(category.code, 'buy');
                        }}
                        className="cursor-pointer px-3 py-2 md:px-4 md:py-2.5 bg-[#C1121F] hover:bg-[#A00F1A] text-white text-xs md:text-sm font-semibold rounded-lg transition-colors shadow-md"
                      >
                        {t('section.areas.view_sale')}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
