// ============================================================
// Route Handler — Products (list + create)
// ============================================================
// The browser's API for products (called from features/products/api/service.ts).
// Each handler checks auth, then calls the server data layer in
// features/products/api/data.ts. Connect your database or backend there,
// not here.
// ============================================================

import { createProduct, getProducts } from '@/features/products/api/data';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;

  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const categories = searchParams.get('categories') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;

  const data = await getProducts({
    page,
    limit,
    categories,
    search,
    sort
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const data = await createProduct(body);
  return NextResponse.json(data, { status: 201 });
}
