import { useState } from 'react';
import { getStationLines, getLineInfoByCode, type LineInfo } from '@/lib/stationLines';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface StationLineLogoProps {
  /** 駅名（路線コードが指定されていない場合に使用） */
  stationName?: string;
  /** 路線コード（直接指定する場合） */
  lineCode?: string;
  /** ロゴのサイズ（px） */
  size?: number;
  /** 最大表示数（複数路線がある場合） */
  maxLines?: number;
  /** クラス名 */
  className?: string;
}

/**
 * 駅の路線ロゴを表示するコンポーネント
 * 公式ロゴ画像を使用し、画像が存在しない場合はフォールバック表示
 */
export function StationLineLogo({ 
  stationName,
  lineCode,
  size = 20, 
  maxLines = 2,
  className = '' 
}: StationLineLogoProps) {
  // 路線コードが指定されている場合はそれを使用、そうでなければ駅名から判定
  const allLines: LineInfo[] = lineCode
    ? (() => {
        const line = getLineInfoByCode(lineCode);
        return line ? [line] : [];
      })()
    : stationName
    ? getStationLines(stationName)
    : [];
  
  // 表示する路線（優先順位の高いものから最大maxLines個）
  const displayLines = allLines.slice(0, maxLines);
  const remainingCount = allLines.length - displayLines.length;
  
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  if (displayLines.length === 0) {
    return null;
  }

  const handleImageError = (logoPath: string) => {
    setImageErrors((prev) => new Set(prev).add(logoPath));
  };

  // 全路線名をツールチップ用に取得
  const allLineNames = allLines.map(line => line.name).join(', ');

  return (
    <div className={`flex items-center gap-1 ${className}`} title={allLines.length > maxLines ? `${allLineNames} (他${remainingCount}路線)` : allLineNames}>
      {displayLines.map((line, index) => {
        const hasError = imageErrors.has(line.logoPath);
        const useColorIcon = !line.logoPath || hasError; // ロゴパスが空またはエラーの場合は色付きアイコン
        
        return (
          <div
            key={`${line.name}-${index}`}
            className="flex-shrink-0"
            title={line.name}
          >
            {useColorIcon ? (
              // station-logosにない路線は公式の色とイニシャルで独自ロゴを生成
              <div
                className="rounded-full flex items-center justify-center text-white font-bold shadow-md"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: line.color,
                  fontSize: `${Math.max(size * 0.45, 8)}px`,
                  minWidth: `${size}px`,
                  minHeight: `${size}px`,
                  boxShadow: `0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
                }}
                title={line.name}
              >
                {line.abbreviation}
              </div>
            ) : (
              // 公式ロゴ画像を表示（東京メトロ、都営地下鉄など）
              <ImageWithFallback
                src={line.logoPath}
                alt={line.name}
                className="object-contain"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                }}
                onError={() => handleImageError(line.logoPath)}
              />
            )}
          </div>
        );
      })}
      {/* 残りの路線数を表示 */}
      {remainingCount > 0 && (
        <div
          className="flex-shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gray-500"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            fontSize: `${size * 0.4}px`,
          }}
          title={`他${remainingCount}路線: ${allLines.slice(maxLines).map(l => l.name).join(', ')}`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
