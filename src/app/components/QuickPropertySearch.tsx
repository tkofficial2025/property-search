import React, { useMemo, useRef, useState, useEffect, type RefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import type { HeroSearchParams } from '@/lib/searchFilters';
import { WARD_NAMES } from '@/lib/wards';

interface Option {
  value: string;
  label: string;
}

const quickCategories: Option[] = [
  { value: 'bldg', label: 'ビル・マンション一棟' },
  { value: 'room', label: 'マンション一室・フロア' },
  { value: 'hotel', label: 'ホテル・旅館' },
  { value: 'land', label: '土地・事業用地' },
  { value: 'apartment', label: '収益アパート' },
  { value: 'golf', label: 'ゴルフ場' },
  { value: 'medical', label: '病院・医療施設' },
];

const quickRegions: Option[] = [
  { value: 'tokyo23', label: '東京23区' },
  { value: 'tokyo-other', label: '東京23区外' },
  { value: 'osaka', label: '大阪' },
  { value: 'kyoto', label: '京都' },
  { value: 'domestic-other', label: 'その他国内' },
  { value: 'overseas', label: '海外' },
];

const wardLabelMap: Record<string, string> = {
  Chiyoda: '千代田区', Chuo: '中央区', Minato: '港区', Shinjuku: '新宿区', Bunkyo: '文京区',
  Taito: '台東区', Sumida: '墨田区', Koto: '江東区', Shinagawa: '品川区', Meguro: '目黒区',
  Ota: '大田区', Setagaya: '世田谷区', Shibuya: '渋谷区', Nakano: '中野区', Suginami: '杉並区',
  Toshima: '豊島区', Kita: '北区', Arakawa: '荒川区', Itabashi: '板橋区', Nerima: '練馬区',
  Adachi: '足立区', Katsushika: '葛飾区', Edogawa: '江戸川区',
};

const tokyo23WardOptions: Option[] = WARD_NAMES.map((name) => ({
  value: name,
  label: wardLabelMap[name] ?? name,
}));

const priceBands: Option[] = [
  { value: 'up-to-10', label: '〜10億' },
  { value: '10-50', label: '10〜50億' },
  { value: '50-100', label: '50〜100億' },
  { value: '100-plus', label: '100億以上' },
  { value: 'negotiable', label: '価格応相談' },
];

const updatedOptions: Option[] = [
  { value: '1w', label: '1週間以内' },
  { value: '1m', label: '1ヶ月以内' },
  { value: '3m', label: '3ヶ月以内' },
  { value: 'all', label: '全期間' },
];

const capRateOptions: Option[] = [
  { value: 'up-to-5', label: '〜5%' },
  { value: '5-7', label: '5〜7%' },
  { value: '7-10', label: '7〜10%' },
  { value: '10-plus', label: '10%以上' },
  { value: 'none', label: '利回り情報なし' },
];

const buildingAgeOptions: Option[] = [
  { value: 'new-5', label: '新築・築5年以内' },
  { value: '6-10', label: '築6〜10年' },
  { value: '11-20', label: '築11〜20年' },
  { value: '21-30', label: '築21〜30年' },
  { value: '31-plus', label: '築31年以上' },
  { value: 'no-building', label: '建物なし（土地のみ）' },
  { value: 'unknown', label: '築年不明' },
];

const rightsOptions: Option[] = [
  { value: 'full-ownership', label: '所有権（完全所有）' },
  { value: 'leasehold', label: '借地権（地上権・賃借権）' },
  { value: 'bare-land', label: '底地（借地人あり）' },
  { value: 'condo-ownership', label: '区分所有' },
  { value: 'shared', label: '共有持分' },
];

const landTypeOptions: Option[] = [
  { value: 'residential', label: '宅地' },
  { value: 'farm', label: '田・畑（農地転用要）' },
  { value: 'forest', label: '山林・原野' },
  { value: 'misc', label: '雑種地' },
  { value: 'other', label: 'その他' },
];

const zoningOptions: Option[] = [
  { value: 'residential-low', label: '第一種低層住居専用地域' },
  { value: 'residential-mid', label: '第一種中高層住居専用地域' },
  { value: 'residential-1', label: '第一種住居地域' },
  { value: 'semi-residential', label: '準住居地域' },
  { value: 'neighborhood-commercial', label: '近隣商業地域' },
  { value: 'commercial', label: '商業地域' },
  { value: 'semi-industrial', label: '準工業地域' },
  { value: 'industrial', label: '工業地域' },
  { value: 'industrial-exclusive', label: '工業専用地域' },
  { value: 'unspecified', label: '未指定' },
];

const planningOptions: Option[] = [
  { value: 'urbanized', label: '市街化区域' },
  { value: 'urbanization-control', label: '市街化調整区域' },
  { value: 'non-zoned', label: '非線引き区域' },
];

const stationDistanceOptions: Option[] = [
  { value: '1m', label: '徒歩1分以内' },
  { value: '5m', label: '徒歩5分以内' },
  { value: '10m', label: '徒歩10分以内' },
  { value: 'bus', label: 'バス利用' },
  { value: 'any', label: '指定なし' },
];

function useOutsideClose(ref: RefObject<HTMLDivElement | null>, onClose: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, onClose]);
}

function MultiSelect({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: Option[];
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  useOutsideClose(ref, () => setOpen(false));
  const labelWithCount = values.length > 0 ? `${label} (${values.length})` : label;
  const selectedText =
    values.length === 0
      ? '指定なし'
      : options
          .filter((o) => values.includes(o.value))
          .map((o) => o.label)
          .join(', ');

  return (
    <div className="relative" ref={ref}>
      <label className="block">
        <span className="mb-1 block text-xs text-gray-600">{labelWithCount}</span>
        <button type="button" onClick={() => setOpen((v) => !v)} className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-sm flex items-center justify-between">
          <span className="truncate">{selectedText}</span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </label>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute z-[120] mt-2 w-full max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg p-2">
            {options.map((opt) => {
              const checked = values.includes(opt.value);
              return (
                <label key={opt.value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (checked) onChange(values.filter((v) => v !== opt.value));
                      else onChange([...values, opt.value]);
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SingleSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-gray-600">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-sm">
        <option value="">指定なし</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

interface QuickPropertySearchProps {
  onSearch?: (params: HeroSearchParams) => void;
  initialParams?: HeroSearchParams;
}

export function QuickPropertySearch({ onSearch, initialParams }: QuickPropertySearchProps = {}) {
  const [keyword, setKeyword] = useState('');
  const [propertyCategories, setPropertyCategories] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [priceBand, setPriceBand] = useState('');
  const [selectedTokyoWards, setSelectedTokyoWards] = useState<string[]>([]);
  const [updatedWithin, setUpdatedWithin] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [capRate, setCapRate] = useState('');
  const [buildingAge, setBuildingAge] = useState('');
  const [rights, setRights] = useState<string[]>([]);
  const [landTypes, setLandTypes] = useState<string[]>([]);
  const [zoningTypes, setZoningTypes] = useState<string[]>([]);
  const [planningAreas, setPlanningAreas] = useState<string[]>([]);
  const [stationDistance, setStationDistance] = useState('');
  const [buildingUnit, setBuildingUnit] = useState<'sqm' | 'tsubo'>('sqm');
  const [landUnit, setLandUnit] = useState<'sqm' | 'tsubo'>('sqm');
  const [buildingAreaMin, setBuildingAreaMin] = useState('');
  const [buildingAreaMax, setBuildingAreaMax] = useState('');
  const [landAreaMin, setLandAreaMin] = useState('');
  const [landAreaMax, setLandAreaMax] = useState('');

  useEffect(() => {
    if (!initialParams || initialParams.propertyType !== 'buy') return;
    setKeyword(initialParams.keyword ?? '');
    setPropertyCategories(initialParams.propertyCategories ?? []);
    setRegions(initialParams.regions ?? []);
    setPriceBand(initialParams.priceBand ?? '');
    setSelectedTokyoWards(initialParams.selectedAreas ?? []);
    setUpdatedWithin(initialParams.updatedWithin ?? '');
    setCapRate(initialParams.capRate ?? '');
    setBuildingAge(initialParams.buildingAge ?? '');
    setRights(initialParams.rights ?? []);
    setLandTypes(initialParams.landTypes ?? []);
    setZoningTypes(initialParams.zoningTypes ?? []);
    setPlanningAreas(initialParams.planningAreas ?? []);
    setStationDistance(initialParams.stationDistance ?? '');
    setBuildingUnit(initialParams.buildingAreaUnit ?? 'sqm');
    setLandUnit(initialParams.landAreaUnit ?? 'sqm');
    setBuildingAreaMin(initialParams.buildingAreaMin != null ? String(initialParams.buildingAreaMin) : '');
    setBuildingAreaMax(initialParams.buildingAreaMax != null ? String(initialParams.buildingAreaMax) : '');
    setLandAreaMin(initialParams.landAreaMin != null ? String(initialParams.landAreaMin) : '');
    setLandAreaMax(initialParams.landAreaMax != null ? String(initialParams.landAreaMax) : '');
  }, [initialParams]);

  const labelMap = useMemo(() => {
    const all = [
      ...quickCategories, ...quickRegions, ...priceBands, ...updatedOptions,
      ...capRateOptions, ...buildingAgeOptions, ...rightsOptions, ...landTypeOptions,
      ...zoningOptions, ...planningOptions, ...stationDistanceOptions, ...tokyo23WardOptions,
    ];
    return new Map(all.map((o) => [o.value, o.label]));
  }, []);

  useEffect(() => {
    if (!regions.includes('tokyo23') && selectedTokyoWards.length > 0) {
      setSelectedTokyoWards([]);
    }
  }, [regions, selectedTokyoWards.length]);

  const params: HeroSearchParams = {
    propertyType: 'buy',
    selectedAreas: selectedTokyoWards,
    propertyCategories,
    regions,
    priceBand: priceBand || undefined,
    keyword: keyword.trim() || undefined,
    updatedWithin: updatedWithin || undefined,
    capRate: capRate || undefined,
    buildingAge: buildingAge || undefined,
    rights,
    landTypes,
    zoningTypes,
    planningAreas,
    stationDistance: stationDistance || undefined,
    buildingAreaMin: buildingAreaMin ? Number(buildingAreaMin) : undefined,
    buildingAreaMax: buildingAreaMax ? Number(buildingAreaMax) : undefined,
    buildingAreaUnit: buildingUnit,
    landAreaMin: landAreaMin ? Number(landAreaMin) : undefined,
    landAreaMax: landAreaMax ? Number(landAreaMax) : undefined,
    landAreaUnit: landUnit,
  };

  const tags = [
    ...propertyCategories,
    ...regions,
    ...selectedTokyoWards,
    ...(priceBand ? [priceBand] : []),
    ...(updatedWithin ? [updatedWithin] : []),
    ...(capRate ? [capRate] : []),
    ...(buildingAge ? [buildingAge] : []),
    ...rights,
    ...landTypes,
    ...zoningTypes,
    ...planningAreas,
    ...(stationDistance ? [stationDistance] : []),
  ];

  const removeTag = (value: string) => {
    setPropertyCategories((prev) => prev.filter((v) => v !== value));
    setRegions((prev) => prev.filter((v) => v !== value));
    if (priceBand === value) setPriceBand('');
    if (updatedWithin === value) setUpdatedWithin('');
    if (capRate === value) setCapRate('');
    if (buildingAge === value) setBuildingAge('');
    setRights((prev) => prev.filter((v) => v !== value));
    setLandTypes((prev) => prev.filter((v) => v !== value));
    setZoningTypes((prev) => prev.filter((v) => v !== value));
    setPlanningAreas((prev) => prev.filter((v) => v !== value));
    setSelectedTokyoWards((prev) => prev.filter((v) => v !== value));
    if (stationDistance === value) setStationDistance('');
  };

  const resetAll = () => {
    setKeyword('');
    setPropertyCategories([]);
    setRegions([]);
    setPriceBand('');
    setSelectedTokyoWards([]);
    setUpdatedWithin('');
    setCapRate('');
    setBuildingAge('');
    setRights([]);
    setLandTypes([]);
    setZoningTypes([]);
    setPlanningAreas([]);
    setStationDistance('');
    setBuildingAreaMin('');
    setBuildingAreaMax('');
    setLandAreaMin('');
    setLandAreaMax('');
    setBuildingUnit('sqm');
    setLandUnit('sqm');
    onSearch?.({ propertyType: 'buy', selectedAreas: [] });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-6xl mx-auto">
      <div className="bg-white/95 rounded-xl border border-gray-100 shadow-lg p-3 md:p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-1">
          <label className="block">
            <span className="mb-1 block text-xs text-gray-600">検索</span>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="タイトル・住所・駅・備考で検索"
              className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-sm"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100">
              {labelMap.get(tag) ?? tag}
              <button type="button" onClick={() => removeTag(tag)} className="text-gray-500 hover:text-gray-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {keyword.trim() && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100">
              検索: {keyword.trim()}
              <button type="button" onClick={() => setKeyword('')} className="text-gray-500 hover:text-gray-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(tags.length > 0 || keyword.trim()) && (
            <button type="button" onClick={resetAll} className="text-xs text-[#C1121F] hover:underline">条件をリセット</button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <MultiSelect label="物件種別" options={quickCategories} values={propertyCategories} onChange={setPropertyCategories} />
          <MultiSelect label="エリア" options={quickRegions} values={regions} onChange={setRegions} />
          <SingleSelect label="価格帯" options={priceBands} value={priceBand} onChange={setPriceBand} />
          <SingleSelect label="更新日時" options={updatedOptions} value={updatedWithin} onChange={setUpdatedWithin} />
        </div>
        {regions.includes('tokyo23') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <MultiSelect
              label="東京23区（区を選択）"
              options={tokyo23WardOptions}
              values={selectedTokyoWards}
              onChange={setSelectedTokyoWards}
            />
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <button type="button" onClick={() => setShowAdvanced((v) => !v)} className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-[#C1121F]">
            <SlidersHorizontal className="w-4 h-4" />
            <span>詳細条件を表示</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
          <button type="button" onClick={() => onSearch?.(params)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C1121F] text-white text-sm font-semibold hover:bg-[#A00F1A]">
            <Search className="w-4 h-4" />
            検索
          </button>
        </div>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-100 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SingleSelect label="利回り" options={capRateOptions} value={capRate} onChange={setCapRate} />
                <SingleSelect label="築年数" options={buildingAgeOptions} value={buildingAge} onChange={setBuildingAge} />
                <MultiSelect label="権利関係" options={rightsOptions} values={rights} onChange={setRights} />
                <MultiSelect label="地目" options={landTypeOptions} values={landTypes} onChange={setLandTypes} />
                <MultiSelect label="用途地域" options={zoningOptions} values={zoningTypes} onChange={setZoningTypes} />
                <MultiSelect label="区域区分" options={planningOptions} values={planningAreas} onChange={setPlanningAreas} />
                <SingleSelect label="駅距離" options={stationDistanceOptions} value={stationDistance} onChange={setStationDistance} />
                <div className="text-xs text-gray-500 self-end">複数選択は「項目名 (件数)」で表示されます。</div>

                <div className="space-y-2">
                  <label className="block text-xs text-gray-600">延床面積</label>
                  <div className="flex gap-2">
                    <input value={buildingAreaMin} onChange={(e) => setBuildingAreaMin(e.target.value)} type="number" placeholder="最小" className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm" />
                    <input value={buildingAreaMax} onChange={(e) => setBuildingAreaMax(e.target.value)} type="number" placeholder="最大" className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm" />
                    <select value={buildingUnit} onChange={(e) => setBuildingUnit(e.target.value as 'sqm' | 'tsubo')} className="h-10 px-2 rounded-lg border border-gray-200 text-sm">
                      <option value="sqm">㎡</option>
                      <option value="tsubo">坪</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs text-gray-600">土地面積</label>
                  <div className="flex gap-2">
                    <input value={landAreaMin} onChange={(e) => setLandAreaMin(e.target.value)} type="number" placeholder="最小" className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm" />
                    <input value={landAreaMax} onChange={(e) => setLandAreaMax(e.target.value)} type="number" placeholder="最大" className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm" />
                    <select value={landUnit} onChange={(e) => setLandUnit(e.target.value as 'sqm' | 'tsubo')} className="h-10 px-2 rounded-lg border border-gray-200 text-sm">
                      <option value="sqm">㎡</option>
                      <option value="tsubo">坪</option>
                    </select>
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