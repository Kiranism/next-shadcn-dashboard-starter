'use client';

import React, { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { useApi } from '@/hooks/useApi';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';

interface Court {
  name: string;
  images: string[];
}

function CourtCard({ court }: { court: Court }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>{court.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Carousel className='relative w-full'>
          <CarouselPrevious className='absolute left-2 top-1/2 z-10 -translate-y-1/2' />
          <CarouselContent>
            {court.images.map((image, i) => (
              <CarouselItem key={i}>
                <Image
                  src={image}
                  alt={`Court image ${i}`}
                  width={640}
                  height={360}
                  className='h-auto w-full object-cover'
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselNext className='absolute right-2 top-1/2 z-10 -translate-y-1/2' />
        </Carousel>
      </CardContent>
    </Card>
  );
}

export default function CourtsClientPage() {
  const callApi = useApi();
  const [courts, setCourts] = useState<Court[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const resp = await callApi('/court/', { method: 'GET' });
        if (!resp.ok) {
          throw new Error('Failed to fetch courts');
        }

        const data = await resp.json();
        setCourts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [callApi]);

  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Courts'
            description='List of courts from your account'
          />
        </div>
        <Separator />

        {isLoading && <div className='mt-4 text-sm'>Loading courts...</div>}
        {error && <div className='mt-4 text-sm text-destructive'>{error}</div>}

        {!isLoading && !error && courts.length === 0 && (
          <div className='mt-4'>No courts found.</div>
        )}

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {courts.map((court, idx) => (
            <CourtCard key={`${court.name}-${idx}`} court={court} />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
