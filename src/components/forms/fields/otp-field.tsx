'use client';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator
} from '@/components/ui/input-otp';
import { useFieldContext, useFieldInvalid, type BaseFieldProps } from '@/lib/form-context';

/** 6-digit one-time-code input (3 + 3 with a separator). */
export function OtpField({ label, description, required }: BaseFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = useFieldInvalid();

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel>
        {label}
        {required && ' *'}
      </FieldLabel>
      <InputOTP
        maxLength={6}
        value={field.state.value}
        onChange={field.handleChange}
        aria-label={label}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />}
    </Field>
  );
}
