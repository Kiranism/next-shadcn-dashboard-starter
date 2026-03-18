'use client';

/**
 * Driver create/edit form in a sheet.
 * Create: calls POST /api/drivers/create (email, password, name, phone, role, license_number, default_vehicle_id).
 * Edit: calls driversService.updateDriver + upsertDriverProfile.
 */

import { Button } from '@/components/ui/button';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { useDriverFormStore } from '@/features/drivers/stores/use-driver-form-store';
import { createClient } from '@/lib/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  driversService,
  type UpdateUser
} from '@/features/drivers/api/drivers.service';

const formSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6).optional().or(z.literal('')),
  name: z.string().min(1, { message: 'Name ist erforderlich.' }),
  phone: z.string().optional(),
  role: z.enum(['driver', 'admin']),
  license_number: z.string().optional(),
  default_vehicle_id: z.string().optional().nullable()
});

type FormValues = z.infer<typeof formSchema>;

interface VehicleOption {
  id: string;
  name: string;
  license_plate: string;
}

export function DriverForm() {
  const { isOpen, mode, driver, close, notifySuccess } = useDriverFormStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
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
    if (!isOpen) return;

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
  }, [isOpen]);

  useEffect(() => {
    if (mode === 'edit' && driver) {
      const profile = Array.isArray(driver.driver_profiles)
        ? driver.driver_profiles[0]
        : driver.driver_profiles;
      form.reset({
        email: '', // Not editable
        password: '',
        name: driver.name,
        phone: driver.phone ?? '',
        role: (driver.role as 'driver' | 'admin') ?? 'driver',
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
  }, [mode, driver, form]);

  async function onSubmit(values: FormValues) {
    if (mode === 'create' && (!values.email || !values.password)) {
      toast.error('E-Mail und Passwort sind erforderlich.');
      return;
    }
    try {
      setLoading(true);
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
        notifySuccess();
      } else if (driver) {
        const updates: UpdateUser = {
          name: values.name,
          phone: values.phone || null,
          role: values.role
        };
        await driversService.updateDriver(driver.id, updates);
        if (values.role === 'driver') {
          await driversService.upsertDriverProfile(driver.id, {
            license_number: values.license_number || null,
            default_vehicle_id: values.default_vehicle_id || null
          });
        }
        toast.success('Fahrer wurde aktualisiert.');
        notifySuccess();
      }
      close();
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side='right' className='sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>
            {mode === 'create' ? 'Neuer Fahrer' : 'Fahrer bearbeiten'}
          </SheetTitle>
        </SheetHeader>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='mt-6 flex flex-col gap-4'
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
                      <Input
                        type='password'
                        placeholder='••••••••'
                        {...field}
                      />
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
          <div className='mt-4 flex gap-2'>
            <Button type='button' variant='outline' onClick={close}>
              Abbrechen
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Speichern...
                </>
              ) : (
                'Speichern'
              )}
            </Button>
          </div>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
