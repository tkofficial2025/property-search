import { supabase } from '@/lib/supabase';

/** `property-pdfs` バケット内パスから公開ダウンロード URL を返す */
export function getPropertyPdfPublicUrl(storagePath: string): string {
  const { data } = supabase.storage.from('property-pdfs').getPublicUrl(storagePath);
  return data.publicUrl;
}
