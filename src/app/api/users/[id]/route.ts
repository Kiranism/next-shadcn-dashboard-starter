// ============================================================
// Route Handler — Single User (update + delete)
// ============================================================
// Calls the server data layer in features/users/api/data.ts.
// ============================================================

import { deleteUser, updateUser } from '@/features/users/api/data';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const data = await updateUser(Number(id), body);

  if (!data.success) {
    return NextResponse.json(data, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const data = await deleteUser(Number(id));

  if (!data.success) {
    return NextResponse.json(data, { status: 404 });
  }

  return NextResponse.json(data);
}
