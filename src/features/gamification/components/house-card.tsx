'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { GamificationRepository } from '@/repositories/gamification.repository';
import type { LeaderboardEntry, PodiumEntry } from '@/types/gamification';

interface MemberWithPoints {
  user_id: string;
  user_name: string;
  points_contributed: number;
  approved_count: number;
}

const HOUSE_LOGOS: Record<string, string> = {
  lumina: '/images/logoHogwatts/logo_lumina.png',
  voltus: '/images/logoHogwatts/logo_voltus.png',
  nexus: '/images/logoHogwatts/logo_nexus.png'
};

function getHouseLogo(name: string): string | null {
  return HOUSE_LOGOS[name.toLowerCase()] ?? null;
}

const PLACE_CONFIG = [
  {
    label: '1º Lugar',
    trophyClass: 'text-yellow-400 dark:text-yellow-300',
    borderClass: 'border-yellow-400 dark:border-yellow-500',
    bgClass: 'bg-yellow-50/60 dark:bg-yellow-950/30',
    pointsClass: 'text-yellow-600 dark:text-yellow-400'
  },
  {
    label: '2º Lugar',
    trophyClass: 'text-slate-400 dark:text-slate-300',
    borderClass: 'border-slate-400 dark:border-slate-500',
    bgClass: '',
    pointsClass: 'text-slate-600 dark:text-slate-300'
  },
  {
    label: '3º Lugar',
    trophyClass: 'text-orange-400 dark:text-orange-300',
    borderClass: 'border-orange-400/70 dark:border-orange-600/60',
    bgClass: '',
    pointsClass: 'text-orange-600 dark:text-orange-400'
  }
] as const;

const MEDAL_EMOJIS = ['🥇', '🥈', '🥉'];

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function MemberSheetRow({ member, rank }: { member: MemberWithPoints; rank: number }) {
  const medal = rank < 3 ? MEDAL_EMOJIS[rank] : null;
  return (
    <div className='flex items-center gap-3 py-2'>
      <span className='w-5 shrink-0 text-center text-sm'>
        {medal ?? <span className='text-muted-foreground'>{rank + 1}</span>}
      </span>
      <Avatar className='size-8 shrink-0'>
        <AvatarFallback className='text-xs'>{initials(member.user_name)}</AvatarFallback>
      </Avatar>
      <p className='min-w-0 flex-1 truncate text-sm font-medium'>{member.user_name}</p>
      <div className='flex items-center gap-2'>
        <Badge variant='secondary' className='tabular-nums text-xs'>
          {member.points_contributed} pts
        </Badge>
        <span className='text-muted-foreground text-xs whitespace-nowrap'>
          {member.approved_count} tarefa{member.approved_count !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

interface HouseCardProps {
  entry: LeaderboardEntry;
  place: 0 | 1 | 2;
}

export function HouseCard({ entry, place }: HouseCardProps) {
  const config = PLACE_CONFIG[place];
  const logo = getHouseLogo(entry.house_name);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: podium, isLoading: podiumLoading } = GamificationRepository.usePodium(
    entry.house_id
  );
  const { data: houseMembers, isLoading: membersLoading } = GamificationRepository.useHouseMembers(
    entry.house_id
  );

  const sheetLoading = podiumLoading || membersLoading;

  // Merge: all house members with their points from podium (default 0)
  const pointsMap = new Map<string, { points: number; count: number }>(
    (podium ?? []).map((p) => [
      p.user_id,
      { points: p.points_contributed, count: p.approved_count }
    ])
  );
  const allMembersRanked: MemberWithPoints[] = (houseMembers ?? [])
    .map((m) => {
      const p = pointsMap.get(m.id);
      return {
        user_id: m.id,
        user_name: m.name,
        points_contributed: p?.points ?? 0,
        approved_count: p?.count ?? 0
      };
    })
    .sort((a, b) => b.points_contributed - a.points_contributed);

  const top3 = allMembersRanked.slice(0, 3);

  return (
    <>
      <Card
        onClick={() => setSheetOpen(true)}
        className={cn(
          'flex flex-col gap-0 cursor-pointer overflow-hidden border-2 transition-shadow hover:shadow-md',
          config.borderClass,
          config.bgClass
        )}
      >
        <CardHeader className='pb-3 pt-5'>
          {logo && (
            <div className='mb-4 flex justify-center'>
              <Image
                src={logo}
                alt={`Logo ${entry.house_name}`}
                width={110}
                height={110}
                className='object-contain drop-shadow-md'
              />
            </div>
          )}

          <div className='flex items-center gap-2'>
            <Icons.trophy className={cn('size-5 shrink-0', config.trophyClass)} />
            <div>
              <h3 className='text-base font-bold leading-tight'>{entry.house_name}</h3>
              <p className='text-muted-foreground text-xs'>{config.label}</p>
            </div>
          </div>

          <div className='mt-4 flex items-baseline gap-1.5'>
            <span
              className={cn(
                'text-5xl font-extrabold tabular-nums leading-none',
                config.pointsClass
              )}
            >
              {entry.total_points.toLocaleString('pt-BR')}
            </span>
            <span className='text-muted-foreground text-sm'>pontos</span>
          </div>
        </CardHeader>

        <CardContent className='pb-5'>
          <p className='text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider'>
            Top Membros
          </p>

          {podiumLoading || membersLoading ? (
            <div className='space-y-2'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='flex items-center justify-between gap-2'>
                  <Skeleton className='h-3 w-32' />
                  <Skeleton className='h-3 w-10' />
                </div>
              ))}
            </div>
          ) : top3.length === 0 ? (
            <p className='text-muted-foreground text-xs'>Nenhum membro nesta casa ainda.</p>
          ) : (
            <ul className='space-y-1.5'>
              {top3.map((member, idx) => (
                <li key={member.user_id} className='flex items-center gap-1.5 text-sm'>
                  <span className='text-base leading-none'>{MEDAL_EMOJIS[idx]}</span>
                  <span className='min-w-0 flex-1 truncate font-medium'>{member.user_name}</span>
                  <span className='text-muted-foreground shrink-0 text-xs font-semibold'>
                    {member.points_contributed} pts
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className='text-muted-foreground mt-3 text-xs text-center'>
            Clique para ver todos os membros
          </p>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className='flex flex-col w-[min(100vw,420px)] sm:max-w-[420px]'>
          <SheetHeader>
            <div className='flex items-center gap-3'>
              {logo && (
                <Image
                  src={logo}
                  alt={`Logo ${entry.house_name}`}
                  width={48}
                  height={48}
                  className='object-contain'
                />
              )}
              <div>
                <SheetTitle>{entry.house_name}</SheetTitle>
                <SheetDescription>
                  {entry.total_points.toLocaleString('pt-BR')} pontos · {config.label}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className='mt-4 flex-1 overflow-y-auto'>
            {sheetLoading ? (
              <div className='space-y-3'>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className='flex items-center gap-3 py-2'>
                    <Skeleton className='size-8 rounded-full' />
                    <div className='flex-1 space-y-1'>
                      <Skeleton className='h-3 w-32' />
                    </div>
                    <Skeleton className='h-5 w-16' />
                  </div>
                ))}
              </div>
            ) : allMembersRanked.length === 0 ? (
              <div className='flex flex-col items-center justify-center gap-3 py-12 text-center'>
                <Icons.usersGroup className='size-10 text-muted-foreground' />
                <p className='text-muted-foreground text-sm'>Nenhum membro nesta casa ainda.</p>
              </div>
            ) : (
              <div className='divide-y'>
                {allMembersRanked.map((member, idx) => (
                  <MemberSheetRow key={member.user_id} member={member} rank={idx} />
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
