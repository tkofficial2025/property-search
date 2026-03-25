import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const SYSTEM_PROMPT = `あなたは不動産物件PDFを解析するAIです。PDFから以下のフィールドを抽出し、必ずJSONのみを返してください。前置きや説明は不要です。

重要: 以下のフィールドは必ず英語表記で返してください。
- title（物件名）: 日本語の物件名を英語に翻訳してください
- address（住所）: 日本語の住所を英語表記に変換してください（都道府県から）
- station（最寄り駅名）: 日本語の駅名を英語表記に変換してください

抽出フィールド（存在しない場合はnullを使用）:
- title: 物件名（英語表記、必須）
- address: 住所（英語表記、都道府県から、必須）
- price: 賃料（数値、円単位、管理費除く）
- management_fee: 管理費・共益費（数値、円単位）
- beds: 部屋数（数値）
- size: 専有面積（数値、㎡）
- layout: 間取り（例: 1LDK, 2LDK）
- station: 最寄り駅名（英語表記、必須）
- walking_minutes: 徒歩分数（数値）
- floor: 階数（整数のみ。地下の場合は負の整数、例: -1）
- type: "rent"または"buy"
- deposit: 敷金（数値、円単位、月数×賃料で計算。なしは0）
- key_money: 礼金（数値、円単位。なしは0）
- pet_friendly: ペット可（true/false）
- foreign_friendly: 外国人可（true/false）
- elevator: エレベーター有（true/false）
- delivery_box: 宅配ボックス有（true/false）
- balcony: バルコニー有（true/false）
- bicycle_parking: 駐輪場有（true/false）
- south_facing: 南向き（true/false）
- is_featured: false（デフォルト）
- is_new: true（デフォルト）
- category_no_key_money: 礼金なし（true/false）
- category_luxury: 高級物件か（true/false、賃料30万以上など）
- category_pet_friendly: ペット可カテゴリ（pet_friendlyと同じ）
- category_for_students: 学生向けか（true/false）
- category_for_families: ファミリー向けか（true/false）
- category_designers: デザイナーズか（true/false）
- category_high_rise_residence: タワーマンションか（true/false）
- property_information: 物件の特記事項・備考（文字列）

JSONのみ返すこと。`;

async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=jp`;
    const res = await fetch(url, { headers: { "User-Agent": "PropertyImporter/1.0" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) {
      return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let base64: string;
  let filename: string;
  try {
    const body = await req.json();
    base64 = body.base64;
    filename = body.filename ?? "property.pdf";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!base64) {
    return new Response(JSON.stringify({ error: "base64 is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: base64 },
              },
              { type: "text", text: `ファイル名: ${filename}\nこのPDFから物件情報を抽出してください。` },
            ],
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      throw new Error(`Anthropic API error: ${anthropicRes.status} ${errText}`);
    }

    const anthropicData = await anthropicRes.json();
    const text = (anthropicData.content ?? [])
      // deno-lint-ignore no-explicit-any
      .map((c: any) => (c.type === "text" ? c.text ?? "" : ""))
      .join("");
    const clean = text.replace(/```json|```/g, "").trim();
    // deno-lint-ignore no-explicit-any
    const parsed: Record<string, any> = JSON.parse(clean);

    if (parsed.address && (!parsed.latitude || !parsed.longitude)) {
      const geo = await geocodeAddress(parsed.address);
      if (geo) {
        parsed.latitude = geo.latitude;
        parsed.longitude = geo.longitude;
      }
    }

    const warnings: { level: "error" | "warn"; field: string; message: string }[] = [];

    if (!parsed.title)   warnings.push({ level: "error", field: "title",   message: "物件名が取得できませんでした" });
    if (!parsed.address) warnings.push({ level: "error", field: "address", message: "住所が取得できませんでした" });
    if (!parsed.price)   warnings.push({ level: "error", field: "price",   message: "賃料が取得できませんでした" });
    if (!parsed.layout)  warnings.push({ level: "warn",  field: "layout",  message: "間取りが取得できませんでした" });
    if (!parsed.station) warnings.push({ level: "warn",  field: "station", message: "最寄り駅が取得できませんでした" });
    if (!parsed.size)    warnings.push({ level: "warn",  field: "size",    message: "専有面積が取得できませんでした" });

    if (parsed.price) {
      if (parsed.type === "rent" && parsed.price < 10000)
        warnings.push({ level: "error", field: "price", message: `賃料が異常に低い: ¥${parsed.price.toLocaleString()}` });
      if (parsed.type === "rent" && parsed.price > 5000000)
        warnings.push({ level: "warn",  field: "price", message: `賃料が異常に高い: ¥${parsed.price.toLocaleString()}` });
    }
    if (parsed.size) {
      if (parsed.size < 6)    warnings.push({ level: "error", field: "size", message: `面積が異常に小さい: ${parsed.size}㎡` });
      if (parsed.size > 1000) warnings.push({ level: "warn",  field: "size", message: `面積が異常に大きい: ${parsed.size}㎡` });
    }
    if (parsed.walking_minutes && parsed.walking_minutes > 60)
      warnings.push({ level: "warn", field: "walking_minutes", message: `徒歩${parsed.walking_minutes}分は異常に遠い` });
    if (parsed.foreign_friendly === null || parsed.foreign_friendly === undefined)
      warnings.push({ level: "warn", field: "foreign_friendly", message: "外国人可否が不明" });
    if (!parsed.latitude || !parsed.longitude)
      warnings.push({ level: "warn", field: "address", message: "住所から緯度経度を取得できませんでした（地図に表示されません）" });

    return new Response(JSON.stringify({ data: parsed, warnings }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[analyze-pdf]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
