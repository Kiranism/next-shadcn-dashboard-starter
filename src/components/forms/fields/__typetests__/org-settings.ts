import * as z from 'zod';

/**
 * Enterprise org-settings schema — 23 fields, 3 levels deep.
 *
 * Conditional requirements are expressed with superRefine on the nested
 * objects so that a single full schema can run onSubmit without hidden
 * sections blocking submission:
 *  - billing.plan / billing.invoiceEmail only required when billing.enabled
 *  - notifications.slack.webhookUrl only required when slack.enabled
 */
export const orgSettingsSchema = z.object({
  general: z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters'),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and dashes only'),
    description: z.string().max(280, 'Keep the description under 280 characters'),
    visibility: z.string().min(1, 'Select a visibility level')
  }),
  contact: z.object({
    email: z.email('Enter a valid contact email'),
    phone: z.string().min(7, 'Enter a valid phone number'),
    address: z.object({
      street: z.string().min(1, 'Street is required'),
      city: z.string().min(1, 'City is required'),
      zip: z.string().min(3, 'Enter a valid postal code'),
      country: z.string().min(1, 'Select a country')
    })
  }),
  billing: z
    .object({
      enabled: z.boolean(),
      plan: z.string(),
      invoiceEmail: z.string(),
      vat: z.string()
    })
    .superRefine((billing, ctx) => {
      if (!billing.enabled) return;
      if (!billing.plan) {
        ctx.addIssue({ code: 'custom', path: ['plan'], message: 'Select a plan' });
      }
      if (!z.email().safeParse(billing.invoiceEmail).success) {
        ctx.addIssue({
          code: 'custom',
          path: ['invoiceEmail'],
          message: 'Enter a valid invoice email'
        });
      }
      if (billing.vat && !/^[A-Z]{2}[A-Z0-9]{2,12}$/.test(billing.vat)) {
        ctx.addIssue({
          code: 'custom',
          path: ['vat'],
          message: 'Enter a valid VAT number (e.g. DE123456789)'
        });
      }
    }),
  notifications: z.object({
    email: z.object({
      marketing: z.boolean(),
      productUpdates: z.boolean(),
      digestFrequency: z.string().min(1, 'Select a digest frequency')
    }),
    slack: z
      .object({
        enabled: z.boolean(),
        webhookUrl: z.string(),
        channel: z.string()
      })
      .superRefine((slack, ctx) => {
        if (!slack.enabled) return;
        if (!z.url().safeParse(slack.webhookUrl).success) {
          ctx.addIssue({
            code: 'custom',
            path: ['webhookUrl'],
            message: 'Enter a valid Slack webhook URL'
          });
        }
        if (slack.channel && !slack.channel.startsWith('#')) {
          ctx.addIssue({
            code: 'custom',
            path: ['channel'],
            message: 'Channel must start with #'
          });
        }
      })
  }),
  security: z.object({
    twoFactor: z.boolean(),
    sessionTimeout: z
      .number('Session timeout is required')
      .min(5, 'Minimum 5 minutes')
      .max(1440, 'Maximum 24 hours'),
    ipAllowlist: z.string().refine(
      (v) =>
        v
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .every((line) => /^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$/.test(line)),
      'One IPv4 address or CIDR range per line'
    )
  })
});

export type OrgSettingsValues = z.infer<typeof orgSettingsSchema>;

export const orgSettingsDefaults: OrgSettingsValues = {
  general: { name: '', slug: '', description: '', visibility: 'private' },
  contact: {
    email: '',
    phone: '',
    address: { street: '', city: '', zip: '', country: '' }
  },
  billing: { enabled: false, plan: '', invoiceEmail: '', vat: '' },
  notifications: {
    email: { marketing: false, productUpdates: true, digestFrequency: 'weekly' },
    slack: { enabled: false, webhookUrl: '', channel: '' }
  },
  security: { twoFactor: false, sessionTimeout: 30, ipAllowlist: '' }
};
