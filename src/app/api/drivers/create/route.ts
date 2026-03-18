/**
 * POST /api/drivers/create — Create a new driver (auth user + users row + driver_profiles).
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY to call auth.admin.createUser.
 * company_id is taken from the authenticated admin's session.
 */

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';

type CreateDriverBody = {
  email: string;
  password: string;
  name: string;
  phone?: string | null;
  role?: 'driver' | 'admin';
  license_number?: string | null;
  default_vehicle_id?: string | null;
};

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    const serverSupabase = await createServerClient();
    const {
      data: { user: authUser },
      error: sessionError
    } = await serverSupabase.auth.getUser();

    if (sessionError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await serverSupabase
      .from('users')
      .select('company_id')
      .eq('id', authUser.id)
      .single();

    const companyId = adminUser?.company_id;
    if (!companyId) {
      return NextResponse.json(
        { error: 'Admin must belong to a company' },
        { status: 400 }
      );
    }

    const body = (await request.json()) as CreateDriverBody;
    const { email, password, name, phone, role = 'driver' } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'email, password, and name are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: newAuthUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    if (!newAuthUser.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: newAuthUser.user.id,
      name,
      phone: phone ?? null,
      role,
      company_id: companyId,
      is_active: true
    });

    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(newAuthUser.user.id);
      return NextResponse.json(
        { error: `Failed to create user profile: ${userError.message}` },
        { status: 500 }
      );
    }

    if (role === 'driver') {
      const { error: profileError } = await supabaseAdmin
        .from('driver_profiles')
        .insert({
          user_id: newAuthUser.user.id,
          license_number: body.license_number ?? null,
          default_vehicle_id: body.default_vehicle_id ?? null
        });

      if (profileError) {
        await supabaseAdmin
          .from('users')
          .delete()
          .eq('id', newAuthUser.user.id);
        await supabaseAdmin.auth.admin.deleteUser(newAuthUser.user.id);
        return NextResponse.json(
          { error: `Failed to create driver profile: ${profileError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      id: newAuthUser.user.id,
      email: newAuthUser.user.email,
      name,
      role
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
