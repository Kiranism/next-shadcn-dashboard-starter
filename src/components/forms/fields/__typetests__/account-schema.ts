import * as z from 'zod';

// ---------------------------------------------------------------------------
// Discriminated union: 'individual' requires ssn, 'company' requires
// companyName + vat. The union is the single onSubmit source of truth.
// ---------------------------------------------------------------------------

const sharedFields = {
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-z0-9_]+$/i, 'Letters, numbers and underscores only'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  // NOTE: `message` override is load-bearing — without it, clearing a
  // type='number' TextField stores '' (a string) and plain z.number() surfaces
  // "Invalid input: expected number, received string" to the end user.
  amount: z.number({ message: 'Amount is required' }).positive('Amount must be greater than zero'),
  acceptTerms: z.boolean().refine((v) => v === true, 'You must accept the terms')
};

export const individualAccountSchema = z.object({
  accountType: z.literal('individual'),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, 'SSN must match 123-45-6789'),
  ...sharedFields
});

export const companyAccountSchema = z.object({
  accountType: z.literal('company'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  vat: z.string().regex(/^[A-Z]{2}\d{8,12}$/, 'VAT: 2-letter country code + 8-12 digits'),
  ...sharedFields
});

export const accountSchema = z.discriminatedUnion('accountType', [
  individualAccountSchema,
  companyAccountSchema
]);

/**
 * z.infer of a discriminated union is a UNION of the two variants — the
 * docs' "always prefer z.infer" rule collides with a form runtime that must
 * hold ALL variant fields simultaneously (so values survive switching the
 * discriminator). We keep the union as the form's TFormData and cast
 * defaultValues; see the form component for the trade-offs.
 */
export type AccountFormValues = z.infer<typeof accountSchema>;

/** Runtime default values: every variant field present, discriminator picked. */
export const accountDefaultValues = {
  accountType: 'individual',
  ssn: '',
  companyName: '',
  vat: '',
  username: '',
  password: '',
  confirmPassword: '',
  startDate: '',
  endDate: '',
  amount: 0,
  acceptTerms: false
} as AccountFormValues;
