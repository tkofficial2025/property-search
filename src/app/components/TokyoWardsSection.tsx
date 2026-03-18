import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { supabase } from '@/lib/supabase';
import { WARD_MATCH_TERMS } from '@/lib/wards';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface Ward {
  name: string;
  properties: number;
  image: string;
}

export interface TokyoWardsSectionProps {
  onWardClick?: (wardName: string, page: 'rent' | 'buy') => void;
  title?: string;
  subtitle?: string;
}

// デフォルト画像URL（UnsplashのTokyo関連画像）- フォールバック用
const DEFAULT_TOKYO_IMAGE = 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080';

const U = (id: string) => `https://images.unsplash.com/photo-${id}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080`;

const WARDS_BASE: Omit<Ward, 'properties'>[] = [
  // 23区（各カードにUnsplashの東京・日本イメージを割り当て）
  { name: 'Chiyoda', image: U('1691434226786-9fef3cda90de') },
  { name: 'Chuo', image: 'https://unsplash.com/photos/0HI2w6EiXSE/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Minato', image: 'https://unsplash.com/photos/64ajtpEzlYc/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Shinjuku', image: 'https://unsplash.com/photos/9gtODWv-L5I/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Shibuya', image: 'https://unsplash.com/photos/0BExqfEtp6A/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Taito', image: U('1643431543449-d078a74c9f31') },
  { name: 'Sumida', image: 'https://unsplash.com/photos/BFVNRz-W35c/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Koto', image: 'https://unsplash.com/photos/yCPrEOZbPXw/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Shinagawa', image: 'https://unsplash.com/photos/cmn4mMoI64E/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Meguro', image: 'https://unsplash.com/photos/hRuZjEmsKmY/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Bunkyo', image: U('1724045998002-6792534eea3c') },
  { name: 'Setagaya', image: U('1713635632084-f0dd34f5623e') },
  { name: 'Ota', image: 'https://unsplash.com/photos/stbBpWbZENk/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Nakano', image: 'https://unsplash.com/photos/y9EP6OX7Joc/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Suginami', image: 'https://unsplash.com/photos/muizaEf3LjM/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Toshima', image: 'https://unsplash.com/photos/4MUQEYhaKHI/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Kita', image: 'https://unsplash.com/photos/Ek-BbDtc3eQ/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Arakawa', image: 'https://unsplash.com/photos/fWtWJySOyAU/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Itabashi', image: 'https://unsplash.com/photos/ZuNCTKsqFjw/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Nerima', image: 'https://unsplash.com/photos/ageF5Xg3dQ0/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Adachi', image: 'https://unsplash.com/photos/8YLNCKUySAU/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Katsushika', image: 'https://unsplash.com/photos/S_Oft8i6DVw/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  { name: 'Edogawa', image: 'https://unsplash.com/photos/8ypUj2m3b1I/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80' },
  // 23区外（市部）- 郊外・住宅・自然イメージ
  { name: 'Hachioji', image: U('1449824913935-59a10b8d85c7') },
  { name: 'Tachikawa', image: U('1519501025264-65ba15a82390') },
  { name: 'Musashino', image: U('1514565131-fce0801e5785') },
  { name: 'Mitaka', image: U('1470071459604-3b5ec3a7fe05') },
  { name: 'Ome', image: U('1449824913935-59a10b8d85c7') },
  { name: 'Fuchu', image: U('1500534314209-a25ddb2bd429') },
  { name: 'Akishima', image: U('1507525428034-b723cf961d3e') },
  { name: 'Chofu', image: U('1518837695005-2083093ee35b') },
  { name: 'Machida', image: U('1518391846935-76eb2a83b6fd') },
  { name: 'Koganei', image: U('1477959858617-67f85cf4f1df') },
  { name: 'Kodaira', image: U('1441974231531-c6227db76b6e') },
  { name: 'Hino', image: U('1501785888042-1a85b4c21e0b') },
  { name: 'Higashimurayama', image: U('1518173946687-a4c036bc9162') },
  { name: 'Kokubunji', image: U('1519500528352-2dab040ba42e') },
  { name: 'Kunitachi', image: U('1506905925346-21bda4d32df4') },
  { name: 'Fussa', image: U('1540959733332-eab4deabeeaf') },
  { name: 'Komae', image: U('1501854148051-d6ea1e45796f') },
  { name: 'Higashiyamato', image: U('1514565131-fce0801e5785') },
  { name: 'Kiyose', image: U('1476514525535-07fb3b4ae5f1') },
  { name: 'Higashikurume', image: U('1518391846935-76eb2a83b6fd') },
  { name: 'Musashimurayama', image: U('1470071459604-3b5ec3a7fe05') },
  { name: 'Tama', image: U('1506905925346-21bda4d32df4') },
  { name: 'Inagi', image: U('1449824913935-59a10b8d85c7') },
  { name: 'Hamura', image: U('1500534314209-a25ddb2bd429') },
  { name: 'Akiruno', image: U('1501785888042-1a85b4c21e0b') },
  { name: 'Nishitokyo', image: U('1519500528352-2dab040ba42e') },
];

export function TokyoWardsSection({ onWardClick, title, subtitle }: TokyoWardsSectionProps) {
  const { t } = useLanguage();
  const [showAll, setShowAll] = useState(false);
  const sectionTitle = title ?? t('section.areas.explore_title');
  const sectionDesc = subtitle ?? t('section.areas.explore_desc');
  const [wards, setWards] = useState<Ward[]>(() =>
    WARDS_BASE.map((w) => ({ ...w, properties: 0 }))
  );

  useEffect(() => {
    async function fetchCounts() {
      const { data, error } = await supabase.from('properties').select('address');
      if (error || !data?.length) {
        setWards((prev) => prev.map((w) => ({ ...w, properties: 0 })));
        return;
      }
      const counts: Record<string, number> = {};
      for (const name of Object.keys(WARD_MATCH_TERMS)) {
        counts[name] = 0;
      }
      const addrLower = (s: string) => (s ?? '').toLowerCase();
      for (const row of data) {
        const addr = addrLower((row as { address?: string }).address ?? '');
        for (const [wardName, terms] of Object.entries(WARD_MATCH_TERMS)) {
          if (terms.some((t) => addr.includes(t.toLowerCase()) || addr.includes(t))) {
            counts[wardName] = (counts[wardName] ?? 0) + 1;
            break;
          }
        }
      }
      setWards(
        WARDS_BASE.map((w) => ({ ...w, properties: counts[w.name] ?? 0 }))
      );
    }
    fetchCounts();
  }, []);

  // 23区と23区外を分けて表示
  const ward23Names = ['Chiyoda', 'Chuo', 'Minato', 'Shinjuku', 'Shibuya', 'Taito', 'Sumida', 'Koto', 'Shinagawa', 'Meguro', 'Bunkyo', 'Setagaya', 'Ota', 'Nakano', 'Suginami', 'Toshima', 'Kita', 'Arakawa', 'Itabashi', 'Nerima', 'Adachi', 'Katsushika', 'Edogawa'];
  const wards23 = wards.filter((w) => ward23Names.includes(w.name));
  const outerWards = wards.filter((w) => !ward23Names.includes(w.name));
  
  // 23区外の物件数を合計
  const outerWardsTotalProperties = outerWards.reduce((sum, w) => sum + w.properties, 0);
  
  // 23区は最初の2行（6カード）だけ表示、残りは「Show more」で表示
  const visibleWards23 = showAll ? wards23 : wards23.slice(0, 6);

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

        {/* 23 Wards - モバイル: 横スクロール / PC: グリッド */}
        <div className="mb-6 md:mb-12">
          <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">{t('section.areas.wards23')}</h3>

          {/* モバイル: 横スクロール */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4 md:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {wards23.map((ward, index) => (
              <motion.div
                key={ward.name}
                className="group relative overflow-hidden rounded-2xl aspect-[3/1.3] min-h-[160px] flex-shrink-0 w-[85vw] max-w-[320px] snap-start cursor-default"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <div className="absolute inset-0 overflow-hidden">
                  <ImageWithFallback src={ward.image} alt={t('ward.' + ward.name)} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
                </div>
                <div className="relative h-full flex flex-col justify-between p-4">
                  <div></div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-0.5">{t('ward.' + ward.name)}</h3>
                    <p className="text-white/90 text-xs mb-2">{t('section.areas.properties_count').replace('{n}', String(ward.properties))}</p>
                    {onWardClick && (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onWardClick(ward.name, 'rent'); }}
                          className="cursor-pointer px-3 py-2 bg-[#C1121F] hover:bg-[#A00F1A] text-white text-xs font-semibold rounded-lg transition-colors shadow-md"
                        >
                          {t('section.areas.view_rentals')}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onWardClick(ward.name, 'buy'); }}
                          className="cursor-pointer px-3 py-2 bg-white hover:bg-gray-100 text-gray-900 text-xs font-semibold rounded-lg transition-colors shadow-md border border-white/50"
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
              {visibleWards23.map((ward, index) => (
              <motion.div
                key={ward.name}
                className="group relative overflow-hidden rounded-2xl aspect-[3/1.3] min-h-[200px] cursor-default min-w-0 w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="absolute inset-0 overflow-hidden">
                  <ImageWithFallback
                    src={ward.image}
                    alt={t('ward.' + ward.name)}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
                </div>
                <div className="relative h-full flex flex-col justify-between p-6">
                  <div></div>
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                      {t('ward.' + ward.name)}
                    </h3>
                  <p className="text-white/90 text-sm mb-3">
                    {t('section.areas.properties_count').replace('{n}', String(ward.properties))}
                  </p>
                  {onWardClick && (
                    <div className="flex gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onWardClick(ward.name, 'rent');
                        }}
                        className="cursor-pointer px-4 py-2.5 bg-[#C1121F] hover:bg-[#A00F1A] text-white text-sm font-semibold rounded-lg transition-colors shadow-md"
                      >
                        {t('section.areas.view_rentals')}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onWardClick(ward.name, 'buy');
                        }}
                        className="cursor-pointer px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-900 text-sm font-semibold rounded-lg transition-colors shadow-md border border-white/50"
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

        {/* Show More/Less Button - 23区のみ・PCのみ（モバイルは横スクロールで全表示） */}
        {wards23.length > 6 && (
          <motion.div
            className="hidden md:flex justify-center mb-6 md:mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-2 px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors group"
            >
              <span>{showAll ? t('section.areas.show_less') : t('section.areas.show_more')}</span>
              {showAll ? (
                <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              ) : (
                <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              )}
            </button>
          </motion.div>
        )}

        {/* Outer 23 Wards - モバイルは23区カードと同じサイズ、PCはグリッド */}
        <div className="mb-6 md:mb-12">
          <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">{t('section.areas.outer')}</h3>
          <div className="md:grid grid-cols-2 lg:grid-cols-3 gap-6 min-w-0 w-full">
            {/* モバイル: 23区カードと同じ幅・高さで表示 */}
            <motion.div
              className="group relative overflow-hidden rounded-2xl aspect-[3/1.3] min-h-[160px] md:min-h-[200px] cursor-default w-[85vw] max-w-[320px] md:w-full md:max-w-none"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 overflow-hidden">
                <ImageWithFallback
                  src="https://unsplash.com/photos/uNvmbsLQ4uU/download?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80"
                  alt="Outer 23 Wards"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
              </div>
              <div className="relative h-full flex flex-col justify-between p-4 md:p-6">
                <div></div>
                <div>
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-0.5 md:mb-1">
                    {t('section.areas.outer')}
                  </h3>
                  <p className="text-white/90 text-xs md:text-sm mb-2 md:mb-3">
                    {t('section.areas.properties_count').replace('{n}', String(outerWardsTotalProperties))}
                  </p>
                  {onWardClick && (
                    <div className="flex gap-2 md:gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onWardClick('Outside23', 'rent');
                        }}
                        className="cursor-pointer px-3 py-2 md:px-4 md:py-2.5 bg-[#C1121F] hover:bg-[#A00F1A] text-white text-xs md:text-sm font-semibold rounded-lg transition-colors shadow-md"
                      >
                        {t('section.areas.view_rentals')}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onWardClick('Outside23', 'buy');
                        }}
                        className="cursor-pointer px-3 py-2 md:px-4 md:py-2.5 bg-white hover:bg-gray-100 text-gray-900 text-xs md:text-sm font-semibold rounded-lg transition-colors shadow-md border border-white/50"
                      >
                        {t('section.areas.view_sale')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
