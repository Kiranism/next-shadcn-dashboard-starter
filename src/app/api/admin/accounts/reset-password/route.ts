/**
 * @file: src/app/api/admin/accounts/reset-password/route.ts
 * @description: Сброс пароля админа (SUPERADMIN only)
 * @project: SaaS Bonus System
 * @dependencies: Prisma, zod, auth utils
 * @created: 2025-09-07
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword, requireAdmin } from '@/lib/auth'

const schema = z.object({ id: z.string().cuid(), newPassword: z.string().min(8).max(72) })

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(['SUPERADMIN'])
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { id, newPassword } = schema.parse(body)

    const passwordHash = await hashPassword(newPassword)
    await db.adminAccount.update({ where: { id }, data: { passwordHash } })
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Bad Request', details: msg }, { status: 400 })
  }
}
