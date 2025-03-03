'use client';

import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

interface Tournament {
  id: number;
  name: string;
  description: string;
  images: string[];
  company_id: number;
  start_date: string;
  end_date: string;
  players_number: number;
  full_description?: any; // if needed, or refine
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** A quick way to classify the tournament's status based on current date. */
function getTournamentStatus(
  tourney: Tournament
): 'Ended' | 'Ongoing' | 'Upcoming' {
  const now = new Date();
  const start = new Date(tourney.start_date);
  const end = new Date(tourney.end_date);

  if (end < now) return 'Ended';
  if (start > now) return 'Upcoming';
  return 'Ongoing';
}

/** If your full_description is Lexical data, you can parse it or just skip. */
function renderLexicalDescription(lexicalData: any): JSX.Element | null {
  if (!lexicalData?.root) return null;
  return <>{renderNode(lexicalData.root)}</>;
}

function renderNode(node: any): JSX.Element | string | null {
  if (!node) return null;

  switch (node.type) {
    case 'root':
      return <>{node.children?.map((child: any) => renderNode(child))}</>;
    case 'paragraph':
      return (
        <p key={node.version} className='my-2'>
          {node.children?.map((child: any) => renderNode(child))}
        </p>
      );
    case 'text':
      let element = <>{node.text ?? ''}</>;
      if ((node.format & 1) === 1) element = <strong>{element}</strong>;
      if ((node.format & 2) === 2) element = <em>{element}</em>;
      if ((node.format & 4) === 4) element = <u>{element}</u>;
      if ((node.format & 8) === 8) element = <code>{element}</code>;
      return element;
    default:
      return node.children
        ? node.children.map((child: any) => renderNode(child))
        : null;
  }
}

export default function TournamentsClientPage() {
  const callApi = useApi();

  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const resp = await callApi('/tournament/');
        if (!resp.ok) {
          throw new Error('Failed to fetch tournaments');
        }
        const data = await resp.json();
        setTournaments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [callApi]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col space-y-2'>
          {/* Skeleton row for heading + button */}
          <div className='mb-4 flex items-center justify-between'>
            <Skeleton className='h-6 w-1/3' />
            <Skeleton className='h-8 w-24' />
          </div>

          {/* 3-card grid skeleton */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className='h-6 w-1/2' />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className='h-40 w-full' />
                  <Skeleton className='mt-2 h-4 w-3/4' />
                  <Skeleton className='mt-2 h-4 w-1/2' />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <p className='text-destructive'>{error}</p>
      </PageContainer>
    );
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col space-y-2'>
          <div className='flex items-center justify-between space-y-2'>
            <Heading title='Tournaments' description='Manage tournaments' />
            <Link
              href='/dashboard/tournament/create'
              className='rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
            >
              New Tournament
            </Link>
          </div>
          <Separator />
          <h1 className='mb-2 text-xl font-bold'>No Tournaments Found</h1>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        {/* Title + Button row */}
        <div className='flex items-center justify-between space-y-2'>
          <Heading title='Tournaments' description='Manage tournaments' />
          <Link
            href='/dashboard/tournament/create'
            className='rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
          >
            New Tournament
          </Link>
        </div>
        <Separator />

        {/* Cards in a 3-column grid (responsive) */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {tournaments.map((tourney) => {
            const status = getTournamentStatus(tourney);
            const start = new Date(tourney.start_date);
            const end = new Date(tourney.end_date);
            const lexicalDescription = tourney.full_description
              ? renderLexicalDescription(tourney.full_description)
              : null;

            return (
              <Card key={tourney.id}>
                <CardHeader className='space-y-1'>
                  <CardTitle className='flex items-center justify-between text-lg font-semibold'>
                    {tourney.name}
                    <Badge variant='outline'>{status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tourney.images?.[0] && (
                    <div className='relative mb-3 h-40 w-full overflow-hidden rounded'>
                      <Image
                        src={tourney.images[0]}
                        alt={tourney.name}
                        fill
                        className='object-cover'
                      />
                    </div>
                  )}
                  {tourney.description && (
                    <p className='mb-2 text-sm text-foreground'>
                      {tourney.description}
                    </p>
                  )}
                  <div className='mb-2 flex items-center gap-2 text-sm'>
                    <Users className='h-4 w-4 text-muted-foreground' />
                    <span className='leading-none'>
                      {tourney.players_number} players
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-sm'>
                    <Calendar className='h-4 w-4 text-muted-foreground' />
                    <span className='leading-none text-muted-foreground'>
                      {formatDate(start)} {formatTime(start)} -{' '}
                      {formatDate(end)} {formatTime(end)}
                    </span>
                  </div>
                  {tourney.full_description && (
                    <div className='mt-2'>{lexicalDescription}</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
