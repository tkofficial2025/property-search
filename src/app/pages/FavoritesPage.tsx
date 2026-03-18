import { useState, useEffect, useRef } from 'react';
import { Heart, User, LogOut, Search, MapPin, Bed, Maximize2, SlidersHorizontal, X, Calendar, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/app/contexts/CurrencyContext';
import { type Property, type SupabasePropertyRow, mapSupabaseRowToProperty } from '@/lib/properties';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { StationLineLogo } from '@/app/components/StationLineLogo';
import { Header } from '@/app/components/Header';
import { AccountSubHeader } from '@/app/components/AccountSubHeader';
import { SelectedAreaFilter } from '@/app/components/SelectedAreaFilter';
import { filterPropertiesByAreas } from '@/lib/wards';
import type { Page } from '@/lib/routes';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { getStationDisplay } from '@/lib/stationNames';
import { fetchTranslationsForProperties, type PropertyTranslationResult } from '@/lib/translate-property';

interface FavoritesPageProps {
  onNavigate: (page: Page) => void;
  onSelectProperty?: (id: number, source: 'rent' | 'buy') => void;
}

type FavoritesTab = 'rent' | 'buy' | 'short-term';

export function FavoritesPage({ onNavigate, onSelectProperty }: FavoritesPageProps) {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState<FavoritesTab>('rent');
  const [favoritesRent, setFavoritesRent] = useState<Property[]>([]);
  const [favoritesBuy, setFavoritesBuy] = useState<Property[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [sizeMin, setSizeMin] = useState('');
  const [sizeMax, setSizeMax] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('');
  const [petFriendly, setPetFriendly] = useState(false);
  const [foreignFriendly, setForeignFriendly] = useState(false);
  const [elevator, setElevator] = useState(false);
  const [balcony, setBalcony] = useState(false);
  const [luxury, setLuxury] = useState(false);
  const [furnished, setFurnished] = useState(false);
  const [highRiseResidence, setHighRiseResidence] = useState(false);
  const [noKeyMoney, setNoKeyMoney] = useState(false);
  const [forStudents, setForStudents] = useState(false);
  const [designers, setDesigners] = useState(false);
  const [forFamilies, setForFamilies] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [filterBarOpen, setFilterBarOpen] = useState<boolean>(false);
  const moreFiltersRef = useRef<HTMLDivElement>(null);
  const { currency, formatPrice } = useCurrency();
  const { t, language } = useLanguage();
  const [translationMap, setTranslationMap] = useState<Map<number, PropertyTranslationResult>>(new Map());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreFiltersRef.current && !moreFiltersRef.current.contains(e.target as Node)) setMoreFiltersOpen(false);
    };
    if (moreFiltersOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [moreFiltersOpen]);

  function applyFilters(list: Property[]): Property[] {
    const byArea = filterPropertiesByAreas(list, selectedAreas);
    return byArea.filter((property) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!property.title.toLowerCase().includes(q) && !property.address.toLowerCase().includes(q)) return false;
      }
      if (priceMin) {
        const min = parseInt(priceMin.replace(/\D/g, ''), 10);
        if (property.price < min) return false;
      }
      if (priceMax) {
        const max = parseInt(priceMax.replace(/\D/g, ''), 10);
        if (property.price > max) return false;
      }
      if (bedrooms) {
        const beds = parseInt(bedrooms, 10);
        if (property.beds !== beds) return false;
      }
      if (sizeMin) {
        const min = parseFloat(sizeMin);
        if (property.size < min) return false;
      }
      if (sizeMax) {
        const max = parseFloat(sizeMax);
        if (property.size > max) return false;
      }
      if (propertyTypeFilter) {
        const titleLower = property.title.toLowerCase();
        const type = propertyTypeFilter.toLowerCase();
        let matches = false;
        switch (type) {
          case 'apartment':
            matches = titleLower.includes('apartment') || titleLower.includes('アパート');
            break;
          case 'condominium':
            matches = titleLower.includes('condominium') || titleLower.includes('condo') || titleLower.includes('マンション') || titleLower.includes('manshon');
            break;
          case 'house':
            matches = titleLower.includes('house') || titleLower.includes('一戸建て') || titleLower.includes('戸建') || titleLower.includes('detached');
            break;
          case 'studio':
            matches = titleLower.includes('studio') || titleLower.includes('ワンルーム') || titleLower.includes('1r') || titleLower.includes('1k');
            break;
        }
        if (!matches) return false;
      }
      if (petFriendly && property.petFriendly !== true) return false;
      if (foreignFriendly && property.foreignFriendly !== true) return false;
      if (elevator && property.elevator !== true) return false;
      if (balcony && property.balcony !== true) return false;
      if (luxury && property.isFeatured !== true) return false;
      if (furnished) {
        const titleLower = property.title.toLowerCase();
        if (!titleLower.includes('furnished') && !titleLower.includes('家具付き')) return false;
      }
      if (highRiseResidence && (!property.floor || property.floor < 5)) return false;
      if (noKeyMoney && property.keyMoney != null && property.keyMoney !== 0) return false;
      if (forStudents) {
        const titleLower = property.title.toLowerCase();
        if (!titleLower.includes('student') && !titleLower.includes('学生')) return false;
      }
      if (designers) {
        const titleLower = property.title.toLowerCase();
        if (!titleLower.includes('design') && !titleLower.includes('デザイナー')) return false;
      }
      if (forFamilies) {
        const titleLower = property.title.toLowerCase();
        if (!titleLower.includes('family') && !titleLower.includes('家族') && (!property.beds || property.beds < 2)) return false;
      }
      return true;
    });
  }

  const filteredRent = applyFilters(favoritesRent);
  const filteredBuy = applyFilters(favoritesBuy);
  const displayList = activeTab === 'rent' ? filteredRent : filteredBuy;
  const displayIdsKey = displayList.map((p) => p.id).sort((a, b) => a - b).join(',');
  useEffect(() => {
    if (language !== 'zh' || displayList.length === 0) {
      setTranslationMap(new Map());
      return;
    }
    let cancelled = false;
    fetchTranslationsForProperties(displayList, language).then((map) => {
      if (!cancelled) setTranslationMap(map);
    });
    return () => { cancelled = true; };
  }, [language, displayIdsKey]);

  useEffect(() => {
    async function loadUserAndFavorites() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        onNavigate('account');
        return;
      }
      const first = (user.user_metadata?.first_name as string) ?? '';
      const last = (user.user_metadata?.last_name as string) ?? '';
      setUserName([first, last].filter(Boolean).join(' ') || user.email || '');
      setUserEmail(user.email ?? '');

      setLoadingFavorites(true);
      const { data: rows } = await supabase
        .from('user_favorites')
        .select('property_id, type')
        .eq('user_id', user.id);
      if (!rows?.length) {
        setFavoritesRent([]);
        setFavoritesBuy([]);
      } else {
        const rentIds = rows.filter((r) => r.type === 'rent').map((r) => r.property_id);
        const buyIds = rows.filter((r) => r.type === 'buy').map((r) => r.property_id);
        const [rentRes, buyRes] = await Promise.all([
          rentIds.length ? supabase.from('properties').select('*').in('id', rentIds) : { data: [] },
          buyIds.length ? supabase.from('properties').select('*').in('id', buyIds) : { data: [] },
        ]);
        setFavoritesRent((rentRes.data ?? []).map((r) => mapSupabaseRowToProperty(r as SupabasePropertyRow)));
        setFavoritesBuy((buyRes.data ?? []).map((r) => mapSupabaseRowToProperty(r as SupabasePropertyRow)));
      }
      setLoadingFavorites(false);
    }
    loadUserAndFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- redirect when not logged in
  }, []);

  const removeFavorite = async (propertyId: number, type: 'rent' | 'buy') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('property_id', propertyId);
    if (type === 'rent') setFavoritesRent((prev) => prev.filter((p) => p.id !== propertyId));
    else setFavoritesBuy((prev) => prev.filter((p) => p.id !== propertyId));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('home');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onNavigate={onNavigate} currentPage="favorites" />
      <AccountSubHeader currentPage="favorites" onNavigate={onNavigate} userName={userName} onLogout={handleLogout} />
      <div className="flex flex-col md:flex-row pt-20">
      <div className="flex flex-1 min-w-0">
      {/* Sidebar - hidden on mobile, sub-header used instead */}
      <aside className="hidden md:flex w-64 min-h-[calc(100vh-5rem)] bg-gray-200 border-r border-gray-300 flex-col flex-shrink-0">
        <nav className="p-3 flex-1 pt-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">{t('account.user')}</div>
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-300 text-gray-900 font-medium"
          >
            <Heart className="w-5 h-5 text-[#C1121F]" />
            {t('account.favorites')}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('activity')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-300/50 mt-1"
          >
            <Calendar className="w-5 h-5" />
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

      {/* Main content */}
      <main className="flex-1 min-h-[calc(100vh-5rem)] bg-white p-4 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('favorites.title')}</h1>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('rent')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'rent'
                ? 'border-[#C1121F] text-[#C1121F]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('search.rent')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('buy')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'buy'
                ? 'border-[#C1121F] text-[#C1121F]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('search.buy')}
          </button>
        </div>

        {/* Filter bar - モバイルはデフォルト収納・展開で表示、デザインは Rent/Buy/Category と統一 */}
        <div className="mb-6">
          {/* モバイル: Filters タイトル + Show/Hide トグル */}
          <div className="md:hidden flex items-center justify-between py-3 border-b border-gray-200 mb-0">
            <h2 className="text-sm font-semibold text-gray-900">{t('filter.title')}</h2>
            <button
              type="button"
              onClick={() => setFilterBarOpen(!filterBarOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              {filterBarOpen ? (
                <>
                  <span>{t('filter.hide')}</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>{t('filter.show')}</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          {/* デスクトップは常に表示 / モバイルは filterBarOpen のときのみ */}
          <div className={`py-4 ${filterBarOpen ? '' : 'hidden md:block'}`}>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg min-h-[40px]">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder={t('filter.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-gray-700 min-w-[100px] w-28 focus:ring-0 p-0"
                  />
                </div>
                <select
                  value={propertyTypeFilter}
                  onChange={(e) => setPropertyTypeFilter(e.target.value)}
                  className="px-3 py-2 h-[40px] min-w-[130px] bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent transition-colors"
                >
                  <option value="">{t('filter.all')}</option>
                  <option value="apartment">{t('filter.type.apartment')}</option>
                  <option value="condominium">{t('filter.type.condominium')}</option>
                  <option value="house">{t('filter.type.house')}</option>
                  <option value="studio">{t('filter.type.studio')}</option>
                </select>
                <SelectedAreaFilter selectedAreas={selectedAreas} onChange={setSelectedAreas} compact />
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="px-3 py-2 h-[40px] min-w-[100px] bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent transition-colors"
                >
                  <option value="">{t('filter.bedrooms.any')}</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4+</option>
                </select>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg min-h-[40px]">
                  <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{t('filter.price')}</span>
                  <input
                    type="text"
                    placeholder={t('filter.min_yen')}
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-20 px-2 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder={t('filter.max_yen')}
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="w-20 px-2 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg min-h-[40px]">
                  <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{t('filter.size')}</span>
                  <input
                    type="number"
                    placeholder={t('filter.min_sqm')}
                    value={sizeMin}
                    onChange={(e) => setSizeMin(e.target.value)}
                    className="w-20 px-2 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder={t('filter.max_sqm')}
                    value={sizeMax}
                    onChange={(e) => setSizeMax(e.target.value)}
                    className="w-20 px-2 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                  />
                </div>
                <div className="relative" ref={moreFiltersRef}>
                  <button
                    type="button"
                    onClick={() => setMoreFiltersOpen(!moreFiltersOpen)}
                    className={`flex items-center gap-2 px-3 py-2 h-[40px] min-w-[120px] bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent ${
                      moreFiltersOpen ? 'bg-gray-100 border-gray-300' : ''
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 flex-shrink-0" />
                    {t('filter.more_filters')}
                  </button>
                  {moreFiltersOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">{t('filter.more_filters')}</h3>
                        <button type="button" onClick={() => setMoreFiltersOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={petFriendly} onChange={(e) => setPetFriendly(e.target.checked)} className="w-4 h-4 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]" />
                          <span className="text-sm font-medium text-gray-700">{t('category.pet_friendly')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={foreignFriendly} onChange={(e) => setForeignFriendly(e.target.checked)} className="w-4 h-4 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]" />
                          <span className="text-sm font-medium text-gray-700">{t('category.foreign_friendly')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={elevator} onChange={(e) => setElevator(e.target.checked)} className="w-4 h-4 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]" />
                          <span className="text-sm font-medium text-gray-700">{t('property.feature.elevator')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={balcony} onChange={(e) => setBalcony(e.target.checked)} className="w-4 h-4 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]" />
                          <span className="text-sm font-medium text-gray-700">{t('property.feature.balcony')}</span>
                        </label>
                      </div>
                      <div className="pt-3 border-t border-gray-200 mt-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('filter.categories')}</h4>
                        <div className="space-y-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={luxury} onChange={(e) => setLuxury(e.target.checked)} className="w-4 h-4 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]" />
                            <span className="text-sm font-medium text-gray-700">{t('category.luxury')}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={furnished} onChange={(e) => setFurnished(e.target.checked)} className="w-4 h-4 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]" />
                            <span className="text-sm font-medium text-gray-700">{t('category.furnished')}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={highRiseResidence} onChange={(e) => setHighRiseResidence(e.target.checked)} className="w-4 h-4 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]" />
                            <span className="text-sm font-medium text-gray-700">{t('category.high_rise')}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={noKeyMoney} onChange={(e) => setNoKeyMoney(e.target.checked)} className="w-4 h-4 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]" />
                            <span className="text-sm font-medium text-gray-700">{t('category.no_key_money')}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={forStudents} onChange={(e) => setForStudents(e.target.checked)} className="w-4 h-4 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]" />
                            <span className="text-sm font-medium text-gray-700">{t('category.students')}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={designers} onChange={(e) => setDesigners(e.target.checked)} className="w-4 h-4 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]" />
                            <span className="text-sm font-medium text-gray-700">{t('category.designers')}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={forFamilies} onChange={(e) => setForFamilies(e.target.checked)} className="w-4 h-4 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]" />
                            <span className="text-sm font-medium text-gray-700">{t('category.families')}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </div>

        {/* Results */}
        {loadingFavorites ? (
          <p className="text-gray-500">{t('listing.loading')}</p>
        ) : activeTab === 'rent' ? (
          filteredRent.length === 0 ? (
            <p className="text-gray-600">{favoritesRent.length === 0 ? t('favorites.no_favorites') : t('favorites.no_match_rent')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRent.map((property) => (
                <div
                  key={property.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectProperty?.(property.id, 'rent')}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectProperty?.(property.id, 'rent')}
                  className="text-left rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all relative cursor-pointer"
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeFavorite(property.id, 'rent'); }}
                    className="absolute top-2 right-2 z-10 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow"
                    aria-label={t('property.favorite.remove_aria')}
                  >
                    <Heart className="w-4 h-4 fill-[#C1121F] text-[#C1121F]" />
                  </button>
                  <div className="relative aspect-[4/3] bg-gray-100">
                    <ImageWithFallback
                      src={property.image}
                      alt={language === 'zh' ? (translationMap.get(property.id)?.title_zh ?? property.title) : property.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 px-2 py-1 bg-white text-gray-900 text-xs font-semibold rounded-lg">
                      {t('activity.for_rent')}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{language === 'zh' ? (translationMap.get(property.id)?.title_zh ?? property.title) : property.title}</h3>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-1">{language === 'zh' ? (translationMap.get(property.id)?.address_zh ?? property.address) : property.address}</p>
                    <p className="font-semibold text-[#C1121F] mb-2">{formatPrice(property.price, 'rent')}</p>
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
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredBuy.length === 0 ? (
          <p className="text-gray-600">{favoritesBuy.length === 0 ? t('favorites.no_favorites') : t('favorites.no_match_buy')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBuy.map((property) => (
              <div
                key={property.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectProperty?.(property.id, 'buy')}
                onKeyDown={(e) => e.key === 'Enter' && onSelectProperty?.(property.id, 'buy')}
                className="text-left rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all relative cursor-pointer"
              >
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeFavorite(property.id, 'buy'); }}
                  className="absolute top-2 right-2 z-10 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow"
                  aria-label={t('property.favorite.remove_aria')}
                >
                  <Heart className="w-4 h-4 fill-[#C1121F] text-[#C1121F]" />
                </button>
                <div className="relative aspect-[4/3] bg-gray-100">
                  <ImageWithFallback
                    src={property.image}
                    alt={language === 'zh' ? (translationMap.get(property.id)?.title_zh ?? property.title) : property.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 px-2 py-1 bg-[#C1121F] text-white text-xs font-semibold rounded-lg">
                    {t('activity.for_sale')}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{language === 'zh' ? (translationMap.get(property.id)?.title_zh ?? property.title) : property.title}</h3>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-1">{language === 'zh' ? (translationMap.get(property.id)?.address_zh ?? property.address) : property.address}</p>
                  <p className="font-semibold text-[#C1121F] mb-2">{formatPrice(property.price, 'buy')}</p>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      </div>
      </div>
    </div>
  );
}
