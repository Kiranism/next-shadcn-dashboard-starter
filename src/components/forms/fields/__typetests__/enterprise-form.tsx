'use client';

/**
 * R8 target: the audit's enterprise-settings scenario (23 fields, 3-level
 * nesting) ported to the NEW API. The only page-level change vs the archived
 * original is `useFormFields<OrgSettingsValues>()` -> `useFormFields(form)`
 * (plus the import source). Everything else — validators, listeners,
 * AppField escape hatch, disabled/min/max passthrough — is verbatim.
 */

import { useStore } from '@tanstack/react-form';
import * as z from 'zod';
import * as React from 'react';
import { useAppForm, FormErrors, scrollToFirstError } from '@/components/ui/tanstack-form';
import { FieldSet, FieldLegend, FieldDescription, FieldSeparator } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormFields } from '@/components/ui/tanstack-form';
import { orgSettingsSchema, orgSettingsDefaults } from './org-settings';
import {
  visibilityOptions,
  countryOptions,
  planOptions,
  digestFrequencyOptions
} from './org-settings-options';

export default function OrgSettingsForm() {
  const form = useAppForm({
    defaultValues: orgSettingsDefaults,
    validators: { onSubmit: orgSettingsSchema },
    onSubmitInvalid: () => scrollToFirstError(),
    onSubmit: ({ value }) => {
      void value;
    }
  });

  const {
    FormTextField,
    FormTextareaField,
    FormSelectField,
    FormCheckboxField,
    FormSwitchField,
    FormRadioGroupField
  } = useFormFields(form);

  const billingEnabled = useStore(form.store, (s) => s.values.billing.enabled);
  const slackEnabled = useStore(form.store, (s) => s.values.notifications.slack.enabled);
  const twoFactor = useStore(form.store, (s) => s.values.security.twoFactor);

  return (
    <form.AppForm>
      <form.Form className='max-w-2xl gap-6'>
        <FormErrors />

        <FieldSet>
          <FieldLegend>General</FieldLegend>
          <FieldDescription>How your organization appears across the product.</FieldDescription>
          <FormTextField
            name='general.name'
            label='Organization Name'
            required
            placeholder='Acme Inc.'
            validators={{
              onBlur: z.string().min(2, 'Organization name must be at least 2 characters')
            }}
          />
          <FormTextField
            name='general.slug'
            label='Slug'
            required
            placeholder='acme-inc'
            description='Used in URLs — lowercase letters, numbers and dashes.'
            validators={{
              onBlur: z
                .string()
                .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and dashes only')
            }}
          />
          <FormTextareaField
            name='general.description'
            label='Description'
            placeholder='What does this organization do?'
            maxLength={280}
            showCount
          />
          <FormRadioGroupField
            name='general.visibility'
            label='Visibility'
            required
            options={visibilityOptions}
          />
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Contact</FieldLegend>
          <FormTextField
            name='contact.email'
            label='Contact Email'
            required
            type='email'
            placeholder='ops@acme.com'
            validators={{ onBlur: z.email('Enter a valid contact email') }}
          />
          {/* Horizontal layout — AppField escape hatch, unchanged (R7) */}
          <form.AppField
            name='contact.phone'
            validators={{ onBlur: z.string().min(7, 'Enter a valid phone number') }}
          >
            {(field) => (
              <field.FieldSet>
                <field.Field orientation='horizontal'>
                  <field.FieldContent>
                    <field.FieldLabel htmlFor='contact-phone'>Phone *</field.FieldLabel>
                    <field.FieldDescription>
                      Reachable during business hours.
                    </field.FieldDescription>
                  </field.FieldContent>
                  <Input
                    id='contact-phone'
                    type='tel'
                    placeholder='+1 555 0100'
                    className='sm:max-w-52'
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </field.Field>
                <field.FieldError />
              </field.FieldSet>
            )}
          </form.AppField>
          <FormTextField
            name='contact.address.street'
            label='Street'
            required
            placeholder='1 Market St'
            validators={{ onBlur: z.string().min(1, 'Street is required') }}
          />
          <div className='grid gap-4 sm:grid-cols-2'>
            <FormTextField
              name='contact.address.city'
              label='City'
              required
              placeholder='San Francisco'
              validators={{ onBlur: z.string().min(1, 'City is required') }}
            />
            <FormTextField
              name='contact.address.zip'
              label='Postal Code'
              required
              placeholder='94105'
              validators={{ onBlur: z.string().min(3, 'Enter a valid postal code') }}
            />
          </div>
          <FormSelectField
            name='contact.address.country'
            label='Country'
            required
            options={countryOptions}
            placeholder='Select a country'
            validators={{ onBlur: z.string().min(1, 'Select a country') }}
          />
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Billing</FieldLegend>
          <FormSwitchField
            name='billing.enabled'
            label='Enable billing'
            description='Turn on invoicing and paid plans for this organization.'
          />
          {billingEnabled && (
            <>
              <div className='grid gap-4 sm:grid-cols-2'>
                <FormSelectField
                  name='billing.plan'
                  label='Plan'
                  required
                  options={planOptions}
                  placeholder='Select a plan'
                  validators={{ onBlur: z.string().min(1, 'Select a plan') }}
                />
                <FormTextField
                  name='billing.invoiceEmail'
                  label='Invoice Email'
                  required
                  type='email'
                  placeholder='billing@acme.com'
                  validators={{ onBlur: z.email('Enter a valid invoice email') }}
                />
              </div>
              <FormTextField
                name='billing.vat'
                label='VAT Number'
                placeholder='DE123456789'
                description='Optional — required for EU reverse-charge invoices.'
                validators={{
                  onBlur: z
                    .string()
                    .refine(
                      (v) => !v || /^[A-Z]{2}[A-Z0-9]{2,12}$/.test(v),
                      'Enter a valid VAT number (e.g. DE123456789)'
                    )
                }}
              />
            </>
          )}
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Notifications</FieldLegend>
          <FormCheckboxField
            name='notifications.email.marketing'
            label='Marketing emails'
            description='Product announcements and offers.'
          />
          <FormCheckboxField
            name='notifications.email.productUpdates'
            label='Product updates'
            description='Changelogs and new-feature emails.'
          />
          <FormSelectField
            name='notifications.email.digestFrequency'
            label='Digest Frequency'
            required
            options={digestFrequencyOptions}
            validators={{ onBlur: z.string().min(1, 'Select a digest frequency') }}
          />
          <FormSwitchField
            name='notifications.slack.enabled'
            label='Slack notifications'
            description='Send alerts to a Slack channel.'
            listeners={{
              onChange: ({ value, fieldApi }) => {
                if (!value) {
                  fieldApi.form.setFieldValue('notifications.slack.webhookUrl', '');
                  fieldApi.form.setFieldValue('notifications.slack.channel', '');
                }
              }
            }}
          />
          {slackEnabled && (
            <>
              <FormTextField
                name='notifications.slack.webhookUrl'
                label='Webhook URL'
                required
                type='url'
                placeholder='https://hooks.slack.com/services/…'
                validators={{ onBlur: z.url('Enter a valid Slack webhook URL') }}
              />
              <FormTextField
                name='notifications.slack.channel'
                label='Channel'
                placeholder='#alerts'
                validators={{
                  onBlur: z
                    .string()
                    .refine((v) => !v || v.startsWith('#'), 'Channel must start with #')
                }}
              />
            </>
          )}
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Security</FieldLegend>
          <FormSwitchField
            name='security.twoFactor'
            label='Require two-factor authentication'
            description='Members must enroll a second factor to sign in.'
          />
          <FormTextField
            name='security.sessionTimeout'
            label='Session Timeout (minutes)'
            type='number'
            min={5}
            max={1440}
            disabled={!twoFactor}
            description={
              twoFactor
                ? 'Idle sessions expire after this many minutes.'
                : 'Enable two-factor authentication to configure session timeout.'
            }
            validators={{
              onBlur: z
                .number('Session timeout is required')
                .min(5, 'Minimum 5 minutes')
                .max(1440, 'Maximum 24 hours')
            }}
          />
          <FormTextareaField
            name='security.ipAllowlist'
            label='IP Allowlist'
            placeholder={'10.0.0.0/8\n192.168.1.25'}
            description='One IPv4 address or CIDR range per line. Leave empty to allow all.'
            rows={4}
            validators={{
              onBlur: z.string().refine(
                (v) =>
                  v
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .every((line) => /^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$/.test(line)),
                'One IPv4 address or CIDR range per line'
              )
            }}
          />
        </FieldSet>

        <div className='flex justify-end gap-3 pt-2'>
          <Button type='button' variant='outline' onClick={() => form.reset()}>
            Reset
          </Button>
          <form.SubmitButton>Save Settings</form.SubmitButton>
        </div>
      </form.Form>
    </form.AppForm>
  );
}
