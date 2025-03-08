'use client';

import React, { useState, useEffect, JSX } from 'react';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Users } from 'lucide-react';
import { Link } from '@/lib/navigation';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';

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
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getTournamentStatus(
  tourney: Tournament
): 'Ended' | 'Ongoing' | 'Upcoming' {
  const now = new Date();
  const startDate = new Date(tourney.start_date);
  const endDate = new Date(tourney.end_date);

  if (now < startDate) return 'Upcoming';
  if (now > endDate) return 'Ended';
  return 'Ongoing';
}

function renderLexicalDescription(lexicalData: any): JSX.Element | null {
  if (!lexicalData || !lexicalData.root || !lexicalData.root.children) {
    return null;
  }
  return <>{lexicalData.root.children.map(renderNode)}</>;
}

function renderNode(node: any): JSX.Element | string | null {
  if (!node) return null;

  switch (node.type) {
    case 'paragraph':
      return (
        <p key={Math.random()} className='mb-2'>
          {node.children?.map(renderNode)}
        </p>
      );
    case 'text':
      let text = node.text;
      if (node.format & 1) text = <strong>{text}</strong>; // Bold
      if (node.format & 2) text = <em>{text}</em>; // Italic
      if (node.format & 8) text = <u>{text}</u>; // Underline
      return <React.Fragment key={Math.random()}>{text}</React.Fragment>;
    case 'heading':
      const HeadingTag = `h${node.tag}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag key={Math.random()} className='mb-2 mt-4'>
          {node.children?.map(renderNode)}
        </HeadingTag>
      );
    default:
      return null;
  }
}

export default function TournamentsClientPage() {
  const t = useTranslations('Dashboard');
  const callApi = useApi();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await callApi('/tournament/');

        if (!response.ok) {
          throw new Error('Failed to fetch tournaments');
        }

        const data = await response.json();
        setTournaments(data);
      } catch (err) {
        console.error('Error fetching tournaments:', err);
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, [callApi]);

  const renderTournamentCard = (tournament: Tournament) => {
    const status = getTournamentStatus(tournament);
    const startDate = new Date(tournament.start_date);
    const endDate = new Date(tournament.end_date);

    return (
      <Card key={tournament.id} className='overflow-hidden'>
        <div className='relative h-48 w-full'>
          {tournament.images && tournament.images.length > 0 ? (
            <Image
              src={tournament.images[0]}
              alt={tournament.name}
              fill
              className='object-cover'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-muted'>
              <span className='text-muted-foreground'>No image</span>
            </div>
          )}
          <div className='absolute right-2 top-2'>
            <Badge
              variant={
                status === 'Ongoing'
                  ? 'default'
                  : status === 'Upcoming'
                    ? 'outline'
                    : 'secondary'
              }
            >
              {status}
            </Badge>
          </div>
        </div>
        <CardHeader>
          <CardTitle className='line-clamp-1'>{tournament.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <p className='line-clamp-2 text-sm text-muted-foreground'>
              {tournament.description}
            </p>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Calendar className='h-4 w-4' />
              <span>
                {formatDate(startDate)} - {formatDate(endDate)}
              </span>
            </div>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Users className='h-4 w-4' />
              <span>{tournament.players_number} players</span>
            </div>
            <div className='pt-4'>
              <Link
                href={`/dashboard/tournament/${tournament.id}`}
                className='text-sm font-medium text-primary hover:underline'
              >
                View details
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSkeletonCard = (key: number) => (
    <Card key={key} className='overflow-hidden'>
      <div className='relative h-48 w-full'>
        <Skeleton className='h-full w-full' />
      </div>
      <CardHeader>
        <Skeleton className='h-6 w-3/4' />
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-full' />
          <div className='flex items-center gap-2'>
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-4 w-32' />
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-4 w-24' />
          </div>
          <div className='pt-4'>
            <Skeleton className='h-4 w-24' />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <PageContainer>
      <div className='flex flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <Heading
            title={t('tournament')}
            description='Manage your tournaments'
          />
          <Link
            href='/dashboard/tournament/create'
            className='inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
          >
            Create Tournament
          </Link>
        </div>
        <Separator />

        {error && (
          <div className='rounded-md bg-destructive/15 p-4 text-destructive'>
            <p>{error}</p>
          </div>
        )}

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => renderSkeletonCard(i))
            : tournaments.map(renderTournamentCard)}
        </div>

        {!isLoading && tournaments.length === 0 && !error && (
          <div className='flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center'>
            <h3 className='mb-2 text-lg font-semibold'>No tournaments found</h3>
            <p className='mb-4 text-sm text-muted-foreground'>
              Get started by creating your first tournament
            </p>
            <Link
              href='/dashboard/tournament/create'
              className='inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
            >
              Create Tournament
            </Link>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
