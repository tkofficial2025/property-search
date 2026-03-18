import { supabase } from './supabase';
import { type Property, type SupabasePropertyRow, mapSupabaseRowToProperty } from './properties';

/**
 * Full Text Searchを使用して物件を検索
 * @param query 検索クエリ（キーワード）
 * @param propertyType 物件タイプ（'rent' | 'buy' | null）
 * @param limit 取得件数の上限（デフォルト: 100）
 * @returns 検索結果の物件配列
 */
export async function searchProperties(
  query: string,
  propertyType: 'rent' | 'buy' | null = null,
  limit: number = 100
): Promise<Property[]> {
  if (!query || query.trim() === '') {
    // クエリが空の場合は通常のクエリを実行
    let supabaseQuery = supabase.from('properties').select('*');
    
    if (propertyType) {
      supabaseQuery = supabaseQuery.eq('type', propertyType);
    }
    
    const { data, error } = await supabaseQuery.limit(limit);
    
    if (error) {
      console.error('Search error:', error);
      return [];
    }
    
    return (data ?? []).map((row) => mapSupabaseRowToProperty(row as SupabasePropertyRow));
  }

  // Full Text Searchを使用（RPC関数経由）
  // plainto_tsqueryを使用して、複数のキーワードをAND検索
  const searchQuery = query.trim();
  
  try {
    const { data, error } = await supabase.rpc('search_properties', {
      search_query: searchQuery,
      property_type_filter: propertyType,
      result_limit: limit
    });

    if (error) {
      console.error('Full text search error:', error);
      // エラーが発生した場合は、通常のLIKE検索にフォールバック
      return fallbackSearch(query, propertyType, limit);
    }

    return (data ?? []).map((row) => mapSupabaseRowToProperty(row as SupabasePropertyRow));
  } catch (error) {
    console.error('Full text search exception:', error);
    // 例外が発生した場合は、通常のLIKE検索にフォールバック
    return fallbackSearch(query, propertyType, limit);
  }
}

/**
 * Full Text Searchが利用できない場合のフォールバック検索（LIKE検索）
 */
async function fallbackSearch(
  query: string,
  propertyType: 'rent' | 'buy' | null = null,
  limit: number = 100
): Promise<Property[]> {
  const searchPattern = `%${query.trim()}%`;
  
  let supabaseQuery = supabase
    .from('properties')
    .select('*')
    .or(`title.ilike.${searchPattern},address.ilike.${searchPattern},station.ilike.${searchPattern},layout.ilike.${searchPattern}`)
    .limit(limit);

  if (propertyType) {
    supabaseQuery = supabaseQuery.eq('type', propertyType);
  }

  const { data, error } = await supabaseQuery;

  if (error) {
    console.error('Fallback search error:', error);
    return [];
  }

  return (data ?? []).map((row) => mapSupabaseRowToProperty(row as SupabasePropertyRow));
}
