import {
  extractReferralFromWebhookBody,
  isSignupOnlyPayload
} from './referral-attribution.service';

export type TildaOrder = {
  name?: string;
  email?: string;
  phone?: string;
  payment: {
    amount: string | number;
    orderid?: string;
    systranid?: string;
    products?: TildaProduct[];
    promocode?: string;
  };
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_ref?: string;
  utm_org?: string;
  [key: string]: any;
};

export type TildaProduct = {
  name: string;
  price: number;
  quantity?: number;
  amount?: number;
  sku?: string;
  [key: string]: any;
};

export interface NormalizedOrder {
  orderId: string;
  email?: string;
  phone?: string;
  name?: string;
  amount: number;
  products: TildaProduct[];
  promocode?: string;
  utmSource?: string;
  utmOrg?: string;
  raw: any;
  appliedBonuses: number;
  isSignupForm?: boolean;
}

export class TildaParserService {
  static normalizeOrder(raw: any): NormalizedOrder {
    const toNum = (v: unknown): number => {
      if (typeof v === 'number') return v;
      const s = String(v ?? '').replace(/[^0-9.\-]/g, '');
      const n = Number(s);
      return Number.isFinite(n) ? n : 0;
    };

    const out: any = { ...raw };

    // Lowercase contact fields
    if (out.Email && !out.email)
      out.email = String(out.Email).trim().toLowerCase();
    if (out.Phone && !out.phone) out.phone = String(out.Phone).trim();
    if (out.Name && !out.name) out.name = String(out.Name).trim();

    // Handle Applied Bonuses
    let appliedBonuses = 0;
    const candidates = [
      out.appliedBonuses,
      out.applied_bonuses,
      out.AppliedBonuses,
      out['appliedBonuses']
    ];

    for (const val of candidates) {
      if (val !== undefined && val !== null) {
        if (typeof val === 'number') {
          appliedBonuses = val;
        } else {
          const parsed = parseFloat(String(val).replace(/[^0-9.]/g, ''));
          if (!isNaN(parsed)) appliedBonuses = parsed;
        }
        break;
      }
    }

    // Handle Payment Object
    let amount = 0;
    let products: TildaProduct[] = [];
    let promocode = out.promocode;

    if (out.payment) {
      amount = toNum(out.payment.amount);
      if (!out.payment.orderid && out.payment.systranid) {
        out.payment.orderid = String(out.payment.systranid);
      }
      if (out.payment.promocode) {
        promocode = out.payment.promocode;
      }

      if (Array.isArray(out.payment.products)) {
        products = out.payment.products.map((p: any) => ({
          ...p,
          price: toNum(p?.price),
          amount:
            typeof p?.amount !== 'undefined'
              ? toNum(p.amount)
              : toNum(p?.price),
          quantity: typeof p?.quantity !== 'undefined' ? toNum(p.quantity) : 1
        }));
      }
    } else if (out.test === 'test') {
      // Handle test requests or simpler formats if necessary
    }

    const orderId =
      out.payment?.orderid || out.orderid || `tilda_gen_${Date.now()}`;

    const extracted = extractReferralFromWebhookBody(out);

    return {
      orderId,
      email: out.email,
      phone: out.phone,
      name: out.name,
      amount,
      products,
      promocode,
      utmSource: extracted.utmRef || out.utm_ref || out.utm_source,
      utmOrg: extracted.utmOrg || out.utm_org,
      raw: out,
      appliedBonuses,
      isSignupForm: isSignupOnlyPayload(out)
    };
  }
}
