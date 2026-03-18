import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Search } from 'lucide-react';
import { getAllRailwayLines, type LineInfo } from '@/lib/stationLines';
import { StationLineLogo } from '@/app/components/StationLineLogo';

interface RailwayLineSelectProps {
  /** 選択された路線コード */
  value?: string;
  /** 値が変更されたときのコールバック */
  onChange?: (lineCode: string) => void;
  /** ラベル */
  label?: string;
  /** 必須かどうか */
  required?: boolean;
  /** クラス名 */
  className?: string;
}

/**
 * 沿線（路線）を選択するドロップダウンコンポーネント
 */
export function RailwayLineSelect({
  value,
  onChange,
  label = 'Railway Line',
  required = false,
  className = '',
}: RailwayLineSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const allLines = getAllRailwayLines();
  
  const selectedLine = value ? allLines.find(line => line.lineCode === value) : null;

  // 検索フィルタリング
  const filteredLines = searchQuery.trim()
    ? allLines.filter(line =>
        line.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        line.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        line.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allLines;

  // 会社ごとにグループ化
  const groupedLines = filteredLines.reduce((acc, line) => {
    if (!acc[line.company]) {
      acc[line.company] = [];
    }
    acc[line.company].push(line);
    return acc;
  }, {} as Record<string, LineInfo[]>);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (lineCode: string) => {
    onChange?.(lineCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C1121F]/20 focus:border-[#C1121F] transition-colors ${
          isOpen ? 'border-[#C1121F]' : ''
        }`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedLine ? (
            <>
              <StationLineLogo 
                lineCode={selectedLine.lineCode}
                size={20} 
                className="flex-shrink-0"
              />
              <span className="text-sm font-medium text-gray-900 truncate">
                {selectedLine.name}
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-500">Select railway line...</span>
          )}
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col max-h-96"
            role="listbox"
          >
            {/* 検索バー */}
            <div className="flex-shrink-0 p-2 border-b border-gray-100">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search line..."
                  className="flex-1 min-w-0 py-1 bg-transparent border-0 text-sm focus:ring-0 focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* 路線リスト */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-1 overscroll-contain">
              {Object.entries(groupedLines).map(([company, lines]) => (
                <div key={company} className="mb-1">
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {company}
                  </div>
                  {lines.map((line) => (
                    <button
                      key={line.lineCode}
                      type="button"
                      role="option"
                      aria-selected={value === line.lineCode}
                      onClick={() => handleSelect(line.lineCode)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                        value === line.lineCode
                          ? 'bg-[#C1121F]/5 text-[#C1121F] font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      <StationLineLogo 
                        lineCode={line.lineCode}
                        size={18} 
                        className="flex-shrink-0"
                      />
                      <span className="flex-1">{line.name}</span>
                      <span className="text-xs text-gray-400">{line.abbreviation}</span>
                    </button>
                  ))}
                </div>
              ))}
              {filteredLines.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No lines found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
