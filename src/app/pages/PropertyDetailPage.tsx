import { useState, useEffect } from 'react';
import {
  MapPin,
  Bed,
  Maximize2,
  Building2,
  Bike,
  Package,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  FileDown,
} from 'lucide-react';
import { Header } from '@/app/components/Header';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { PropertyMap } from '@/app/components/PropertyMap';
import { supabase } from '@/lib/supabase';
import { type Property, type SupabasePropertyRow, mapSupabaseRowToProperty } from '@/lib/properties';
import { useCurrency } from '@/app/contexts/CurrencyContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { getStationDisplay } from '@/lib/stationNames';
import { getPropertyImageUrl } from '@/lib/propertyImageUrl';
import { getPropertyPdfPublicUrl } from '@/lib/propertyPdfUrl';
import { PropertyDetailPageSkeleton } from '@/app/components/PropertyDetailPageSkeleton';
import { toast } from 'sonner';

interface PropertyDetailPageProps {
  propertyId: number;
  source: 'buy';
  onNavigate?: (page: 'home' | 'buy') => void;
  onBack?: () => void;
}

export function PropertyDetailPage({ propertyId, source, onNavigate, onBack }: PropertyDetailPageProps) {
  const { formatPrice } = useCurrency();
  const { t, language } = useLanguage();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  useEffect(() => {
    async function fetchProperty() {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();
      if (err) {
        setError(err.message);
        setProperty(null);
        toast.error(t('error.fetch_failed'));
      } else if (data) {
        setProperty(mapSupabaseRowToProperty(data as SupabasePropertyRow));
      } else {
        setProperty(null);
      }
      setLoading(false);
    }
    fetchProperty();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{t('property.loading')}</p>
      </div>
    );
  }
  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={onNavigate} currentPage={source} />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-red-600 mb-4">{error || t('property.notfound')}</p>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            {t('property.back')}
          </button>
        </div>
      </div>
    );
  }

  const breadcrumbLabel = t('search.buy');
  const priceLabel = t('property.price.buy');
  const priceDisplay = formatPrice(property.price, source);
  const displayTitle = property.title;
  const displayAddress = property.address;

  const allPhotos = [property.image, ...(property.images ?? [])].filter(Boolean) as string[];
  const featureFlags = [
    property.petFriendly && { label: t('property.feature.pet'), Icon: Building2 },
    property.foreignFriendly && { label: t('property.feature.foreign'), Icon: Building2 },
    property.balcony && { label: t('property.feature.balcony'), Icon: Building2 },
    property.bicycleParking && { label: t('property.feature.bicycle'), Icon: Bike },
    property.deliveryBox && { label: t('property.feature.delivery'), Icon: Package },
    property.elevator && { label: t('property.feature.elevator'), Icon: ArrowUpDown },
    property.southFacing && { label: t('property.feature.south'), Icon: Maximize2 },
  ].filter(Boolean) as { label: string; Icon: typeof Building2 }[];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} currentPage={source} />

      <div className="max-w-7xl mx-auto px-6 pt-10 pb-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button type="button" onClick={() => onNavigate?.('home')} className="hover:text-gray-900">
            {t('nav.home')}
          </button>
          <ChevronRight className="w-4 h-4" />
          <span>{breadcrumbLabel}</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 truncate max-w-[200px]">{displayTitle}</span>
        </nav>

        {property.sourcePdfPath && (
          <div className="mb-4">
            <a
              href={getPropertyPdfPublicUrl(property.sourcePdfPath)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-[#C1121F] hover:bg-gray-50 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              {t('property.download_pdf')}
            </a>
          </div>
        )}

        <div className="space-y-6">
            {/* Main Image + Grid (multiple photos from DB) */}
            {/* モバイル: 1枚メイン表示 + その他は横スクロール / デスクトップ: メイン+3枚縦 */}
            <div className="space-y-2">
              {/* モバイル: メイン画像1枚 */}
              <div className="md:hidden relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-200 w-full">
                <ImageWithFallback
                  src={getPropertyImageUrl(allPhotos[0] ?? property.image, 'detail')}
                  alt={displayTitle}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              {/* モバイル: 2枚目以降を横スクロール */}
              {allPhotos.length > 1 && (
                <div className="md:hidden overflow-x-auto pb-1 -mx-1">
                  <div className="flex gap-2 min-w-0">
                    {allPhotos.slice(1).map((url, i) => (
                      <div key={i} className="flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden bg-gray-200">
                        <ImageWithFallback src={getPropertyImageUrl(url, 'detail')} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* デスクトップ: メイン横に3枚縦 */}
              <div className="hidden md:grid grid-cols-4 gap-2">
                <div className="col-span-3 relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-200">
                  <ImageWithFallback
                    src={getPropertyImageUrl(allPhotos[0] ?? property.image, 'detail')}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
                <div className="col-span-1 grid grid-rows-3 gap-2">
                  {allPhotos.slice(1, 4).length > 0
                    ? allPhotos.slice(1, 4).map((url, i) => (
                        <div key={i} className="rounded-lg overflow-hidden bg-gray-200">
                          <ImageWithFallback src={getPropertyImageUrl(url, 'detail')} alt="" className="w-full h-full object-cover min-h-[80px]" />
                        </div>
                      ))
                    : [1, 2, 3].map((i) => (
                        <div key={i} className="rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-xs">{t('property.photo')} {i + 1}</span>
                        </div>
                      ))}
                </div>
              </div>
            </div>

            {/* Location + Title + Station */}
            <p className="text-gray-600">{displayAddress}</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{displayTitle}</h1>
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm">
                <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span>{getStationDisplay(property.station, language)} • {property.walkingMinutes} {t('property.walk.min')}</span>
              </div>
            </div>

            {/* Specs Card */}
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-2 gap-x-4 md:gap-x-8 gap-y-4 min-w-0">
                <div className="flex justify-between items-center gap-2 py-2 border-b border-gray-100 min-w-0">
                  <span className="text-gray-600 text-sm md:text-base min-w-0 truncate">{priceLabel}</span>
                  <span className="font-semibold text-sm md:text-base text-right truncate min-w-0">{priceDisplay}</span>
                </div>
                {source === 'rent' && (
                  <>
                    <div className="flex justify-between items-center gap-2 py-2 border-b border-gray-100 min-w-0">
                      <span className="text-gray-600 text-sm md:text-base min-w-0 truncate">{t('property.management_fee')}</span>
                      <span className="font-medium text-sm md:text-base text-right truncate min-w-0">
                        {property.managementFee != null ? formatPrice(property.managementFee, 'rent') : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2 py-2 border-b border-gray-100 min-w-0">
                      <span className="text-gray-600 text-sm md:text-base min-w-0 truncate">{t('property.deposit')}</span>
                      <span className="font-medium text-sm md:text-base text-right truncate min-w-0">
                        {property.deposit != null ? (property.deposit === 0 ? t('property.no_deposit') : formatPrice(property.deposit, 'rent')) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2 py-2 border-b border-gray-100 min-w-0">
                      <span className="text-gray-600 text-sm md:text-base min-w-0 truncate">{t('property.key_money')}</span>
                      <span className="font-medium text-sm md:text-base text-right truncate min-w-0">
                        {property.keyMoney != null ? (property.keyMoney === 0 ? t('property.no_key_money') : formatPrice(property.keyMoney, 'rent')) : '—'}
                      </span>
                    </div>
                  </>
                )}
                {source === 'buy' && property.managementFee != null && (
                  <div className="flex justify-between items-center gap-2 py-2 border-b border-gray-100 min-w-0">
                    <span className="text-gray-600 text-sm md:text-base min-w-0 truncate">{t('property.management_fee')}</span>
                    <span className="font-medium text-sm md:text-base text-right truncate min-w-0">{formatPrice(property.managementFee, 'rent')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center gap-2 py-2 border-b border-gray-100 min-w-0">
                  <span className="text-gray-600 text-sm md:text-base min-w-0 truncate">{t('property.layout')}</span>
                  <span className="font-medium text-sm md:text-base text-right truncate min-w-0">{property.layout}</span>
                </div>
                <div className="flex justify-between items-center gap-2 py-2 border-b border-gray-100 min-w-0">
                  <span className="text-gray-600 text-sm md:text-base min-w-0 truncate">{t('property.bedrooms')}</span>
                  <span className="font-medium text-sm md:text-base text-right truncate min-w-0">{property.beds}</span>
                </div>
                <div className="flex justify-between items-center gap-2 py-2 border-b border-gray-100 min-w-0">
                  <span className="text-gray-600 text-sm md:text-base min-w-0 truncate">{t('property.size')}</span>
                  <span className="font-medium text-sm md:text-base text-right truncate min-w-0">{property.size} m²</span>
                </div>
                <div className="flex justify-between items-center gap-2 py-2 border-b border-gray-100 min-w-0">
                  <span className="text-gray-600 text-sm md:text-base min-w-0 truncate">{t('property.floor')}</span>
                  <span className="font-medium text-sm md:text-base text-right truncate min-w-0">{property.floor != null ? `${property.floor}F` : '—'}</span>
                </div>
              </div>
            </div>

            {/* Rental Fees pills (from DB) */}
            {source === 'rent' && (property.keyMoney != null || property.deposit != null) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('property.rental_fees')}</h3>
                <div className="flex flex-wrap gap-2">
                  {property.keyMoney === 0 && (
                    <span className="px-4 py-2 bg-[#C1121F]/10 text-[#C1121F] rounded-lg text-sm font-medium">{t('property.no_key_money')}</span>
                  )}
                  {property.keyMoney != null && property.keyMoney > 0 && (
                    <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">{t('property.key_money')}</span>
                  )}
                  {property.deposit != null && (
                    <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">{property.deposit === 0 ? t('property.no_deposit') : t('property.deposit')}</span>
                  )}
                </div>
              </div>
            )}

            {/* Property Features (only show when true in DB) */}
            {featureFlags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('property.features')}</h3>
                <div className="flex flex-wrap gap-2">
                  {featureFlags.map(({ label, Icon }) => (
                    <span key={label} className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-full flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Property Information */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('property.information')}</h3>
              {property.propertyInformation && property.propertyInformation.trim() ? (
                <>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {descriptionExpanded
                      ? property.propertyInformation.trim()
                      : property.propertyInformation.trim().length > 200
                        ? `${property.propertyInformation.trim().slice(0, 200)}...`
                        : property.propertyInformation.trim()}
                  </p>
                  {property.propertyInformation.trim().length > 200 && (
                    <button
                      type="button"
                      onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                      className="mt-2 text-sm font-medium text-[#C1121F] flex items-center gap-1"
                    >
                      {descriptionExpanded ? t('property.showLess') : t('property.readMore')} <ChevronDown className={`w-4 h-4 transition-transform ${descriptionExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {descriptionExpanded
                      ? `${displayTitle}は、${displayAddress}に所在する専有面積約${property.size}m²、間取り${property.layout}、寝室${property.beds}室の物件です。${getStationDisplay(property.station, language)}から徒歩約${property.walkingMinutes}${t('property.walk.min_short')}でアクセスできます。`
                      : `${displayTitle}は、${displayAddress}に所在する専有面積約${property.size}m²の物件です...`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                    className="mt-2 text-sm font-medium text-[#C1121F] flex items-center gap-1"
                  >
                    {descriptionExpanded ? t('property.showLess') : t('property.readMore')} <ChevronDown className={`w-4 h-4 transition-transform ${descriptionExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </>
              )}
            </div>

            {/* Initial fees by card (only when enabled in DB) */}
            {source === 'rent' && property.initialFeesCreditCard && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('property.initial_fees_card')}</h3>
                <p className="text-xs text-gray-500 mb-4">{t('property.initial_fees_card_note')}</p>
                <div className="flex gap-4 text-gray-600">
                  <span className="text-xs font-medium">JCB</span>
                  <span className="text-xs font-medium">Mastercard</span>
                  <span className="text-xs font-medium">VISA</span>
                  <span className="text-xs font-medium">AMEX</span>
                </div>
              </div>
            )}

            {/* Map */}
            {property.address && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('property.location')}</h3>
                <PropertyMap 
                  address={displayAddress} 
                  title={displayTitle}
                  height="400px"
                />
              </div>
            )}
        </div>

        {/* Back to list */}
        <div className="mt-8 pb-12">
          <button
            type="button"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
          >
            ← {t('property.back_to_list')}
          </button>
        </div>
      </div>
    </div>
  );
}
