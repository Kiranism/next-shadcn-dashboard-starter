import * as z from 'zod';

export type ReturnMode = 'none' | 'time_tbd' | 'exact';

export const tripFormSchema = z
  .object({
    payer_id: z.string().min(1, 'Kostenträger ist erforderlich'),
    billing_type_id: z.string().optional(),
    scheduled_at: z.date({ error: 'Datum und Uhrzeit sind erforderlich' }),
    return_mode: z.enum(['none', 'time_tbd', 'exact']).default('none'),
    return_date: z.date().optional(),
    return_time: z
      .union([
        z.literal(''),
        z
          .string()
          .regex(
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            'Bitte ein gültiges Zeitformat verwenden (HH:MM)'
          )
      ])
      .optional(),
    driver_id: z.string().optional(),
    is_wheelchair: z.boolean(),
    notes: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.return_mode === 'exact') {
      if (!data.return_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Bitte Rückfahrt-Datum auswählen.',
          path: ['return_date']
        });
      }
      if (!data.return_time) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Bitte Rückfahrt-Uhrzeit auswählen.',
          path: ['return_time']
        });
      }
    }
  });

export type TripFormValues = z.infer<typeof tripFormSchema>;
