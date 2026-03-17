/**
 * Client matching helper for the CSV bulk upload pipeline.
 *
 * Matching is intentionally strict: a result is only accepted when it is
 * unambiguous (exactly one candidate). Anything ambiguous goes to the
 * dispatcher wizard — false positives (wrong client linked) are far more
 * damaging than false negatives (wizard shown unnecessarily).
 *
 * Strategy priority:
 *   1. Phone number  — normalized to digits-only with German prefix handling.
 *                      Phone is the only truly unique identifier in a client DB.
 *   2. First + Last  — exact case-insensitive match on both columns separately.
 *                      More reliable than concatenating because it avoids spacing issues.
 *   3. Last + ZIP    — fallback when firstname is absent in the CSV (e.g. hospital
 *                      exports that only include surname). ZIP dramatically reduces
 *                      the candidate pool in German postal codes.
 *
 * This mirrors industry practice from medical transport dispatch systems
 * (LogistiCare, MTM) where phone → member-ID → address is the standard cascade.
 */

export interface MatchableClient {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  zip_code?: string | null;
}

export interface ClientMatchInput {
  firstname?: string;
  lastname?: string;
  phone?: string;
  /** Pickup ZIP from the CSV row — used as address signal in strategy 3. */
  pickup_zip?: string;
}

export type ClientMatchStrategy = 'phone' | 'name' | 'name_zip';

export type ClientMatchResult =
  | { matched: true; client: MatchableClient; strategy: ClientMatchStrategy }
  | { matched: false };

// ── Normalisation helpers ──────────────────────────────────────────────────

/**
 * Strips whitespace and lowercases a string for comparison.
 * Does NOT strip special characters so that "Haßfurther" ≠ "Hassfurther"
 * — an intentional choice: if they differ in the source data, a human should
 * resolve the discrepancy rather than silently matching the wrong person.
 */
const normText = (v: string | null | undefined): string =>
  (v || '').trim().toLowerCase();

/**
 * Normalises a German phone number to a pure digit string with a leading 0.
 *
 * Handles:
 *   "0441 12345"        → "044112345"
 *   "+49 441 12345"     → "044112345"
 *   "0049 441 12345"    → "044112345"
 *   "+49441123456"      → "044112345"  (mobile)
 */
const normPhone = (v: string | null | undefined): string => {
  let digits = (v || '').replace(/\D/g, '');
  // 0049... → strip leading 00
  if (digits.startsWith('0049')) digits = digits.slice(2);
  // 49... (international without leading 00) → replace with 0
  if (digits.startsWith('49') && digits.length >= 11)
    digits = '0' + digits.slice(2);
  return digits;
};

// ── Main matcher ───────────────────────────────────────────────────────────

export function matchClient(
  input: ClientMatchInput,
  clients: MatchableClient[]
): ClientMatchResult {
  const csvPhone = normPhone(input.phone);
  const csvFirst = normText(input.firstname);
  const csvLast = normText(input.lastname);
  const csvZip = (input.pickup_zip || '').trim();

  // ── Strategy 1: phone ────────────────────────────────────────────────────
  // Minimum 7 digits guards against empty / placeholder values like "0000000".
  if (csvPhone.length >= 7) {
    const candidates = clients.filter((c) => {
      const dbPhone = normPhone(c.phone);
      return dbPhone.length >= 7 && dbPhone === csvPhone;
    });
    if (candidates.length === 1) {
      return { matched: true, client: candidates[0], strategy: 'phone' };
    }
  }

  // ── Strategy 2: first name + last name (both required) ───────────────────
  if (csvFirst && csvLast) {
    const candidates = clients.filter(
      (c) =>
        normText(c.first_name) === csvFirst && normText(c.last_name) === csvLast
    );
    if (candidates.length === 1) {
      return { matched: true, client: candidates[0], strategy: 'name' };
    }
  }

  // ── Strategy 3: last name + ZIP (when firstname is absent in CSV) ─────────
  // Only activated when the CSV row genuinely has no firstname — not as a
  // fallback when firstname is present but the name match failed, which would
  // risk linking to the wrong person (e.g. two "Müller"s at different addresses).
  if (!csvFirst && csvLast && csvZip) {
    const candidates = clients.filter(
      (c) =>
        normText(c.last_name) === csvLast &&
        (c.zip_code || '').trim() === csvZip
    );
    if (candidates.length === 1) {
      return { matched: true, client: candidates[0], strategy: 'name_zip' };
    }
  }

  return { matched: false };
}
