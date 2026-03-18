'use client';

/**
 * Driver form body — shared form fields for create/edit.
 * Used in DriverForm (sheet) and DriverDetailPanel (panel).
 * Exposes submit via forwardRef and onDirtyChange for header button.
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
import {
  driversService,
  type UpdateUser
} from '@/features/drivers/api/drivers.service';
import type { DriverWithProfile } from '@/features/drivers/types';

export const driverFormSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6).optional().or(z.literal('')),
  name: z.string().min(1, { message: 'Name ist erforderlich.' }),
  phone: z.string().optional(),
  role: z.enum(['driver', 'admin']),
  license_number: z.string().optional(),
  default_vehicle_id: z.string().optional().nullable()
});

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
      name: '',
      phone: '',
      role: 'driver',
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
        : initialData.driver_profiles;
      form.reset({
        email: '',
        password: '',
        name: initialData.name,
        phone: initialData.phone ?? '',
        role: (initialData.role as 'driver' | 'admin') ?? 'driver',
        license_number: profile?.license_number ?? '',
        default_vehicle_id: profile?.default_vehicle_id ?? null
      });
    } else {
      form.reset({
        email: '',
        password: '',
        name: '',
        phone: '',
        role: 'driver',
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
    try {
      if (mode === 'create') {
        const res = await fetch('/api/drivers/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: values.email,
            password: values.password,
            name: values.name,
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
        const updates: UpdateUser = {
          name: values.name,
          phone: values.phone || null,
          role: values.role
        };
        const saved = await driversService.updateDriver(
          initialData.id,
          updates
        );
        if (values.role === 'driver') {
          await driversService.upsertDriverProfile(initialData.id, {
            license_number: values.license_number || null,
            default_vehicle_id: values.default_vehicle_id || null
          });
        }
        toast.success('Fahrer wurde aktualisiert.');
        onSuccess?.(saved);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten.'
      );
    }
  }

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(onSubmit)}
      className='space-y-4'
    >
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
        name='name'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder='Max Mustermann' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
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
              onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
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
    </Form>
  );
});
