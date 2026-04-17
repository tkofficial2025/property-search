/** 1億円（円建て） */
export const JPY_OKU = 100_000_000;
/** 1万円 */
export const JPY_MAN = 10_000;

/**
 * 億・万の係数を最大小数第2位まで（切り捨て）で整形
 */
export function formatOkuManCoefficient(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  const t = Math.floor(value * 100) / 100;
  return t.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * 日本円の価格表示を統一する。
 * - 1億円以上: 億単位（例: ¥1億、¥1.2億）
 * - 1億円未満かつ1万円以上: 万単位（例: ¥5000万）
 * - 1万円未満: カンマ区切り円（例: ¥8,500）
 *
 * 賃貸は末尾に `/月` を付ける。
 */
export function formatJpyPriceDisplay(priceYen: number, type: 'rent' | 'buy'): string {
  const yen = Number(priceYen);
  const month = type === 'rent' ? '/月' : '';
  if (!Number.isFinite(yen) || yen <= 0) {
    return type === 'rent' ? '¥0/月' : '¥0';
  }
  if (yen >= JPY_OKU) {
    return `¥${formatOkuManCoefficient(yen / JPY_OKU)}億${month}`;
  }
  if (yen >= JPY_MAN) {
    return `¥${formatOkuManCoefficient(yen / JPY_MAN)}万${month}`;
  }
  return `¥${Math.round(yen).toLocaleString('ja-JP')}${month}`;
}
