/**
 * @file: src/app/api/admin/accounts/route.ts
 * @description: Управление аккаунтами админов: список и обновление
 * @project: SaaS Bonus System
 * @dependencies: Prisma, zod, auth utils
 * @created: 2025-09-07
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

const updateSchema = z.object({
  id: z.string().cuid(),
  isActive: z.boolean().optional(),
  role: z.enum(['SUPERADMIN', 'ADMIN', 'MANAGER']).optional(),
})

export async function GET() {
  const admin = await requireAdmin(['SUPERADMIN'])
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accounts = await db.adminAccount.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, role: true, isActive: true, createdAt: true }
  })
  return NextResponse.json({ items: accounts })
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(['SUPERADMIN'])
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = updateSchema.parse(body)

    const updated = await db.adminAccount.update({
      where: { id: data.id },
      data: { ...('isActive' in data ? { isActive: data.isActive } : {}), ...('role' in data ? { role: data.role } : {}) },
      select: { id: true, email: true, role: true, isActive: true }
    })

    return NextResponse.json(updated)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Bad Request', details: msg }, { status: 400 })
  }
}
