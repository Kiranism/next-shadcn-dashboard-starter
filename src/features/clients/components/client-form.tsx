'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Client, clientsService } from '@/features/clients/api/clients.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company_name: z.string().optional(),
  street: z.string().min(1, { message: 'Straße ist erforderlich.' }),
  street_number: z.string().min(1, { message: 'Hausnummer ist erforderlich.' }),
  zip_code: z.string().min(1, { message: 'PLZ ist erforderlich.' }),
  city: z.string().min(1, { message: 'Stadt ist erforderlich.' }),
  phone: z.string().optional(),
  notes: z.string().optional()
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

  const defaultValues = {
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    company_name: initialData?.company_name || '',
    street: initialData?.street || '',
    street_number: initialData?.street_number || '',
    zip_code: initialData?.zip_code || '',
    city: initialData?.city || '',
    phone: initialData?.phone || '',
    notes: initialData?.notes || ''
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
        ...values,
        is_company: isCompany,
        company_id: companyIdStr
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
            <FormInput
              control={form.control}
              name='street'
              label='Straße'
              placeholder='Straße eingeben'
              required
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
  );
}
