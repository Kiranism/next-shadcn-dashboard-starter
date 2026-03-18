'use client';

/**
 * Driver form body — shared form fields for create/edit.
 *
 * Used in DriverForm (sheet, table view) and DriverDetailPanel (columns view).
 * Exposes submit via forwardRef and onDirtyChange for header button.
 *
 * Fields: first_name, last_name, email (create/edit display), phone, role,
 * address (street, street_number, zip_code, city), license_number, default_vehicle.
 * Grid layout for compact form (Rolle paired with other fields).
 */

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  AddressAutocomplete,
  type AddressResult
} from '@/features/trips/components/address-autocomplete';
import type { DriverWithProfile } from '@/features/driver-management/types';
import { createClient } from '@/lib/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

export const driverFormSchema = z
  .object({
    email: z.string().email().optional().or(z.literal('')),
    password: z.string().min(6).optional().or(z.literal('')),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    role: z.enum(['driver', 'admin']),
    street: z.string().optional(),
    street_number: z.string().optional(),
    zip_code: z.string().optional(),
    city: z.string().optional(),
    lat: z.number().optional().nullable(),
    lng: z.number().optional().nullable(),
    license_number: z.string().optional(),
    default_vehicle_id: z.string().optional().nullable()
  })
  .refine(
    (data) =>
      (data.first_name && data.first_name.trim()) ||
      (data.last_name && data.last_name.trim()) ||
      (data.name && data.name.trim()),
    { message: 'Vorname oder Nachname ist erforderlich.', path: ['first_name'] }
  );

export type DriverFormValues = z.infer<typeof driverFormSchema>;

interface VehicleOption {
  id: string;
  name: string;
  license_plate: string;
}

export interface DriverFormBodyHandle {
  submit: () => void;
}

interface DriverFormBodyProps {
  initialData: DriverWithProfile | null;
  mode: 'create' | 'edit';
  onSuccess?: (saved?: DriverWithProfile) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export const DriverFormBody = forwardRef<
  DriverFormBodyHandle,
  DriverFormBodyProps
>(function DriverFormBody(
  { initialData, mode, onSuccess, onDirtyChange },
  ref
) {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      name: '',
      phone: '',
      role: 'driver',
      street: '',
      street_number: '',
      zip_code: '',
      city: '',
      lat: null,
      lng: null,
      license_number: '',
      default_vehicle_id: null
    }
  });

  useEffect(() => {
    const fetchVehicles = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('vehicles')
        .select('id, name, license_plate')
        .eq('is_active', true)
        .order('name');
      setVehicles((data as VehicleOption[]) ?? []);
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const profile = Array.isArray(initialData.driver_profiles)
        ? initialData.driver_profiles[0]
        : (initialData as { driver_profiles?: unknown }).driver_profiles;
      const p = profile as {
        street?: string | null;
        street_number?: string | null;
        zip_code?: string | null;
        city?: string | null;
        lat?: number | null;
        lng?: number | null;
        license_number?: string | null;
        default_vehicle_id?: string | null;
      } | null;
      const u = initialData as {
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
      };
      form.reset({
        email: u?.email ?? '',
        password: '',
        first_name: u?.first_name ?? '',
        last_name: u?.last_name ?? '',
        name: initialData.name ?? '',
        phone: initialData.phone ?? '',
        role: (initialData.role as 'driver' | 'admin') ?? 'driver',
        street: p?.street ?? '',
        street_number: p?.street_number ?? '',
        zip_code: p?.zip_code ?? '',
        city: p?.city ?? '',
        lat: p?.lat ?? null,
        lng: p?.lng ?? null,
        license_number: p?.license_number ?? '',
        default_vehicle_id: p?.default_vehicle_id ?? null
      });
    } else {
      form.reset({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        name: '',
        phone: '',
        role: 'driver',
        street: '',
        street_number: '',
        zip_code: '',
        city: '',
        lat: null,
        lng: null,
        license_number: '',
        default_vehicle_id: null
      });
    }
  }, [mode, initialData, form]);

  const isDirty = form.formState.isDirty;
  const onDirtyChangeRef = useRef(onDirtyChange);
  onDirtyChangeRef.current = onDirtyChange;
  useEffect(() => {
    onDirtyChangeRef.current?.(isDirty);
  }, [isDirty]);

  useImperativeHandle(ref, () => ({
    submit: () => void form.handleSubmit(onSubmit)()
  }));

  async function onSubmit(values: DriverFormValues) {
    if (mode === 'create' && (!values.email || !values.password)) {
      toast.error('E-Mail und Passwort sind erforderlich.');
      return;
    }
    const displayName =
      [values.first_name, values.last_name].filter(Boolean).join(' ').trim() ||
      values.name ||
      '';
    if (!displayName && mode === 'create') {
      toast.error('Vorname oder Nachname ist erforderlich.');
      return;
    }
    try {
      if (mode === 'create') {
        const res = await fetch('/api/drivers/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: values.email,
            password: values.password,
            first_name: values.first_name || null,
            last_name: values.last_name || null,
            name: displayName || null,
            phone: values.phone || null,
            role: values.role,
            license_number: values.license_number || null,
            default_vehicle_id: values.default_vehicle_id || null
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Fehler beim Erstellen');
        toast.success('Fahrer wurde erstellt.');
        onSuccess?.({
          id: data.id,
          name: data.name,
          role: data.role
        } as DriverWithProfile);
      } else if (initialData) {
        const res = await fetch(`/api/drivers/${initialData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: displayName,
            first_name: values.first_name || null,
            last_name: values.last_name || null,
            phone: values.phone || null,
            role: values.role,
            license_number: values.license_number || null,
            default_vehicle_id: values.default_vehicle_id || null,
            street: values.street || null,
            street_number: values.street_number || null,
            zip_code: values.zip_code || null,
            city: values.city || null,
            lat: values.lat ?? null,
            lng: values.lng ?? null
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Fehler beim Aktualisieren');
        toast.success('Fahrer wurde aktualisiert.');
        onSuccess?.(data as DriverWithProfile);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten.'
      );
    }
  }

  const handleAddressSelect = (
    field: 'street',
    result: AddressResult | string
  ) => {
    if (typeof result === 'string') {
      form.setValue('street', result);
      return;
    }
    if (!result.street) {
      form.setValue('street', result.address);
      return;
    }
    form.setValue('street', result.street || result.address);
    form.setValue('street_number', result.street_number || '');
    form.setValue('zip_code', result.zip_code || '');
    form.setValue('city', result.city || '');
    form.setValue('lat', result.lat ?? null);
    form.setValue('lng', result.lng ?? null);
  };

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(onSubmit)}
      className='space-y-6'
    >
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {/* Create: email + password */}
        {mode === 'create' && (
          <>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='fahrer@beispiel.de'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passwort</FormLabel>
                  <FormControl>
                    <Input type='password' placeholder='••••••••' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name='first_name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vorname</FormLabel>
              <FormControl>
                <Input placeholder='Max' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='last_name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nachname</FormLabel>
              <FormControl>
                <Input placeholder='Mustermann' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {mode === 'edit' && (
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-Mail</FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    placeholder='Nicht hinterlegt'
                    {...field}
                    readOnly
                    className='bg-muted'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name='phone'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefon</FormLabel>
              <FormControl>
                <Input placeholder='+49 123 456789' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='role'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rolle</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Rolle wählen' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='driver'>Fahrer</SelectItem>
                  <SelectItem value='admin'>Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='license_number'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Führerscheinnummer (optional)</FormLabel>
              <FormControl>
                <Input placeholder='B12345678901234' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='default_vehicle_id'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Standard-Fahrzeug (optional)</FormLabel>
              <Select
                onValueChange={(v) =>
                  field.onChange(v === '__none__' ? null : v)
                }
                value={field.value ?? '__none__'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Kein Fahrzeug' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='__none__'>Kein Fahrzeug</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} ({v.license_plate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Address section — same scheme as clients */}
      <div className='space-y-4'>
        <h4 className='text-sm font-medium'>Adresse (optional)</h4>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <FormField
            control={form.control}
            name='street'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Straße</FormLabel>
                <FormControl>
                  <AddressAutocomplete
                    value={field.value ?? ''}
                    onChange={(result: AddressResult | string) => {
                      if (typeof result === 'string') {
                        field.onChange(result);
                      } else {
                        handleAddressSelect('street', result);
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
          <FormField
            control={form.control}
            name='street_number'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hausnummer</FormLabel>
                <FormControl>
                  <Input placeholder='10' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='zip_code'
            render={({ field }) => (
              <FormItem>
                <FormLabel>PLZ</FormLabel>
                <FormControl>
                  <Input placeholder='26122' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='city'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stadt</FormLabel>
                <FormControl>
                  <Input placeholder='Oldenburg' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </Form>
  );
});
