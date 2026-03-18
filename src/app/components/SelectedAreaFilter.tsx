import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { AREA_OPTIONS } from '@/lib/wards';
import { useLanguage } from '@/app/contexts/LanguageContext';

const AREA_PANEL_MAX_HEIGHT = 380;

export interface SelectedAreaFilterProps {
  selectedAreas: Set<string>;
  onChange: (selected: Set<string>) => void;
  label?: string;
  /** フィルターバー用: 高さ・角を他項目と統一 */
  compact?: boolean;
}

export function SelectedAreaFilter({
  selectedAreas,
  onChange,
  label,
  compact = false,
}: SelectedAreaFilterProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [areaSearch, setAreaSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const displayLabel = label ?? t('filter.selected_area');

  const translatedOptions = useMemo(
    () => AREA_OPTIONS.map((opt) => ({ value: opt.value, label: t('ward.' + opt.value) })),
    [t]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) setAreaSearch('');
  }, [open]);

  const toggle = (value: string) => {
    const next = new Set(selectedAreas);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  };

  const searchLower = areaSearch.trim().toLowerCase();
  const filteredOptions = searchLower
    ? translatedOptions.filter((opt) => opt.label.toLowerCase().includes(searchLower))
    : translatedOptions;

  const count = selectedAreas.size;
  const buttonLabel = count > 0 ? `${displayLabel} (${count})` : displayLabel;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all w-full ${
          compact ? 'rounded-lg min-h-[40px] h-[40px]' : 'rounded-full px-4'
        } ${
          count > 0
            ? 'bg-gray-900 text-white hover:bg-gray-800'
            : 'bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100 text-gray-700'
        }`}
      >
        <span className="flex-1 text-left truncate">{buttonLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-full max-w-[280px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 flex flex-col overflow-hidden"
          style={{ maxHeight: AREA_PANEL_MAX_HEIGHT }}
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
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">{t('search.area.no_match')}</div>
            ) : (
              filteredOptions.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedAreas.has(opt.value)}
                    onChange={() => toggle(opt.value)}
                    className="w-4 h-4 rounded border-gray-300 text-[#C1121F] focus:ring-[#C1121F]"
                  />
                  <span>{opt.label}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
