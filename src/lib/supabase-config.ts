/**
 * Supabase の接続情報（.env から読み取り）
 *
 * 設定方法:
 * 1. ルートに .env を作成し、.env.example を参考に VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY を設定
 * 2. 取得: Supabase ダッシュボード → Project Settings → API
 *    - Project URL → VITE_SUPABASE_URL
 *    - anon public → VITE_SUPABASE_ANON_KEY
 */
export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string)?.trim() ?? '';
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string)?.trim() ?? '';
