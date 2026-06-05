'use client';

import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';

const REMOVE_VALUE = '__none__';
import { GamificationRepository } from '@/repositories/gamification.repository';
import { UserRepository } from '@/repositories/users.repository';
import { toUserMessage } from '@/lib/api-client';
import type { House, HouseMember } from '@/types/gamification';

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function MemberRow({
  member,
  houses,
  currentHouseId,
  onAssign
}: {
  member: HouseMember;
  houses: House[];
  currentHouseId: string | null;
  onAssign: (userId: string, houseId: string | null) => void;
}) {
  return (
    <div className='flex items-center gap-3 py-2'>
      <Avatar className='size-8 shrink-0'>
        <AvatarFallback className='text-xs'>{initials(member.name)}</AvatarFallback>
      </Avatar>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-medium'>{member.name}</p>
        <p className='text-muted-foreground truncate text-xs capitalize'>{member.role}</p>
      </div>
      <Select
        value={currentHouseId ?? ''}
        onValueChange={(val) => {
          if (val === REMOVE_VALUE) onAssign(member.id, null);
          else if (val) onAssign(member.id, val);
        }}
      >
        <SelectTrigger className='h-7 w-[130px] shrink-0 text-xs'>
          <SelectValue placeholder='Sem casa' />
        </SelectTrigger>
        <SelectContent>
          {currentHouseId && (
            <>
              <SelectItem
                value={REMOVE_VALUE}
                className='text-xs text-destructive focus:text-destructive'
              >
                Remover da casa
              </SelectItem>
              <SelectSeparator />
            </>
          )}
          {houses.map((h) => (
            <SelectItem key={h.id} value={h.id} className='text-xs'>
              {h.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function HouseMembersLoading() {
  return (
    <div className='space-y-2 py-1'>
      {[1, 2].map((i) => (
        <div key={i} className='flex items-center gap-3 py-1'>
          <Skeleton className='size-8 rounded-full' />
          <div className='flex-1 space-y-1'>
            <Skeleton className='h-3 w-32' />
            <Skeleton className='h-3 w-20' />
          </div>
          <Skeleton className='h-7 w-[130px]' />
        </div>
      ))}
    </div>
  );
}

export function HousesTab() {
  const { data: houses, isLoading: housesLoading } = GamificationRepository.useHouses();
  const { data: allUsers, isLoading: usersLoading } = UserRepository.useAll();
  const assignMutation = GamificationRepository.useAssignHouseMember();

  const houseIds = (houses ?? []).map((h) => h.id);
  const houseMemberQueries = GamificationRepository.useAllHouseMembers(houseIds);

  const allHouseMembers = houseMemberQueries.flatMap((q) => q.data ?? []);
  const isHouseMembersLoading = houseMemberQueries.some((q) => q.isLoading);

  const assignedIds = new Set(allHouseMembers.map((m) => m.id));
  const unassignedUsers = (allUsers ?? []).filter((u) => !assignedIds.has(u.id));

  function handleAssign(userId: string, houseId: string | null) {
    assignMutation.mutate(
      { userId, payload: { house_id: houseId } },
      {
        onSuccess: () =>
          toast.success(houseId ? 'Casa atribuída com sucesso!' : 'Membro removido da casa.'),
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  if (housesLoading || usersLoading) {
    return (
      <div className='space-y-4'>
        <div className='grid gap-4 md:grid-cols-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='rounded-xl border p-4 space-y-3'>
              <Skeleton className='h-5 w-24' />
              <HouseMembersLoading />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const allHouses = houses ?? [];

  return (
    <div className='space-y-6'>
      {/* Per-house member lists */}
      <div className='grid gap-4 md:grid-cols-3'>
        {allHouses.map((house, idx) => {
          const members = houseMemberQueries[idx]?.data ?? [];
          const loading = houseMemberQueries[idx]?.isLoading ?? false;

          return (
            <Card key={house.id}>
              <CardHeader className='pb-2 pt-4'>
                <div className='flex items-center justify-between gap-2'>
                  <CardTitle className='text-base'>{house.name}</CardTitle>
                  <Badge variant='secondary' className='tabular-nums'>
                    {house.total_points} pts
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className='pb-4'>
                {loading ? (
                  <HouseMembersLoading />
                ) : members.length === 0 ? (
                  <p className='text-muted-foreground py-2 text-sm'>Nenhum membro nesta casa.</p>
                ) : (
                  <div className='divide-y'>
                    {members.map((m) => (
                      <MemberRow
                        key={m.id}
                        member={m}
                        houses={allHouses}
                        currentHouseId={house.id}
                        onAssign={handleAssign}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Unassigned members */}
      {!isHouseMembersLoading && (
        <Card className='border-dashed'>
          <CardHeader className='pb-2 pt-4'>
            <div className='flex items-center gap-2'>
              <Icons.warning className='size-4 text-amber-500' />
              <CardTitle className='text-base'>Sem Casa</CardTitle>
              {unassignedUsers.length > 0 && (
                <Badge variant='secondary'>{unassignedUsers.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className='pb-4'>
            {unassignedUsers.length === 0 ? (
              <p className='text-muted-foreground text-sm'>
                Todos os membros já estão em uma casa.
              </p>
            ) : (
              <div className='divide-y border rounded-lg px-3'>
                {unassignedUsers.map((user) => (
                  <MemberRow
                    key={user.id}
                    member={{
                      id: user.id,
                      name: user.name,
                      email: user.email,
                      role: user.role,
                      sector: user.sector
                    }}
                    houses={allHouses}
                    currentHouseId={null}
                    onAssign={handleAssign}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
