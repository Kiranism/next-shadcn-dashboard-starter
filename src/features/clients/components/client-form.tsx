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
import {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  useState
} from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { RecurringRulesList } from './recurring-rules-list';
import {
  recurringRulesService,
  RecurringRule
} from '@/features/trips/api/recurring-rules.service';
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
  greeting_style: z.string().optional(),
  notes: z.string().optional(),
  requires_daily_scheduling: z.boolean()
});

/** Imperative handle exposed via forwardRef — used by ClientDetailPanel */
export interface ClientFormHandle {
  /** Programmatically trigger form submission (equivalent to clicking the submit button) */
  submit: () => void;
}

interface ClientFormProps {
  initialData: Client | null;
  pageTitle: string;
  /**
   * When provided, called with the saved Client instead of navigating to
   * /dashboard/clients. Used by ClientDetailPanel in the column view so the
   * panel can stay open and refresh its state after a successful save.
   */
  onSuccess?: (client: Client) => void;
  /**
   * When true, renders the form fields directly without the Card/CardHeader
   * wrapper and hides the internal submit button (the panel header provides it).
   */
  noCard?: boolean;
  /**
   * Called whenever form.formState.isDirty changes. Used by ClientDetailPanel
   * to enable/disable the header "Aktualisieren" button reactively.
   */
  onDirtyChange?: (dirty: boolean) => void;
}

const ClientForm = forwardRef<ClientFormHandle, ClientFormProps>(
  function ClientForm(
    {
      initialData,
      pageTitle,
      onSuccess,
      noCard = false,
      onDirtyChange
    }: ClientFormProps,
    ref
  ) {
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
      greeting_style: initialData?.greeting_style || '',
      notes: initialData?.notes || '',
      requires_daily_scheduling: initialData?.requires_daily_scheduling ?? false
    };

    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues
    });

    // Expose submit() so ClientDetailPanel's header button can trigger submission
    useImperativeHandle(ref, () => ({
      submit: () => void form.handleSubmit(onSubmit)()
    }));

    // Notify parent when dirty state changes so the header button can react
    const isDirty = form.formState.isDirty;
    const onDirtyChangeRef = useRef(onDirtyChange);
    onDirtyChangeRef.current = onDirtyChange;
    useEffect(() => {
      onDirtyChangeRef.current?.(isDirty);
    }, [isDirty]);

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
              .from('accounts')
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
          const updated = await clientsService.updateClient(
            initialData.id,
            payload
          );
          toast.success('Fahrgast erfolgreich aktualisiert.');
          // Reset form with the saved values so isDirty → false and the header
          // button returns to its disabled state until the next change.
          form.reset(values);
          if (onSuccess) {
            onSuccess(updated);
            return;
          }
        } else {
          const created = await clientsService.createClient(payload);
          toast.success('Fahrgast erfolgreich erstellt.');
          form.reset(values);
          if (onSuccess) {
            onSuccess(created);
            return;
          }
        }
        // Default behaviour when used outside the column view: navigate back
        router.push('/dashboard/clients');
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || 'Ein Fehler ist aufgetreten.');
      } finally {
        setLoading(false);
      }
    }

    const formFields = (
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
                        if (!result.street) {
                          field.onChange(result.address);
                          return;
                        }
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
            name='greeting_style'
            label='Anrede'
            placeholder='z. B. Herr, Frau, Dr., etc.'
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

        {/* In noCard mode the panel header provides the submit button */}
        {!noCard && (
          <Button type='submit' disabled={loading}>
            {initialData ? 'Fahrgast aktualisieren' : 'Fahrgast hinzufügen'}
          </Button>
        )}
      </Form>
    );

    // noCard=true: render bare form fields (column view — Panel provides the container)
    if (noCard) {
      return formFields;
    }

    // Default: wrap in Card with title header + recurring rules list below
    return (
      <>
        <Card className='mx-auto w-full'>
          <CardHeader>
            <CardTitle className='text-left text-2xl font-bold'>
              {pageTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>{formFields}</CardContent>
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
);

export default ClientForm;
