import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { AREA_OPTIONS } from '@/lib/wards';
import type { HeroSearchParams } from '@/lib/searchFilters';
import { useLanguage } from '@/app/contexts/LanguageContext';

const AREA_DROPDOWN_MAX_HEIGHT = 380;

interface DropdownOption {
  value: string;
  label: string;
}

const propertyTypes = ['rent', 'buy'] as const;
type PropertyType = typeof propertyTypes[number];

/** Area: 東京23区＋23区外（QuickPropertySearch 用・複数選択） */
const areas: DropdownOption[] = AREA_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }));

/** Budget options for buy: value + i18n key */
const buyBudgetKeys = [
  { value: '0-50m', key: 'search.budget.under_50m' },
  { value: '50m-80m', key: 'search.budget.50m_80m' },
  { value: '80m-120m', key: 'search.budget.80m_120m' },
  { value: '120m-200m', key: 'search.budget.120m_200m' },
  { value: '200m+', key: 'search.budget.over_200m' },
];

/** Budget options for rent: value + i18n key */
const rentBudgetKeys = [
  { value: '0-150k', key: 'search.budget.under_150k' },
  { value: '150k-250k', key: 'search.budget.150k_250k' },
  { value: '250k-400k', key: 'search.budget.250k_400k' },
  { value: '400k-600k', key: 'search.budget.400k_600k' },
  { value: '600k+', key: 'search.budget.over_600k' },
];

/** Bedroom options: value + i18n key */
const bedroomKeys = [
  { value: 'studio', key: 'search.bedrooms.studio' },
  { value: '1br', key: 'search.bedrooms.1br' },
  { value: '2br', key: 'search.bedrooms.2br' },
  { value: '3br', key: 'search.bedrooms.3br' },
  { value: '4br+', key: 'search.bedrooms.4br_plus' },
];

interface DropdownProps {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

function Dropdown({ label, options, value, onChange, placeholder }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative flex-1 min-w-0" ref={dropdownRef}>
      <button
        type="button"
        className="w-full px-2 sm:px-4 py-2 md:py-3 text-left flex items-center justify-between gap-1 sm:gap-2 hover:bg-gray-50 transition-colors rounded-lg group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[10px] md:text-xs text-gray-500 mb-0.5 truncate">{label}</div>
          <div className="text-xs md:text-sm text-gray-900 font-medium truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </div>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-[100]"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                  value === option.value
                    ? 'bg-[#C1121F]/5 text-[#C1121F] font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Area 用: 複数選択・チェックボックス・スクロール可能（areas は翻訳済みラベル） */
interface AreaMultiSelectProps {
  selectedAreas: Set<string>;
  onChange: (selected: Set<string>) => void;
  areas: DropdownOption[];
}

function AreaMultiSelect({ selectedAreas, onChange, areas }: AreaMultiSelectProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [areaSearch, setAreaSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) setAreaSearch('');
  }, [isOpen]);

  const toggle = (value: string) => {
    const next = new Set(selectedAreas);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  };

  const searchLower = areaSearch.trim().toLowerCase();
  const filteredAreas = searchLower
    ? areas.filter((a) => a.label.toLowerCase().includes(searchLower))
    : areas;

  const count = selectedAreas.size;
  const displayText = count === 0 ? t('search.area.select') : count === 1 ? areas.find((a) => a.value === [...selectedAreas][0])?.label ?? t('search.area.one') : t('search.area.many').replace('{n}', String(count));

  return (
    <div className="relative flex-1 min-w-0" ref={dropdownRef}>
      <button
        type="button"
        className="w-full px-2 sm:px-4 py-2 md:py-3 text-left flex items-center justify-between gap-1 sm:gap-2 hover:bg-gray-50 transition-colors rounded-lg group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[10px] md:text-xs text-gray-500 mb-0.5 truncate">{t('search.area.label_short')}</div>
          <div className="text-xs md:text-sm text-gray-900 font-medium truncate">{displayText}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 z-[100] flex flex-col overflow-hidden min-w-[220px] w-max max-w-[min(100vw,320px)]"
            style={{ maxHeight: AREA_DROPDOWN_MAX_HEIGHT }}
          >
            <div className="flex-shrink-0 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              {t('search.area.header')}
            </div>
            <div className="flex-shrink-0 p-2 border-b border-gray-100">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={areaSearch}
                  onChange={(e) => setAreaSearch(e.target.value)}
                  placeholder={t('search.area.search_placeholder')}
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-1">
              {filteredAreas.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">{t('search.area.no_match')}</div>
              ) : (
                filteredAreas.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-b-0 min-w-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAreas.has(option.value)}
                      onChange={() => toggle(option.value)}
                      className="w-4 h-4 rounded border-gray-300 text-[#C1121F] focus:ring-[#C1121F] flex-shrink-0"
                    />
                    <span className="min-w-0 break-words">{option.label}</span>
                  </label>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface QuickPropertySearchProps {
  onSearch?: (params: HeroSearchParams) => void;
}

export function QuickPropertySearch({ onSearch }: QuickPropertySearchProps = {}) {
  const { t } = useLanguage();
  const [propertyType, setPropertyType] = useState<PropertyType>('rent');
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [budget, setBudget] = useState('');
  const [bedroomCount, setBedroomCount] = useState('');
  const [keyword, setKeyword] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced filters
  const [propertySizeMin, setPropertySizeMin] = useState('');
  const [propertySizeMax, setPropertySizeMax] = useState('');
  const [petFriendly, setPetFriendly] = useState(false);
  const [foreignFriendly, setForeignFriendly] = useState(false);
  const [luxury, setLuxury] = useState(false);
  const [furnished, setFurnished] = useState(false);
  const [highRiseResidence, setHighRiseResidence] = useState(false);
  const [noKeyMoney, setNoKeyMoney] = useState(false);
  const [forStudents, setForStudents] = useState(false);
  const [designers, setDesigners] = useState(false);
  const [forFamilies, setForFamilies] = useState(false);

  const budgetOptions: DropdownOption[] = useMemo(() => {
    const keys = propertyType === 'buy' ? buyBudgetKeys : rentBudgetKeys;
    return keys.map(({ value, key }) => ({ value, label: t(key) }));
  }, [propertyType, t]);

  const bedroomOptions: DropdownOption[] = useMemo(() => {
    return bedroomKeys.map(({ value, key }) => ({ value, label: t(key) }));
  }, [t]);

  const budgetLabel = propertyType === 'buy' ? t('search.budget.price') : t('search.budget.monthly_rent');

  const areaOptions: DropdownOption[] = useMemo(
    () => AREA_OPTIONS.map((opt) => ({ value: opt.value, label: t('ward.' + opt.value) })),
    [t]
  );

  const handleSearch = () => {
    const params: HeroSearchParams = {
      propertyType,
      selectedAreas: [...selectedAreas],
      budget,
      bedroomCount,
      sizeMin: propertySizeMin ? Number(propertySizeMin) || undefined : undefined,
      sizeMax: propertySizeMax ? Number(propertySizeMax) || undefined : undefined,
      keyword: keyword.trim() || undefined,
      luxury: luxury || undefined,
      petFriendly: petFriendly || undefined,
      foreignFriendly: foreignFriendly || undefined,
      furnished: furnished || undefined,
      highRiseResidence: highRiseResidence || undefined,
      noKeyMoney: noKeyMoney || undefined,
      forStudents: forStudents || undefined,
      designers: designers || undefined,
      forFamilies: forFamilies || undefined,
    };
    onSearch?.(params);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="w-full max-w-full md:max-w-5xl mx-auto overflow-visible px-2 md:px-0"
    >
      {/* Property Type Segmented Control */}
      <div className="flex justify-center mb-3 md:mb-4">
        <div className="inline-flex bg-white/95 backdrop-blur-sm rounded-full p-1 md:p-1.5 shadow-md md:shadow-lg border border-gray-100">
          {propertyTypes.map((type) => (
            <button
              key={type}
              onClick={() => {
                setPropertyType(type);
                setBudget(''); // Reset budget when type changes
              }}
              className="relative px-4 py-1.5 md:px-6 md:py-2.5 rounded-full font-semibold text-xs md:text-sm transition-all duration-300"
            >
              {/* Active background */}
              {propertyType === type && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-full shadow-md"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              
              {/* Text */}
              <span className={`relative z-10 transition-colors ${
                propertyType === type 
                  ? 'text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
                {type === 'rent' && t('search.rent')}
                {type === 'buy' && t('search.buy')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Keyword Search - 独立した行 */}
      <div className="mb-3 md:mb-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg md:rounded-xl shadow-md md:shadow-lg border border-gray-100 px-3 py-2 md:px-4 md:py-3">
          <div className="flex items-center gap-2 md:gap-3">
            <Search className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('search.placeholder.keyword')}
              className="flex-1 border-none outline-none text-sm md:text-base text-gray-900 placeholder-gray-400 bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Main Search Bar（モバイル: 1段目 Area/Bedrooms/Rent、2段目 Search。md以上: 1行に4要素） */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-md md:shadow-lg border border-gray-100 overflow-visible">
        {/* モバイル: 横スクロール廃止。1段目＝3項目、2段目＝Search */}
        <AnimatePresence mode="wait">
          <motion.div
            key={propertyType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="overflow-visible"
          >
            <div className="flex flex-col md:flex-row md:flex-nowrap items-stretch min-w-0">
              {/* 1段目: Area, Bedrooms, Monthly rent（モバイルは3列、md以上は3列+右にボタン） */}
              <div className="flex flex-row flex-1 min-w-0 divide-x divide-gray-100">
                <div className="flex-1 min-w-0 overflow-visible flex-shrink-0">
                  <AreaMultiSelect selectedAreas={selectedAreas} onChange={setSelectedAreas} areas={areaOptions} />
                </div>
                <div className="flex-1 min-w-0 overflow-visible flex-shrink-0">
                  <Dropdown
                    label={t('search.bedrooms.label')}
                    options={bedroomOptions}
                    value={bedroomCount}
                    onChange={setBedroomCount}
                    placeholder={t('search.budget.any')}
                  />
                </div>
                <div className="flex-1 min-w-0 overflow-visible flex-shrink-0">
                  <Dropdown
                    label={budgetLabel}
                    options={budgetOptions}
                    value={budget}
                    onChange={setBudget}
                    placeholder={t('search.budget.any_budget')}
                  />
                </div>
              </div>
              {/* Search ボタン: モバイルは2段目・全幅、md以上は1段目右端 */}
              <div className="flex-shrink-0 border-t md:border-t-0 md:border-l border-gray-100">
                <button
                  onClick={handleSearch}
                  className="w-full md:w-auto lg:px-8 px-4 py-3 md:py-3 lg:py-[18px] bg-[#C1121F] text-white font-semibold rounded-b-lg md:rounded-none md:rounded-r-xl hover:bg-[#A00F1A] transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group text-sm md:text-base"
                >
                  <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>{t('search.btn_short')}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Advanced Filters Toggle */}
        <div className="px-3 py-2 md:px-4 md:py-3 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600 hover:text-[#C1121F] transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
            <span>{t('search.advanced_filters')}</span>
            <ChevronDown 
              className={`w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-hidden border-t border-gray-100"
            >
              <div className="p-3 md:p-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                {/* Property Size (m²) — 広さの範囲を手動で指定 */}
                <div className="md:col-span-2">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                    {t('search.size.label')}
                  </label>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-[90px] md:min-w-[120px]">
                      <span className="text-xs md:text-sm text-gray-500 whitespace-nowrap">{t('search.size.from')}</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={propertySizeMin}
                        onChange={(e) => setPropertySizeMin(e.target.value)}
                        placeholder={t('search.size.placeholder_min')}
                        className="flex-1 min-w-0 px-2.5 py-2 md:px-4 md:py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C1121F]/20 focus:border-[#C1121F] transition-colors"
                      />
                      <span className="text-xs md:text-sm text-gray-500">m²</span>
                    </div>
                    <span className="text-gray-400 text-sm">–</span>
                    <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-[90px] md:min-w-[120px]">
                      <span className="text-xs md:text-sm text-gray-500 whitespace-nowrap">{t('search.size.to')}</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={propertySizeMax}
                        onChange={(e) => setPropertySizeMax(e.target.value)}
                        placeholder={t('search.size.placeholder_max')}
                        className="flex-1 min-w-0 px-2.5 py-2 md:px-4 md:py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C1121F]/20 focus:border-[#C1121F] transition-colors"
                      />
                      <span className="text-xs md:text-sm text-gray-500">m²</span>
                    </div>
                  </div>
                </div>

                {/* Categories Section */}
                <div className="md:col-span-2">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">
                    {t('filter.categories')}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    <label className="flex items-center gap-1.5 md:gap-2 p-2 md:p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={petFriendly}
                        onChange={(e) => setPetFriendly(e.target.checked)}
                        className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]"
                      />
                      <span className="text-xs md:text-sm font-medium text-gray-700">{t('category.pet_friendly')}</span>
                    </label>
                    <label className="flex items-center gap-1.5 md:gap-2 p-2 md:p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={foreignFriendly}
                        onChange={(e) => setForeignFriendly(e.target.checked)}
                        className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]"
                      />
                      <span className="text-xs md:text-sm font-medium text-gray-700">{t('category.foreign_friendly')}</span>
                    </label>
                    <label className="flex items-center gap-1.5 md:gap-2 p-2 md:p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={luxury}
                        onChange={(e) => setLuxury(e.target.checked)}
                        className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]"
                      />
                      <span className="text-xs md:text-sm font-medium text-gray-700">{t('category.luxury')}</span>
                    </label>
                    <label className="flex items-center gap-1.5 md:gap-2 p-2 md:p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={furnished}
                        onChange={(e) => setFurnished(e.target.checked)}
                        className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]"
                      />
                      <span className="text-xs md:text-sm font-medium text-gray-700">{t('category.furnished')}</span>
                    </label>
                    <label className="flex items-center gap-1.5 md:gap-2 p-2 md:p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={highRiseResidence}
                        onChange={(e) => setHighRiseResidence(e.target.checked)}
                        className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]"
                      />
                      <span className="text-xs md:text-sm font-medium text-gray-700">{t('category.high_rise')}</span>
                    </label>
                    <label className="flex items-center gap-1.5 md:gap-2 p-2 md:p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={noKeyMoney}
                        onChange={(e) => setNoKeyMoney(e.target.checked)}
                        className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]"
                      />
                      <span className="text-xs md:text-sm font-medium text-gray-700">{t('category.no_key_money')}</span>
                    </label>
                    <label className="flex items-center gap-1.5 md:gap-2 p-2 md:p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={forStudents}
                        onChange={(e) => setForStudents(e.target.checked)}
                        className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]"
                      />
                      <span className="text-xs md:text-sm font-medium text-gray-700">{t('category.students')}</span>
                    </label>
                    <label className="flex items-center gap-1.5 md:gap-2 p-2 md:p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={designers}
                        onChange={(e) => setDesigners(e.target.checked)}
                        className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]"
                      />
                      <span className="text-xs md:text-sm font-medium text-gray-700">{t('category.designers')}</span>
                    </label>
                    <label className="flex items-center gap-1.5 md:gap-2 p-2 md:p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={forFamilies}
                        onChange={(e) => setForFamilies(e.target.checked)}
                        className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F]"
                      />
                      <span className="text-xs md:text-sm font-medium text-gray-700">{t('category.families')}</span>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}