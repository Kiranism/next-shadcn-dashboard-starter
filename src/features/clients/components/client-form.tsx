'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormSwitch } from '@/components/forms/form-switch';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Client,
  clientsService,
  type InsertClient,
  type UpdateClient
} from '@/features/clients/api/clients.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { RecurringRulesList } from './recurring-rules-list';
import {
  recurringRulesService,
  RecurringRule
} from '@/features/trips/api/recurring-rules.service';
import { useEffect } from 'react';
import {
  AddressAutocomplete,
  type AddressResult
} from '@/features/trips/components/address-autocomplete';

const formSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company_name: z.string().optional(),
  street: z.string().min(1, { message: 'Straße ist erforderlich.' }),
  street_number: z.string().min(1, { message: 'Hausnummer ist erforderlich.' }),
  zip_code: z.string().min(1, { message: 'PLZ ist erforderlich.' }),
  city: z.string().min(1, { message: 'Stadt ist erforderlich.' }),
  phone: z.string().optional(),
  relation: z.string().optional(),
  notes: z.string().optional(),
  requires_daily_scheduling: z.boolean()
});

export default function ClientForm({
  initialData,
  pageTitle
}: {
  initialData: Client | null;
  pageTitle: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [rules, setRules] = useState<RecurringRule[]>([]);

  const fetchRules = async () => {
    if (!initialData) return;
    try {
      const data = await recurringRulesService.getClientRules(initialData.id);
      setRules(data);
    } catch (error: any) {
      toast.error('Fehler beim Laden der Regelfahrten: ' + error.message);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [initialData]);

  const defaultValues = {
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    company_name: initialData?.company_name || '',
    street: initialData?.street || '',
    street_number: initialData?.street_number || '',
    zip_code: initialData?.zip_code || '',
    city: initialData?.city || '',
    phone: initialData?.phone || '',
    relation: initialData?.relation || '',
    notes: initialData?.notes || '',
    requires_daily_scheduling: initialData?.requires_daily_scheduling ?? false
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const isCompany =
        !!values.company_name && !values.first_name && !values.last_name;

      let companyIdStr: string = initialData?.company_id || '';
      if (!companyIdStr) {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const {
          data: { user }
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('company_id')
            .eq('id', user.id)
            .single();
          companyIdStr =
            profile?.company_id || '00000000-0000-0000-0000-000000000000';
        } else {
          companyIdStr = '00000000-0000-0000-0000-000000000000';
        }
      }

      const payload = {
        ...(values as any),
        is_company: isCompany,
        company_id: companyIdStr,
        // Preserve existing lat/lng when editing; rely on AddressAutocomplete to have
        // populated them on the values object when a suggestion was selected.
        lat: (initialData as any)?.lat ?? (values as any).lat ?? null,
        lng: (initialData as any)?.lng ?? (values as any).lng ?? null
      };

      if (initialData) {
        await clientsService.updateClient(initialData.id, payload);
        toast.success('Fahrgast erfolgreich aktualisiert.');
      } else {
        await clientsService.createClient(payload);
        toast.success('Fahrgast erfolgreich erstellt.');
      }
      router.push('/dashboard/clients');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Ein Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            {pageTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form
            form={form}
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-8'
          >
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              <FormInput
                control={form.control}
                name='first_name'
                label='Vorname'
                placeholder='Vorname eingeben'
              />
              <FormInput
                control={form.control}
                name='last_name'
                label='Nachname'
                placeholder='Nachname eingeben'
              />
              <FormInput
                control={form.control}
                name='company_name'
                label='Firmenname'
                placeholder='Firmenname eingeben'
              />
              <FormField
                control={form.control}
                name='street'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Straße<span className='ml-1 text-red-500'>*</span>
                    </FormLabel>
                    <FormControl>
                      <AddressAutocomplete
                        value={field.value}
                        onChange={(result: AddressResult | string) => {
                          if (typeof result === 'string') {
                            field.onChange(result);
                          } else {
                            // While typing, AddressAutocomplete sends { address: typedText } with no street.
                            // In that case, keep the raw address in the text field so the user can see their input.
                            if (!result.street) {
                              field.onChange(result.address);
                              return;
                            }

                            // On selecting a suggestion, fill all structured fields.
                            field.onChange(result.street || result.address);
                            form.setValue(
                              'street_number',
                              result.street_number || ''
                            );
                            form.setValue('zip_code', result.zip_code || '');
                            form.setValue('city', result.city || '');
                          }
                        }}
                        placeholder='Straße eingeben'
                        className='h-8 text-[11px]'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormInput
                control={form.control}
                name='street_number'
                label='Hausnummer'
                placeholder='Hausnummer eingeben'
                required
              />
              <FormInput
                control={form.control}
                name='relation'
                label='Beziehung'
                placeholder='Beziehung eingeben'
              />
              <FormInput
                control={form.control}
                name='zip_code'
                label='PLZ'
                placeholder='Postleitzahl eingeben'
                required
              />
              <FormInput
                control={form.control}
                name='city'
                label='Stadt'
                placeholder='Stadt eingeben'
                required
              />
              <FormInput
                control={form.control}
                name='phone'
                label='Telefonnummer'
                placeholder='Telefonnummer eingeben'
              />
            </div>

            <FormSwitch
              control={form.control}
              name='requires_daily_scheduling'
              label='Benötigt tägliche Zeitabsprache'
              description='Aktivieren, wenn dieser Fahrgast jeden Tag eine neue Abholzeit benötigt.'
            />

            <FormTextarea
              control={form.control}
              name='notes'
              label='Notizen'
              placeholder='Zusätzliche Notizen eingeben'
              config={{
                maxLength: 500,
                showCharCount: true,
                rows: 4
              }}
            />

            <Button type='submit' disabled={loading}>
              {initialData ? 'Fahrgast aktualisieren' : 'Fahrgast hinzufügen'}
            </Button>
          </Form>
        </CardContent>
      </Card>

      {initialData && (
        <div className='mt-8'>
          <RecurringRulesList
            clientId={initialData.id}
            rules={rules}
            onRulesChange={fetchRules}
          />
        </div>
      )}
    </>
  );
}
