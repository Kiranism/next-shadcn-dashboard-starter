'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { UserRepository } from '@/repositories/users.repository';
import { EditUserModal } from './edit-user-modal';
import type { UserResponse } from '@/types/api';

const ROLE_LABEL: Record<string, string> = {
  consultor: 'Consultor',
  gerente: 'Gerente',
  diretor: 'Diretor',
  assessor: 'Assessor',
  presidente: 'Presidente'
};

function formatCpf(cpf: string | null) {
  if (!cpf) return '—';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function UsersView() {
  const { rank, isLoading: profileLoading } = useUserProfile();
  const router = useRouter();
  const isSuperuser = rank >= 3;

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    if (!profileLoading && !isSuperuser) {
      router.replace('/dashboard/ponto');
    }
  }, [profileLoading, isSuperuser, router]);

  const { data: users = [], isLoading } = UserRepository.useAll();

  const sectors = useMemo(() => {
    const s = new Set(users.map((u) => u.sector).filter(Boolean) as string[]);
    return Array.from(s).toSorted();
  }, [users]);

  const filtered = useMemo(() => {
    if (!search) return users;
    const term = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (ROLE_LABEL[u.role] ?? u.role).toLowerCase().includes(term) ||
        (u.sector?.toLowerCase().includes(term) ?? false)
    );
  }, [users, search]);

  if (profileLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent' />
      </div>
    );
  }

  if (!isSuperuser) return null;

  return (
    <>
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <CardTitle className='text-base font-semibold'>Usuários</CardTitle>
              {!isLoading && (
                <p className='text-muted-foreground mt-0.5 text-xs'>
                  {filtered.length} {filtered.length === 1 ? 'usuário' : 'usuários'} encontrados
                </p>
              )}
            </div>
            <div className='relative w-full sm:w-56'>
              <Icons.search className='text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2' />
              <Input
                placeholder='Buscar usuário...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='h-8 w-full pl-8 text-sm'
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className='p-0'>
          {isLoading ? (
            <div className='space-y-3 p-6'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className='flex items-center gap-3'>
                  <Skeleton className='size-9 rounded-full' />
                  <div className='flex-1 space-y-1.5'>
                    <Skeleton className='h-4 w-48' />
                    <Skeleton className='h-3 w-64' />
                  </div>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-24' />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className='text-muted-foreground px-6 py-8 text-center text-sm'>
              Nenhum usuário encontrado.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className='hidden md:block'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b'>
                      <th className='text-muted-foreground px-6 py-2.5 text-left text-xs font-medium uppercase tracking-wider'>
                        Usuário
                      </th>
                      <th className='text-muted-foreground px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider'>
                        Email
                      </th>
                      <th className='text-muted-foreground px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider'>
                        CPF
                      </th>
                      <th className='text-muted-foreground px-4 py-2.5 pr-6 text-left text-xs font-medium uppercase tracking-wider'>
                        Cargo / Setor
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-border divide-y'>
                    {filtered.map((user) => (
                      <tr
                        key={user.id}
                        className='hover:bg-muted/30 cursor-pointer transition-colors'
                        aria-label={`Ver detalhes de ${user.name}`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <td className='px-6 py-3.5' aria-label={user.name}>
                          <div className='flex items-center gap-3'>
                            <div className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold'>
                              {getInitials(user.name)}
                            </div>
                            <span className='truncate font-medium'>{user.name}</span>
                          </div>
                        </td>
                        <td className='text-muted-foreground px-4 py-3.5 text-sm'>{user.email}</td>
                        <td className='text-muted-foreground px-4 py-3.5 font-mono text-sm tabular-nums'>
                          {formatCpf(user.cpf)}
                        </td>
                        <td className='px-4 py-3.5 pr-6'>
                          <div className='min-w-0'>
                            <p className='text-sm font-medium'>
                              {ROLE_LABEL[user.role] ?? user.role}
                            </p>
                            {user.sector && (
                              <p className='text-muted-foreground text-xs'>{user.sector}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className='divide-border divide-y md:hidden'>
                {filtered.map((user) => (
                  <button
                    key={user.id}
                    type='button'
                    className='hover:bg-muted/30 w-full px-4 py-3.5 text-left transition-colors'
                    aria-label={`Ver detalhes de ${user.name}`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className='flex min-w-0 items-center gap-3'>
                      <div className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold'>
                        {getInitials(user.name)}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center justify-between gap-2'>
                          <p className='truncate font-medium'>{user.name}</p>
                          <span className='text-muted-foreground shrink-0 text-xs'>
                            {ROLE_LABEL[user.role] ?? user.role}
                          </span>
                        </div>
                        <p className='text-muted-foreground truncate text-xs'>{user.email}</p>
                        {user.sector && (
                          <p className='text-muted-foreground text-xs'>{user.sector}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <EditUserModal user={selectedUser} sectors={sectors} onClose={() => setSelectedUser(null)} />
    </>
  );
}
