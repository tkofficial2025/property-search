import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import {
  Heart,
  Bed,
  Maximize2,
  MapPin,
  Map as MapIcon,
  Bookmark,
} from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { QuickPropertySearch } from '@/app/components/QuickPropertySearch';
import { StationLineLogo } from '@/app/components/StationLineLogo';
import { PropertiesMapView } from '@/app/components/PropertiesMapView';
import { supabase } from '@/lib/supabase';
import { addressMatchesWard } from '@/lib/wards';
import { type Property, type SupabasePropertyRow, mapSupabaseRowToProperty } from '@/lib/properties';
import { useCurrency } from '@/app/contexts/CurrencyContext';
import { filterPropertiesByHeroParams, type HeroSearchParams } from '@/lib/searchFilters';
import { sortProperties, sortOptions, type SortOption } from '@/lib/sortProperties';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { getStationDisplay } from '@/lib/stationNames';
import { PropertyCardSkeleton } from '@/app/components/PropertyCardSkeleton';

interface PropertyListingPageProps {
  selectedWard?: string | null;
  onSelectProperty?: (id: number) => void;
  initialSearchParams?: HeroSearchParams;
}

export function PropertyListingPage({ selectedWard, onSelectProperty, initialSearchParams }: PropertyListingPageProps = {}) {
  const { formatPrice } = useCurrency();
  const { t, language } = useLanguage();
  // デスクトップは地図表示ON、モバイルはOFF。言語切り替えで再マウントされても sessionStorage で復元
  const SHOW_MAP_KEY = 'buy-listing-showMap';
  const [showMap, setShowMapState] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = sessionStorage.getItem(SHOW_MAP_KEY);
    if (stored !== null) return stored === '1';
    return window.innerWidth >= 768;
  });
  const setShowMap = (value: boolean | ((prev: boolean) => boolean)) => {
    setShowMapState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      try { sessionStorage.setItem(SHOW_MAP_KEY, next ? '1' : '0'); } catch {}
      return next;
    });
  };
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HeroSearchParams>(() => {
    if (initialSearchParams && initialSearchParams.propertyType === 'buy') return initialSearchParams;
    return { propertyType: 'buy', selectedAreas: [] };
  });
  const [sidebarWidth, setSidebarWidth] = useState<number>(384); // w-96 = 384px
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<'popularity' | 'price-asc' | 'price-desc' | 'size-asc' | 'size-desc' | 'walking-asc' | 'walking-desc' | 'newest' | 'oldest'>('popularity');
  const [retryTrigger, setRetryTrigger] = useState(0);

  const isNewBadge = (property: Property): boolean => {
    if (property.isNew) return true;
    if (!property.createdAt) return false;
    const created = new Date(property.createdAt).getTime();
    if (Number.isNaN(created)) return false;
    const days = (Date.now() - created) / (1000 * 60 * 60 * 24);
    return days <= 7;
  };

  // サイドバー幅を35%に初期化
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSidebarWidth(window.innerWidth * 0.35);
    }
  }, []);

  useEffect(() => {
    if (initialSearchParams && initialSearchParams.propertyType === 'buy') {
      setFilters(initialSearchParams);
    }
  }, [initialSearchParams]);

  const fetchBuyProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: raw, error: err } = await supabase.from('properties').select('*').eq('type', 'buy');
    const data = Array.isArray(raw) ? raw : [];
    if (import.meta.env.DEV) console.log('[Buy] Supabase', { data, error: err });
    if (err) {
      setError(err.message);
      setAllProperties([]);
      toast.error(t('error.fetch_failed'));
    } else {
      setAllProperties((data ?? []).map((row) => mapSupabaseRowToProperty(row as SupabasePropertyRow)));
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    fetchBuyProperties();
  }, [fetchBuyProperties, retryTrigger]);

  const baseList =
    filterPropertiesByHeroParams(allProperties, filters, 'buy');

  const properties = selectedWard ? baseList.filter((p) => addressMatchesWard(p.address, selectedWard)) : baseList;

  // 並び替え適用
  const sortedProperties = sortProperties(properties, sortOption);

  const toggleFavorite = (id: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  // サイドバーリサイズ処理
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      // 最小幅320px、最大幅800px
      if (newWidth >= 320 && newWidth <= 800) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Filter Bar */}
      <div className="sticky top-20 z-40 bg-white border-b border-gray-200 shadow-sm" style={{ marginTop: '80px' }}>
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">{t('filter.title')}</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">{t('filter.show_map')}</span>
              <button
                onClick={() => setShowMap(!showMap)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:ring-offset-2 ${
                  showMap ? 'bg-[#C1121F]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showMap ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="py-4">
            <QuickPropertySearch initialParams={filters} onSearch={(p) => setFilters(p)} />
          </div>
        </div>
      </div>

      {/* Main Content - Property Listings + Map */}
      {showMap ? (
        <>
          {/* PC: サイドバー(リスト) + 地図 */}
          <div className="hidden md:flex relative z-0" style={{ height: 'calc(100vh - 160px)', marginTop: '0' }}>
          {/* Left Sidebar - Property Listings */}
          <div 
            className="bg-white border-r border-gray-200 shadow-sm overflow-y-auto overflow-x-hidden relative z-10" 
            style={{ 
              width: `${sidebarWidth}px`,
              height: 'calc(100vh - 160px)',
              minWidth: '320px',
              maxWidth: '800px'
            }}
          >
            {/* Resize Handle */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#C1121F] transition-colors z-20"
              style={{ cursor: 'col-resize' }}
            />
            <div className="p-4">
              {/* Header */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  {selectedWard ? t('listing.title.ward').replace('{ward}', t('ward.' + selectedWard)) : t('listing.title')}
                </h1>
                <p className="text-sm text-gray-600">{t('listing.results').replace('{count}', String(sortedProperties.length))}</p>
              </div>

              {/* Sort Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('sort.label')}</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-all text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(`sort.${option.value.replace('-', '_')}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Property Listings */}
              <div className="space-y-4">
              {loading && (
                <div className="space-y-4" aria-busy="true" aria-label={t('listing.loading')}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <PropertyCardSkeleton key={i} />
                  ))}
                </div>
              )}
              {error && (
                <div className="py-8 text-center">
                  <p className="text-red-600 text-sm mb-2">{t('listing.error').replace('{error}', error)}</p>
                  <p className="text-gray-500 text-xs mb-4">{t('error.fetch_failed')}</p>
                  <button
                    type="button"
                    onClick={() => setRetryTrigger((n) => n + 1)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
                  >
                    {t('common.retry')}
                  </button>
                </div>
              )}
              {!loading && !error && sortedProperties.length === 0 && (
                <div className="py-16 text-center text-gray-500 text-sm">
                  {t('listing.empty')}
                </div>
              )}
              {!loading && !error && sortedProperties.map((property, index) => {
                const displayTitle = property.title;
                const displayAddress = property.address;
                return (
                <motion.div
                  key={property.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectProperty?.(property.id)}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectProperty?.(property.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-100"
                  whileHover={{ y: -2 }}
                >
                  {/* Image - モバイル: メイン大・その他小 / PC: 単一 */}
                  {(() => {
                    const allImages = (property.images?.length ? property.images : [property.image]) as string[];
                    const mainImage = allImages[0] ?? property.image;
                    const otherImages = allImages.slice(1);
                    return (
                      <>
                        <div className="md:hidden">
                          <div className="relative h-64 w-full overflow-hidden">
                            <ImageWithFallback src={mainImage} alt={displayTitle} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                            <div className="absolute top-2 left-2 flex gap-2 z-10">
                              {property.isFeatured && <span className="px-2 py-0.5 bg-[#C1121F] text-white text-xs font-semibold rounded-full">{t('listing.badge.popular')}</span>}
                              {isNewBadge(property) && <span className="px-2 py-0.5 bg-white text-gray-900 text-xs font-semibold rounded-full">{t('listing.badge.new')}</span>}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(property.id); }} className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all hover:scale-110 z-10">
                              <Heart className={`w-4 h-4 ${favorites.has(property.id) ? 'fill-[#C1121F] text-[#C1121F]' : 'text-gray-700'}`} />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <h3 className={`text-base font-bold text-white mb-1 line-clamp-1 ${property.isFeatured ? 'pt-10' : ''}`}>{displayTitle}</h3>
                              <p className="text-white/80 text-xs mb-2 line-clamp-1">{displayAddress}</p>
                              <div className="text-xl font-bold text-white mb-2">{formatPrice(property.price, 'buy')}</div>
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <div className="flex items-center gap-1 text-white/90"><Bed className="w-3 h-3" /><span className="text-xs font-medium">{property.beds}</span></div>
                                <div className="flex items-center gap-1 text-white/90"><Maximize2 className="w-3 h-3" /><span className="text-xs font-medium">{property.size} m²</span></div>
                                <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full"><span className="text-xs font-medium text-white">{property.layout}</span></div>
                              </div>
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                                <StationLineLogo stationName={property.station} size={12} className="flex-shrink-0" />
                                <MapPin className="w-3 h-3 text-white flex-shrink-0" />
                                <span className="text-xs font-medium text-white">{getStationDisplay(property.station, language)} • {property.walkingMinutes} {t('property.walk.min')}</span>
                              </div>
                            </div>
                          </div>
                          {otherImages.length > 0 && (
                            <div className="flex gap-1.5 p-2 overflow-x-auto bg-gray-50">
                              {otherImages.map((url, i) => (
                                <div key={i} className="relative h-14 w-20 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                                  <ImageWithFallback src={url} alt="" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="hidden md:block relative h-52 w-full overflow-hidden">
                          <ImageWithFallback src={property.image} alt={displayTitle} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                          <div className="absolute top-2 left-2 flex gap-2 z-10">
                            {property.isFeatured && <span className="px-2 py-0.5 bg-[#C1121F] text-white text-xs font-semibold rounded-full">{t('listing.badge.popular')}</span>}
                            {isNewBadge(property) && <span className="px-2 py-0.5 bg-white text-gray-900 text-xs font-semibold rounded-full">{t('listing.badge.new')}</span>}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); toggleFavorite(property.id); }} className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all hover:scale-110 z-10">
                            <Heart className={`w-4 h-4 ${favorites.has(property.id) ? 'fill-[#C1121F] text-[#C1121F]' : 'text-gray-700'}`} />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className={`text-base font-bold text-white mb-1 line-clamp-1 ${property.isFeatured ? 'pt-10' : ''}`}>{displayTitle}</h3>
                            <p className="text-white/80 text-xs mb-2 line-clamp-1">{displayAddress}</p>
                            <div className="text-xl font-bold text-white mb-2">{formatPrice(property.price, 'buy')}</div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <div className="flex items-center gap-1 text-white/90"><Bed className="w-3 h-3" /><span className="text-xs font-medium">{property.beds}</span></div>
                              <div className="flex items-center gap-1 text-white/90"><Maximize2 className="w-3 h-3" /><span className="text-xs font-medium">{property.size} m²</span></div>
                              <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full"><span className="text-xs font-medium text-white">{property.layout}</span></div>
                            </div>
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                              <StationLineLogo stationName={property.station} size={12} className="flex-shrink-0" />
                              <MapPin className="w-3 h-3 text-white flex-shrink-0" />
                              <span className="text-xs font-medium text-white">{getStationDisplay(property.station, language)} • {property.walkingMinutes} {t('property.walk.min')}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              ); })}
            </div>

            {/* Load More */}
            {!loading && !error && sortedProperties.length > 0 && (
              <div className="mt-6 text-center">
                <button className="px-6 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all">
                  {t('listing.load_more')}
                </button>
              </div>
            )}
          </div>
        </div>

          {/* Right Side - Map (Full Screen) */}
          <div className="flex-1 relative z-0">
            <PropertiesMapView
              properties={properties}
              onPropertyClick={onSelectProperty}
              height="100%"
              className="w-full"
            />
          </div>
          </div>
          {/* モバイル: 地図のみフル表示 */}
          <div className="md:hidden relative z-0 w-full" style={{ height: 'calc(100vh - 160px)' }}>
            <PropertiesMapView
              properties={properties}
              onPropertyClick={onSelectProperty}
              height="100%"
              className="w-full"
            />
          </div>
        </>
      ) : (
        <>
          {/* Grid Layout when Map is Hidden */}
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Header and Sort */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {selectedWard ? t('listing.title.ward').replace('{ward}', t('ward.' + selectedWard)) : t('listing.title')}
              </h1>
              <p className="text-sm text-gray-600">{t('listing.results').replace('{count}', String(sortedProperties.length))}</p>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('sort.label')}</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-all text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(`sort.${option.value.replace('-', '_')}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Property Grid */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" aria-busy="true" aria-label={t('listing.loading')}>
              {Array.from({ length: 8 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          )}
          {error && (
            <div className="py-16 text-center">
              <p className="text-red-600 text-sm mb-2">{t('listing.error').replace('{error}', error)}</p>
              <p className="text-gray-500 text-sm mb-4">{t('error.fetch_failed')}</p>
              <button
                type="button"
                onClick={() => setRetryTrigger((n) => n + 1)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
              >
                {t('common.retry')}
              </button>
            </div>
          )}
          {!loading && !error && sortedProperties.length === 0 && (
            <div className="py-16 text-center text-gray-500 text-sm">
              {t('listing.empty')}
            </div>
          )}
          {!loading && !error && sortedProperties.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProperties.map((property, index) => {
                const displayTitle = property.title;
                const displayAddress = property.address;
                return (
                <motion.div
                  key={property.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectProperty?.(property.id)}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectProperty?.(property.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-100"
                  whileHover={{ y: -2 }}
                >
                  {/* Image - モバイル: メイン大・その他小 / PC: 単一 */}
                  {(() => {
                    const allImages = (property.images?.length ? property.images : [property.image]) as string[];
                    const mainImage = allImages[0] ?? property.image;
                    const otherImages = allImages.slice(1);
                    return (
                      <>
                        <div className="md:hidden">
                          <div className="relative h-64 w-full overflow-hidden">
                            <ImageWithFallback src={mainImage} alt={displayTitle} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                            <div className="absolute top-2 left-2 flex gap-2 z-10">
                              {property.isFeatured && <span className="px-2 py-0.5 bg-[#C1121F] text-white text-xs font-semibold rounded-full">{t('listing.badge.popular')}</span>}
                              {isNewBadge(property) && <span className="px-2 py-0.5 bg-white text-gray-900 text-xs font-semibold rounded-full">{t('listing.badge.new')}</span>}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(property.id); }} className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all hover:scale-110 z-10">
                              <Heart className={`w-4 h-4 ${favorites.has(property.id) ? 'fill-[#C1121F] text-[#C1121F]' : 'text-gray-700'}`} />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <h3 className={`text-base font-bold text-white mb-1 line-clamp-1 ${property.isFeatured ? 'pt-10' : ''}`}>{displayTitle}</h3>
                              <p className="text-white/80 text-xs mb-2 line-clamp-1">{displayAddress}</p>
                              <div className="text-xl font-bold text-white mb-2">{formatPrice(property.price, 'buy')}</div>
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <div className="flex items-center gap-1 text-white/90"><Bed className="w-3 h-3" /><span className="text-xs font-medium">{property.beds}</span></div>
                                <div className="flex items-center gap-1 text-white/90"><Maximize2 className="w-3 h-3" /><span className="text-xs font-medium">{property.size} m²</span></div>
                                <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full"><span className="text-xs font-medium text-white">{property.layout}</span></div>
                              </div>
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                                <StationLineLogo stationName={property.station} size={12} className="flex-shrink-0" />
                                <MapPin className="w-3 h-3 text-white flex-shrink-0" />
                                <span className="text-xs font-medium text-white">{getStationDisplay(property.station, language)} • {property.walkingMinutes} {t('property.walk.min')}</span>
                              </div>
                            </div>
                          </div>
                          {otherImages.length > 0 && (
                            <div className="flex gap-1.5 p-2 overflow-x-auto bg-gray-50">
                              {otherImages.map((url, i) => (
                                <div key={i} className="relative h-14 w-20 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                                  <ImageWithFallback src={url} alt="" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="hidden md:block relative h-52 w-full overflow-hidden">
                          <ImageWithFallback src={property.image} alt={displayTitle} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                          <div className="absolute top-2 left-2 flex gap-2 z-10">
                            {property.isFeatured && <span className="px-2 py-0.5 bg-[#C1121F] text-white text-xs font-semibold rounded-full">{t('listing.badge.popular')}</span>}
                            {isNewBadge(property) && <span className="px-2 py-0.5 bg-white text-gray-900 text-xs font-semibold rounded-full">{t('listing.badge.new')}</span>}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); toggleFavorite(property.id); }} className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all hover:scale-110 z-10">
                            <Heart className={`w-4 h-4 ${favorites.has(property.id) ? 'fill-[#C1121F] text-[#C1121F]' : 'text-gray-700'}`} />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className={`text-base font-bold text-white mb-1 line-clamp-1 ${property.isFeatured ? 'pt-10' : ''}`}>{displayTitle}</h3>
                            <p className="text-white/80 text-xs mb-2 line-clamp-1">{displayAddress}</p>
                            <div className="text-xl font-bold text-white mb-2">{formatPrice(property.price, 'buy')}</div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <div className="flex items-center gap-1 text-white/90"><Bed className="w-3 h-3" /><span className="text-xs font-medium">{property.beds}</span></div>
                              <div className="flex items-center gap-1 text-white/90"><Maximize2 className="w-3 h-3" /><span className="text-xs font-medium">{property.size} m²</span></div>
                              <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full"><span className="text-xs font-medium text-white">{property.layout}</span></div>
                            </div>
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                              <StationLineLogo stationName={property.station} size={12} className="flex-shrink-0" />
                              <MapPin className="w-3 h-3 text-white flex-shrink-0" />
                              <span className="text-xs font-medium text-white">{getStationDisplay(property.station, language)} • {property.walkingMinutes} {t('property.walk.min')}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              ); })}
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
}