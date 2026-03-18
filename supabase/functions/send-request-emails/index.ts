// Room tour / 資料請求 / 無料相談が送信されたときに、客と管理者にメールを送る（Resend 使用）

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL_RAW = Deno.env.get('FROM_EMAIL')?.trim() || '';
// フォールバックはドキュメント用。本番では FROM_EMAIL を Resend でドメイン認証済みのアドレスに設定すること
const FROM_EMAIL = FROM_EMAIL_RAW || 'Tokyo Expat Housing <information@tkofficial.net>';
const OWNER_EMAIL = Deno.env.get('OWNER_EMAIL')?.trim() || '';

/** Resend の From 形式: "Display Name <email@domain.com>" または "email@domain.com" */
const FROM_EMAIL_REGEX = /^(.+\s+<)?[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(>)?$/;

function isValidFromEmail(value: string): boolean {
  return value.length > 0 && FROM_EMAIL_REGEX.test(value.replace(/\s/g, ' ').trim());
}

type TourPayload = {
  type: 'tour';
  userEmail: string;
  userName: string;
  propertyId: number;
  propertyTitle?: string;
  candidateDates?: { date: string; timeRange: string }[];
};

type InquiryPayload = {
  type: 'inquiry';
  email: string;
  name: string;
  propertyId: number;
  propertyTitle?: string;
};

type ConsultationPayload = {
  type: 'consultation';
  name: string;
  email: string;
  phone?: string;
  interest: 'rent' | 'buy';
  preferredDate?: string;
  preferOnlineMeeting?: boolean;
  message?: string;
};

type Payload = TourPayload | InquiryPayload | ConsultationPayload;

function isTour(p: Payload): p is TourPayload {
  return p.type === 'tour';
}
function isInquiry(p: Payload): p is InquiryPayload {
  return p.type === 'inquiry';
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
} as const;

function jsonResponse(body: object, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders },
  });
}

async function sendResend(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error('[send-request-emails] RESEND_API_KEY is not set');
    return { ok: false, error: 'Email service not configured' };
  }
  if (!isValidFromEmail(FROM_EMAIL)) {
    console.error('[send-request-emails] FROM_EMAIL is invalid or not set:', FROM_EMAIL ? '(set but invalid format)' : '(empty)');
    return { ok: false, error: 'Sender address not configured or invalid' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    const bodyText = await res.text();
    if (!res.ok) {
      let errDetail: string;
      try {
        const parsed = JSON.parse(bodyText) as { message?: string; name?: string };
        errDetail = parsed.message || parsed.name || bodyText || `HTTP ${res.status}`;
      } catch {
        errDetail = bodyText || `HTTP ${res.status}`;
      }
      console.error('[send-request-emails] Resend API error', {
        status: res.status,
        statusText: res.statusText,
        to: to.replace(/(?<=.).(?=.*@)/g, '*'),
        subject,
        detail: errDetail,
        body: bodyText.slice(0, 500),
      });
      return { ok: false, error: res.status === 422 ? errDetail : 'Email delivery failed' };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    console.error('[send-request-emails] Resend request failed', { to: to.replace(/(?<=.).(?=.*@)/g, '*'), subject, message, stack });
    return { ok: false, error: 'Email delivery failed' };
  }
}

serve(async (req) => {
  // Preflight: CORS を返し、キャッシュで効率化
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[send-request-emails] Invalid request body (JSON parse failed)', { message });
    return jsonResponse({ error: 'Invalid JSON', code: 'INVALID_JSON' }, 400);
  }

  if (!payload || typeof payload !== 'object' || !payload.type) {
    return jsonResponse({ error: 'Missing type or invalid payload', code: 'MISSING_TYPE' }, 400);
  }

  if (!FROM_EMAIL_RAW) {
    console.warn('[send-request-emails] FROM_EMAIL is not set; using default. Configure FROM_EMAIL in Edge Function secrets with a domain-verified address.');
  }
  if (!isValidFromEmail(FROM_EMAIL)) {
    console.error('[send-request-emails] FROM_EMAIL invalid:', FROM_EMAIL);
    return jsonResponse(
      { error: 'Sender address not configured. Set FROM_EMAIL to a domain-verified address in Resend.', code: 'FROM_NOT_CONFIGURED' },
      503
    );
  }

  const results: { to: string; ok: boolean; error?: string }[] = [];

  try {
    if (payload.type === 'consultation') {
      const { name, email, phone, interest, preferredDate, preferOnlineMeeting, message } = payload as ConsultationPayload;
      const interestLabel = interest === 'rent' ? 'Renting a property' : 'Buying a property';
      const meetingLabel = preferOnlineMeeting ? 'Online meeting preferred' : 'In-person or as discussed';
      const dateLine = preferredDate ? `<p><strong>Preferred date:</strong> ${preferredDate}</p>` : '';
      const messageLine = message?.trim() ? `<p><strong>Message:</strong></p><p>${String(message).replace(/\n/g, '<br/>')}</p>` : '';

      const customerHtml = `
      <p>Hello ${name || 'there'},</p>
      <p>Thank you for requesting a free consultation.</p>
      <p>We've received your details and a staff member will contact you within 24 hours to schedule your consultation.</p>
      <p>Best regards,<br/>Tokyo Expat Housing</p>
    `;
      const r1 = await sendResend(email, 'Free consultation request received – Tokyo Expat Housing', customerHtml);
      results.push({ to: email, ok: r1.ok, error: r1.error });

      if (OWNER_EMAIL) {
        const ownerHtml = `
        <p><strong>New free consultation request</strong></p>
        <p>Name: ${name || '—'}</p>
        <p>Email: ${email}</p>
        ${phone ? `<p>Phone: ${phone}</p>` : ''}
        <p>Interest: ${interestLabel}</p>
        ${dateLine}
        <p>Meeting: ${meetingLabel}</p>
        ${messageLine}
      `;
        const r2 = await sendResend(OWNER_EMAIL, `[Tokyo Expat Housing] Free consultation: ${name || email}`, ownerHtml);
        results.push({ to: OWNER_EMAIL, ok: r2.ok, error: r2.error });
      }
    } else if (isTour(payload)) {
      const { userEmail, userName, propertyTitle, propertyId, candidateDates } = payload;
      const title = propertyTitle || `Property #${propertyId}`;
      const datesList = candidateDates?.length
        ? candidateDates.map((c) => `${c.date} ${c.timeRange}`).join('<br/>')
        : 'Not specified';

      const customerHtml = `
      <p>Hello ${userName || 'there'},</p>
      <p>Thank you for requesting a room tour.</p>
      <p><strong>Property:</strong> ${title}</p>
      <p><strong>Preferred dates:</strong></p>
      <p>${datesList}</p>
      <p>A staff member will contact you within 24 hours to confirm your viewing.</p>
      <p>Best regards,<br/>Tokyo Expat Housing</p>
    `;
      const r1 = await sendResend(userEmail, 'Room tour request received – Tokyo Expat Housing', customerHtml);
      results.push({ to: userEmail, ok: r1.ok, error: r1.error });

      if (OWNER_EMAIL) {
        const ownerHtml = `
        <p><strong>New room tour request</strong></p>
        <p>Customer: ${userName || '—'} &lt;${userEmail}&gt;</p>
        <p>Property: ${title} (ID: ${propertyId})</p>
        <p>Preferred dates:</p>
        <p>${datesList}</p>
      `;
        const r2 = await sendResend(OWNER_EMAIL, `[Tokyo Expat Housing] Room tour request: ${title}`, ownerHtml);
        results.push({ to: OWNER_EMAIL, ok: r2.ok, error: r2.error });
      }
    } else if (isInquiry(payload)) {
      const { email, name, propertyTitle, propertyId } = payload;
      const title = propertyTitle || `Property #${propertyId}`;

      const customerHtml = `
      <p>Hello ${name || 'there'},</p>
      <p>Thank you for your request for property details.</p>
      <p><strong>Property:</strong> ${title}</p>
      <p>A staff member will contact you within 24 hours with availability and full details.</p>
      <p>Best regards,<br/>Tokyo Expat Housing</p>
    `;
      const r1 = await sendResend(email, 'Property details request received – Tokyo Expat Housing', customerHtml);
      results.push({ to: email, ok: r1.ok, error: r1.error });

      if (OWNER_EMAIL) {
        const ownerHtml = `
        <p><strong>New property details request</strong></p>
        <p>Customer: ${name || '—'} &lt;${email}&gt;</p>
        <p>Property: ${title} (ID: ${propertyId})</p>
      `;
        const r2 = await sendResend(OWNER_EMAIL, `[Tokyo Expat Housing] Details request: ${title}`, ownerHtml);
        results.push({ to: OWNER_EMAIL, ok: r2.ok, error: r2.error });
      }
    } else {
      return jsonResponse({ error: 'Unknown request type', code: 'UNKNOWN_TYPE' }, 400);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    console.error('[send-request-emails] Unhandled error', { type: payload?.type, message, stack });
    return jsonResponse(
      { error: 'An error occurred while sending emails', code: 'INTERNAL_ERROR', results },
      500
    );
  }

  const hasError = results.some((r) => !r.ok);
  const status = hasError ? 500 : 200;
  if (hasError) {
    const failed = results.filter((r) => !r.ok);
    console.error('[send-request-emails] One or more emails failed', { results: failed, type: payload.type });
  }

  return jsonResponse({ results }, status);
});
