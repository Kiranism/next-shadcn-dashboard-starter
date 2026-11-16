// ============================================================
// Route Handler — Users (list + create)
// ============================================================
// The browser's API for users (called from features/users/api/service.ts).
// Each handler checks auth, then calls the server data layer in
// features/users/api/data.ts. Connect your database or backend there,
// not here.
// ============================================================

import { createUser, getUsers } from '@/features/users/api/data';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;

  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const roles = searchParams.get('roles') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;

  const data = await getUsers({
    page,
    limit,
    roles,
    search,
    sort
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const data = await createUser(body);
  return NextResponse.json(data, { status: 201 });
}
