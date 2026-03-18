import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './supabase-config';

// supabase-config が .env の VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY を参照
const url = supabaseUrl.trim();
const key = supabaseAnonKey.trim();
const envMissing = !url || !key;
const source = url ? '.env (VITE_SUPABASE_*)' : 'なし';
if (import.meta.env.DEV) {
  console.log('[Supabase] 読み込み', { あり: !envMissing, 参照: source });
}
if (envMissing) {
  console.warn(
    'Supabase の設定がありません。.env に VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください。（.env.example をコピーして .env を作成）'
  );
}

/** 環境変数がないとき用のダミー（アプリは落ちず、空データになる） */
const dummySupabase = {
  from: () => ({
    select: () => ({
      eq: () =>
        Promise.resolve({
          data: [],
          error: { message: 'Supabase の設定が未設定です。.env に VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY を設定してください。' },
        }),
    }),
  }),
};

export const supabase = envMissing
  ? (dummySupabase as unknown as ReturnType<typeof createClient>)
  : createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'tokyo-expat-housing-auth',
      },
    });
