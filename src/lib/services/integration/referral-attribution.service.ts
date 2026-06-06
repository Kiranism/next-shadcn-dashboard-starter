/**
 * @file: referral-attribution.service.ts
 * @description: Извлечение utm_ref / utm_org из webhook Tilda и raw payload
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

export interface ExtractedReferralAttribution {
  utmRef: string | null;
  utmOrg: string | null;
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function parseFromCookieString(
  cookies: string | undefined
): ExtractedReferralAttribution {
  if (!cookies || typeof cookies !== 'string') {
    return { utmRef: null, utmOrg: null };
  }

  let utmRef: string | null = null;
  let utmOrg: string | null = null;

  for (const part of cookies.split(';')) {
    const [rawKey, ...rest] = part.split('=');
    const key = rawKey?.trim();
    const val = rest.join('=').trim();
    if (!key || !val) continue;
    try {
      const decoded = decodeURIComponent(val);
      if (key === 'gupil_utm_ref') utmRef = decoded;
      if (key === 'gupil_utm_org') utmOrg = decoded;
    } catch {
      if (key === 'gupil_utm_ref') utmRef = val;
      if (key === 'gupil_utm_org') utmOrg = val;
    }
  }

  return { utmRef, utmOrg };
}

/**
 * Унифицированное извлечение реф-меток из тела webhook (JSON / form / Tilda).
 */
export function extractReferralFromWebhookBody(
  raw: Record<string, unknown> | null | undefined
): ExtractedReferralAttribution {
  if (!raw || typeof raw !== 'object') {
    return { utmRef: null, utmOrg: null };
  }

  const fromCookies = parseFromCookieString(
    pickString(raw.COOKIES, raw.cookies, raw.Cookies) ?? undefined
  );

  const utmRef =
    pickString(
      raw.utm_ref,
      raw.utmRef,
      raw.Utm_ref,
      raw['utm-ref'],
      raw.utm_source
    ) ?? fromCookies.utmRef;

  const utmOrg =
    pickString(raw.utm_org, raw.utmOrg, raw.Utm_org, raw['utm-org']) ??
    fromCookies.utmOrg;

  return { utmRef, utmOrg };
}

export function isSignupOnlyPayload(raw: Record<string, unknown>): boolean {
  const payment = raw.payment;
  const hasPayment =
    payment &&
    typeof payment === 'object' &&
    Object.keys(payment as object).length > 0;
  const amount = pickString(
    (raw.payment as Record<string, unknown> | undefined)?.amount,
    raw.amount
  );
  const hasAmount = amount !== null && Number(amount) > 0;
  const hasProducts =
    Array.isArray(
      (raw.payment as Record<string, unknown> | undefined)?.products
    ) &&
    ((raw.payment as Record<string, unknown>).products as unknown[]).length > 0;

  const hasContact =
    Boolean(pickString(raw.email, raw.Email, raw.phone, raw.Phone)) ||
    Boolean(pickString(raw.name, raw.Name));

  return hasContact && !hasPayment && !hasAmount && !hasProducts;
}
