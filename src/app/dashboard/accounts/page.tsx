/**
 * @file: src/app/dashboard/accounts/page.tsx
 * @description: Управление аккаунтами администраторов
 * @project: SaaS Bonus System
 * @dependencies: React, fetch API, shadcn/ui
 * @created: 2025-09-07
 */

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type Account = { id: string; email: string; role: 'SUPERADMIN' | 'ADMIN' | 'MANAGER'; isActive: boolean }

export default function AccountsPage() {
  const [items, setItems] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/accounts')
      const data = await res.json()
      setItems(data.items ?? [])
    } catch (e) {
      toast.error('Не удалось загрузить аккаунты')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function setActive(id: string, isActive: boolean) {
    try {
      const res = await fetch('/api/admin/accounts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isActive }) })
      if (!res.ok) throw new Error()
      toast.success('Статус обновлён')
      load()
    } catch {
      toast.error('Ошибка при обновлении статуса')
    }
  }

  async function setRole(id: string, role: Account['role']) {
    try {
      const res = await fetch('/api/admin/accounts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, role }) })
      if (!res.ok) throw new Error()
      toast.success('Роль обновлена')
      load()
    } catch {
      toast.error('Ошибка при изменении роли')
    }
  }

  async function resetPassword(id: string) {
    const newPassword = prompt('Новый пароль (мин. 8 символов):')
    if (!newPassword) return
    try {
      const res = await fetch('/api/admin/accounts/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, newPassword }) })
      if (!res.ok) throw new Error()
      toast.success('Пароль обновлён')
    } catch {
      toast.error('Ошибка при сбросе пароля')
    }
  }

  return (
    <div className='container py-8'>
      <h1 className='mb-4 text-2xl font-semibold'>Аккаунты администраторов</h1>
      <div className='rounded-md border'>
        <div className='grid grid-cols-4 gap-2 border-b p-3 text-sm font-medium'>
          <div>Email</div>
          <div>Роль</div>
          <div>Статус</div>
          <div>Действия</div>
        </div>
        {loading ? (
          <div className='p-4 text-sm text-muted-foreground'>Загрузка...</div>
        ) : (
          items.map((a) => (
            <div key={a.id} className='grid grid-cols-4 items-center gap-2 border-b p-3 text-sm'>
              <div>{a.email}</div>
              <div>
                <Select value={a.role} onValueChange={(v) => setRole(a.id, v as Account['role'])}>
                  <SelectTrigger className='w-[160px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='SUPERADMIN'>SUPERADMIN</SelectItem>
                    <SelectItem value='ADMIN'>ADMIN</SelectItem>
                    <SelectItem value='MANAGER'>MANAGER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Button variant={a.isActive ? 'secondary' : 'default'} size='sm' onClick={() => setActive(a.id, !a.isActive)}>
                  {a.isActive ? 'Активен' : 'Заблокирован'}
                </Button>
              </div>
              <div className='flex gap-2'>
                <Button size='sm' variant='outline' onClick={() => resetPassword(a.id)}>Сбросить пароль</Button>
                <Button size='sm' onClick={() => setActive(a.id, !a.isActive)}>{a.isActive ? 'Заблокировать' : 'Разблокировать'}</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
