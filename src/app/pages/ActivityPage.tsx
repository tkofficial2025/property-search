import { useState, useEffect } from 'react';
import { Heart, User, LogOut, Calendar, MapPin, Bed, Maximize2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { type Property, type SupabasePropertyRow, mapSupabaseRowToProperty } from '@/lib/properties';
import { useCurrency } from '@/app/contexts/CurrencyContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { getStationDisplay } from '@/lib/stationNames';
import { fetchTranslationsForProperties, type PropertyTranslationResult } from '@/lib/translate-property';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { StationLineLogo } from '@/app/components/StationLineLogo';
import { Header } from '@/app/components/Header';
import { AccountSubHeader } from '@/app/components/AccountSubHeader';
import type { Page } from '@/lib/routes';

interface ActivityPageProps {
  onNavigate: (page: Page) => void;
  onSelectProperty?: (id: number, source: 'rent' | 'buy') => void;
}

type TourCandidate = { date: string; timeRange: string };
type AppliedItem = { property: Property; hasTour: boolean; hasInquiry: boolean; tourCandidates?: TourCandidate[] };

export function ActivityPage({ onNavigate, onSelectProperty }: ActivityPageProps) {
  const { t, language } = useLanguage();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'rent' | 'buy'>('rent');
  const [appliedRent, setAppliedRent] = useState<AppliedItem[]>([]);
  const [appliedBuy, setAppliedBuy] = useState<AppliedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();
  const [translationMap, setTranslationMap] = useState<Map<number, PropertyTranslationResult>>(new Map());

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        onNavigate('account');
        return;
      }
      const first = (user.user_metadata?.first_name as string) ?? '';
      const last = (user.user_metadata?.last_name as string) ?? '';
      setUserName([first, last].filter(Boolean).join(' ') || user.email || '');
      setUserEmail(user.email ?? '');

      setLoading(true);
      const [tourRows, inquiryRows] = await Promise.all([
        supabase
          .from('property_tour_requests')
          .select('property_id, property_tour_request_candidates(candidate_date, time_range)')
          .eq('user_id', user.id),
        supabase.from('property_inquiries').select('property_id').eq('email', user.email ?? ''),
      ]);

      // Supabase の bigint が文字列で返ることがあるため、数値に統一。NaN は除外する
      const toNum = (v: unknown): number => (typeof v === 'number' ? v : Number(v));
      const validId = (n: number) => !Number.isNaN(n) && n > 0;
      const tourIds = new Set(
        (tourRows.data ?? []).map((r) => toNum((r as { property_id?: unknown }).property_id)).filter(validId)
      );
      const inquiryIds = new Set(
        (inquiryRows.data ?? []).map((r) => toNum((r as { property_id?: unknown }).property_id)).filter(validId)
      );
      const allIds = [...new Set([...tourIds, ...inquiryIds])];

      // property_id -> 候補日時のマップ（内見予約した物件のみ）
      type CandidateRow = { candidate_date?: string; time_range?: string };
      const tourCandidatesByPropertyId = new Map<number, TourCandidate[]>();
      for (const row of tourRows.data ?? []) {
        const pid = toNum((row as { property_id?: unknown }).property_id);
        if (!validId(pid)) continue;
        const raw = (row as { property_tour_request_candidates?: CandidateRow[] }).property_tour_request_candidates;
        const candidates: TourCandidate[] = Array.isArray(raw)
          ? raw
            .filter((c) => c?.candidate_date)
            .map((c) => ({
              date: String(c.candidate_date).slice(0, 10),
              timeRange: String(c?.time_range ?? ''),
            }))
          : [];
        if (candidates.length > 0) {
          tourCandidatesByPropertyId.set(pid, candidates);
        }
      }

      if (allIds.length === 0) {
        setAppliedRent([]);
        setAppliedBuy([]);
        setLoading(false);
        return;
      }

      const { data: props } = await supabase.from('properties').select('*').in('id', allIds);
      const list: AppliedItem[] = (props ?? []).map((r) => {
        const property = mapSupabaseRowToProperty(r as SupabasePropertyRow);
        const hasTour = tourIds.has(property.id);
        return {
          property,
          hasTour,
          hasInquiry: inquiryIds.has(property.id),
          tourCandidates: hasTour ? tourCandidatesByPropertyId.get(property.id) : undefined,
        };
      });

      setAppliedRent(list.filter((x) => x.property.type === 'rent'));
      setAppliedBuy(list.filter((x) => x.property.type === 'buy'));
      setLoading(false);
    }
    load();
    // 初回マウント時のみ実行（onNavigate を依存に含めると親の再レンダーで再実行され下までスクロール時に「リロード」のように見える）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appliedList = activeTab === 'rent' ? appliedRent : appliedBuy;
  const appliedIdsKey = appliedList.map((i) => i.property.id).sort((a, b) => a - b).join(',');
  useEffect(() => {
    if (language !== 'zh' || appliedList.length === 0) {
      setTranslationMap(new Map());
      return;
    }
    const props = appliedList.map((i) => i.property);
    let cancelled = false;
    fetchTranslationsForProperties(props, language).then((map) => {
      if (!cancelled) setTranslationMap(map);
    });
    return () => { cancelled = true; };
  }, [language, appliedIdsKey]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('home');
  };

  function formatCandidateDate(dateStr: string, timeRange: string) {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return timeRange ? `${formatted} ${timeRange}` : formatted;
    } catch {
      return timeRange ? `${dateStr} ${timeRange}` : dateStr;
    }
  }

  function Card({ item, source }: { item: AppliedItem; source: 'rent' | 'buy' }) {
    const { property, hasTour, hasInquiry, tourCandidates } = item;
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectProperty?.(property.id, source)}
        onKeyDown={(e) => e.key === 'Enter' && onSelectProperty?.(property.id, source)}
        className="text-left rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all relative cursor-pointer"
      >
        <div className="relative aspect-[4/3] bg-gray-100">
          <ImageWithFallback src={property.image} alt={language === 'zh' ? (translationMap.get(property.id)?.title_zh ?? property.title) : property.title} className="w-full h-full object-cover" />
        </div>
        <div className="p-4">
          <div className="mb-3">
            <span
              className={`inline-block px-2 py-1 text-xs font-semibold rounded-lg ${
                source === 'rent' ? 'bg-gray-200 text-gray-800' : 'bg-[#C1121F] text-white'
              }`}
            >
              {source === 'rent' ? 'For Rent' : 'For Sale'}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{language === 'zh' ? (translationMap.get(property.id)?.title_zh ?? property.title) : property.title}</h3>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {hasTour && <span className="inline-flex px-2 py-1 text-white text-xs font-medium rounded" style={{ backgroundColor: '#C1121F' }}>{t('activity.room_tour_booked')}</span>}
            {hasInquiry && <span className="inline-flex px-2 py-1 text-white text-xs font-medium rounded" style={{ backgroundColor: '#374151' }}>{t('activity.details_requested')}</span>}
          </div>
          <p className="text-sm text-gray-500 mb-2 line-clamp-1">{language === 'zh' ? (translationMap.get(property.id)?.address_zh ?? property.address) : property.address}</p>
          <p className="font-semibold text-[#C1121F] mb-2">{formatPrice(property.price, source)}</p>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Bed className="w-3.5 h-3.5" />
            <span>{property.beds}</span>
            <Maximize2 className="w-3.5 h-3.5 ml-1" />
            <span>{property.size} m²</span>
            <span className="ml-1">{property.layout}</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
            <StationLineLogo stationName={property.station} size={14} className="flex-shrink-0" />
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{getStationDisplay(property.station, language)} • {property.walkingMinutes} {t('property.walk.min')}</span>
          </div>

          {hasTour && tourCandidates && tourCandidates.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {t('activity.preferred_tour_dates')}
              </p>
              <ul className="space-y-1 text-xs text-gray-600">
                {tourCandidates.map((c, i) => (
                  <li key={i}>{formatCandidateDate(c.date, c.timeRange)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  const list = activeTab === 'rent' ? appliedRent : appliedBuy;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onNavigate={onNavigate} currentPage="account" />
      <AccountSubHeader currentPage="activity" onNavigate={onNavigate} userName={userName} onLogout={handleLogout} />
      <div className="flex flex-col md:flex-row pt-20">
        <div className="flex flex-1 min-w-0">
        <aside className="hidden md:flex w-64 min-h-[calc(100vh-5rem)] bg-gray-200 border-r border-gray-300 flex-col flex-shrink-0">
          <nav className="p-3 flex-1 pt-6">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">{t('account.user')}</div>
            <button
              type="button"
              onClick={() => onNavigate('favorites')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-300/50 mt-1"
            >
              <Heart className="w-5 h-5" />
              {t('account.favorites')}
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-300 text-gray-900 font-medium mt-1"
            >
              <Calendar className="w-5 h-5 text-[#C1121F]" />
              {t('account.activity')}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-300/50 mt-1"
            >
              <User className="w-5 h-5" />
              {t('account.profile')}
            </button>
          </nav>
          <div className="p-3 border-t border-gray-300 mt-auto space-y-2">
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-[#C1121F]/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-[#C1121F]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{userName || t('account.user')}</p>
                <p className="text-xs text-gray-500 truncate">{userEmail || '—'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-300/50 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              {t('account.logout')}
            </button>
          </div>
        </aside>

        <main className="flex-1 min-h-[calc(100vh-5rem)] bg-white p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('activity.title')}</h1>
          <p className="text-sm text-gray-500 mb-6">{t('activity.subtitle')}</p>

          <div className="flex gap-8 border-b border-gray-200 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('rent')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'rent' ? 'border-[#C1121F] text-[#C1121F]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('search.rent')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('buy')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'buy' ? 'border-[#C1121F] text-[#C1121F]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('search.buy')}
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">{t('listing.loading')}</p>
          ) : list.length === 0 ? (
            <p className="text-gray-600">
              {activeTab === 'rent' ? t('activity.no_rent') : t('activity.no_buy')}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {list.map((item) => (
                <Card key={item.property.id} item={item} source={activeTab} />
              ))}
            </div>
          )}
        </main>
        </div>
      </div>
    </div>
  );
}
