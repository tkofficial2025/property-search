import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const SYSTEM_PROMPT = `あなたは不動産物件PDFを解析するAIです。PDFから以下のフィールドを抽出し、必ずJSONのみを返してください。前置きや説明は不要です。

抽出フィールド（存在しない場合はnullを使用）:
- title: 物件名（日本語のまま、必須）
- address: 住所（日本語のまま、都道府県から、必須）
- price: 売買価格または賃料（数値、円単位、管理費除く、必須）
- type: "rent"（賃貸）または"buy"（売買）
- station: 最寄り駅名（日本語のまま、必須）
- walking_minutes: 徒歩分数（数値）
- size: 専有面積または延床面積（数値、㎡）
- land_area: 土地面積（数値、㎡。なければnull）
- cap_rate: 利回り（数値、%。例: 5.5。なければnull）
- building_age: 築年数（数値。なければnull）
- rights: 権利関係（文字列。例: 所有権、借地権。なければnull）
- land_type: 地目（文字列。例: 宅地、山林。なければnull）
- zoning: 用途地域（文字列。例: 第一種住居地域。なければnull）
- planning_area: 区域区分（文字列。例: 市街化区域。なければnull）
- layout: 間取り（例: 1LDK, 2LDK）
- beds: 部屋数（数値）
- floor: 階数（整数のみ。地下の場合は負の整数）
- management_fee: 管理費・共益費（数値、円単位）
- deposit: 敷金（数値、円単位。なしは0）
- key_money: 礼金（数値、円単位。なしは0）
- initial_fees_credit_card: 初期費用クレジットカード払い可（true/false）
- pet_friendly: ペット可（true/false）
- foreign_friendly: 外国人可（true/false）
- elevator: エレベーター有（true/false）
- delivery_box: 宅配ボックス有（true/false）
- balcony: バルコニー有（true/false）
- bicycle_parking: 駐輪場有（true/false）
- south_facing: 南向き（true/false）
- is_featured: false（デフォルト）
- is_new: true（デフォルト）
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

/** クエリ ?filename=… を取得（URLSearchParams が % デコード済みなので decodeURIComponent は不要） */
function filenameFromQuery(req: Request): string {
  try {
    const raw = req.url;
    let params: URLSearchParams;
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      params = new URL(raw).searchParams;
    } else {
      const q = raw.includes("?") ? raw.slice(raw.indexOf("?") + 1) : "";
      params = new URLSearchParams(q);
    }
    return params.get("filename")?.trim() || "property.pdf";
  } catch {
    return "property.pdf";
  }
}

/** Edge 上で PDF バイナリ → base64（JSON で送るよりボディが小さく、読み取りエラーを減らす） */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  let binary = "";
  const step = 8192;
  for (let i = 0; i < bytes.length; i += step) {
    const end = Math.min(i + step, bytes.length);
    const slice = bytes.subarray(i, end);
    binary += String.fromCharCode.apply(null, Array.from(slice));
  }
  return btoa(binary);
}

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

  const contentType = (req.headers.get("content-type") ?? "").toLowerCase();

  if (contentType.includes("application/json")) {
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
  } else if (contentType.includes("application/octet-stream") || contentType.includes("application/pdf")) {
    const buf = await req.arrayBuffer();
    const bytes = new Uint8Array(buf);
    if (bytes.length === 0) {
      return new Response(JSON.stringify({ error: "空の PDF です" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    base64 = uint8ArrayToBase64(bytes);
    filename = filenameFromQuery(req);
  } else if (contentType.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await req.formData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return new Response(JSON.stringify({ error: `multipart の読み取りに失敗: ${msg}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const fileEntry = form.get("file");
    if (!fileEntry || typeof fileEntry === "string") {
      return new Response(JSON.stringify({ error: "file が必要です（multipart の file フィールド）" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const blob = fileEntry as Blob;
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    if (bytes.length === 0) {
      return new Response(JSON.stringify({ error: "空の PDF です" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    base64 = uint8ArrayToBase64(bytes);
    filename = fileEntry instanceof File ? fileEntry.name : "property.pdf";
  } else {
    return new Response(
      JSON.stringify({
        error:
          "Content-Type は application/json（base64）・application/octet-stream（生PDF）・multipart/form-data のいずれかにしてください",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
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
