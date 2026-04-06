import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const SYSTEM_PROMPT = `あなたは日本の不動産物件の「備考・特記事項・その他記載」テキストから、構造化フィールドを抜き出すAIです。
入力は PDF ではなくプレーンテキストです。文中に明示がなければ null を返してください。
必ず JSON のみを返す（前置き・コードフェンス禁止）。

出力キー（すべて省略可だが、キー名はこのまま）:
- cap_rate: 利回り（数値、%。表面利回り・想定利回り・NOI利回り等、分かるもの）
- building_age: 築年数（数値・年）。「築25年」「平成10年築」等から換算してよい
- rights: 権利関係（短い日本語。例: 所有権、借地権、定期借地権）
- land_type: 地目（例: 宅地、田、畑、山林）
- zoning: 用途地域（例: 第一種住居地域）
- planning_area: 区域区分（例: 市街化区域、市街化調整区域）

JSON のみ。`;

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

  let text = "";
  try {
    const body = await req.json();
    text = typeof body.text === "string" ? body.text.trim() : "";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!text) {
    return new Response(JSON.stringify({ error: "text is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const clipped = text.length > 48_000 ? text.slice(0, 48_000) + "\n…(truncated)" : text;

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `以下のテキストからフィールドを抽出してください。\n\n---\n${clipped}\n---`,
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      throw new Error(`Anthropic API error: ${anthropicRes.status} ${errText}`);
    }

    const anthropicData = await anthropicRes.json();
    const outText = (anthropicData.content ?? [])
      // deno-lint-ignore no-explicit-any
      .map((c: any) => (c.type === "text" ? c.text ?? "" : ""))
      .join("");
    const clean = outText.replace(/```json|```/g, "").trim();
    // deno-lint-ignore no-explicit-any
    const parsed: Record<string, any> = JSON.parse(clean);

    const data = {
      cap_rate: parsed.cap_rate != null && parsed.cap_rate !== "" ? Number(parsed.cap_rate) : null,
      building_age: parsed.building_age != null && parsed.building_age !== "" ? Number(parsed.building_age) : null,
      rights: parsed.rights != null ? String(parsed.rights).trim() || null : null,
      land_type: parsed.land_type != null ? String(parsed.land_type).trim() || null : null,
      zoning: parsed.zoning != null ? String(parsed.zoning).trim() || null : null,
      planning_area: parsed.planning_area != null ? String(parsed.planning_area).trim() || null : null,
    };

    if (data.cap_rate != null && Number.isNaN(data.cap_rate)) data.cap_rate = null;
    if (data.building_age != null && Number.isNaN(data.building_age)) data.building_age = null;

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[extract-property-fields-from-text]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
