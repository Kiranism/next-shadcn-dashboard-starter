'use client';

import React, { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useRouter } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import PageContainer from '@/components/layout/page-container';
import { ChevronLeft } from 'lucide-react';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Link } from '@/lib/navigation';

export default function CreateTournamentPage() {
  /**
   * Dashboard translations - available keys:
   * - tournament, create, details, images, fullDescription, startDate, endDate
   * - numberOfPlayers, backTo, uploadImages, dragDrop, etc.
   */
  const t = useTranslations('Dashboard');

  /**
   * Common translations - available keys:
   * - name, description, save, cancel, edit, delete, create, etc.
   */
  const commonT = useTranslations('Common');

  /**
   * Error translations - available keys:
   * - failedToLoad, somethingWentWrong, tryAgainLater, etc.
   */
  const errorT = useTranslations('Errors');

  const router = useRouter();
  const callApi = useApi();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [playersNumber, setPlayersNumber] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !description || !startDate || !endDate || !playersNumber) {
      toast.error(t('requiredFields'));
      return;
    }

    try {
      setIsSubmitting(true);

      // Create FormData for API request
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('full_description', fullDescription);
      formData.append('start_date', new Date(startDate).toISOString());
      formData.append('end_date', new Date(endDate).toISOString());
      formData.append('players_number', playersNumber);

      // Append images if any
      images.forEach((image) => {
        formData.append('images', image);
      });

      // Make API request
      const response = await callApi('/tournament/', {
        method: 'POST',
        body: formData
        // Don't set Content-Type header, browser will set it with boundary for FormData
      });

      if (!response.ok) {
        throw new Error(errorT('failedToLoad'));
      }

      toast.success(commonT('success'));
      router.push('/dashboard/tournament/overview');
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast.error(
        error instanceof Error ? error.message : errorT('somethingWentWrong')
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer scrollable>
      <div className='flex flex-col space-y-6'>
        <div className='flex items-center space-x-2'>
          <Link
            href='/dashboard/tournament/overview'
            className='flex items-center text-sm font-medium text-muted-foreground hover:text-primary'
          >
            <ChevronLeft className='mr-1 h-4 w-4' />
            {t('backTo', { fallback: 'Back to' })}{' '}
            {t('tournament', { fallback: 'Tournament' })}
          </Link>
        </div>

        <div>
          <Heading
            title={`${t('create', { fallback: 'Create' })} ${t('tournament', { fallback: 'Tournament' })}`}
            description={`${t('addNew', { fallback: 'Add New' })} ${t('tournament', { fallback: 'Tournament' }).toLowerCase()} ${commonT('manage', { fallback: 'Manage' }).toLowerCase()}`}
          />
          <Separator className='my-4' />
        </div>

        <form onSubmit={handleSubmit} className='space-y-8'>
          <Card>
            <CardHeader>
              <CardTitle>
                {t('tournament')} {t('details')}
              </CardTitle>
              <CardDescription>{commonT('description')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>
                  {t('tournament')} {commonT('name')}*
                </Label>
                <Input
                  id='name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('enterTournamentName', {
                    fallback: 'Enter tournament name'
                  })}
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='description'>{commonT('description')}*</Label>
                <Textarea
                  id='description'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('briefDescription', {
                    fallback: 'Brief description of the tournament'
                  })}
                  required
                />
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='startDate'>{t('startDate')}*</Label>
                  <Input
                    id='startDate'
                    type='datetime-local'
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='endDate'>{t('endDate')}*</Label>
                  <Input
                    id='endDate'
                    type='datetime-local'
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='playersNumber'>{t('numberOfPlayers')}*</Label>
                <Input
                  id='playersNumber'
                  type='number'
                  value={playersNumber}
                  onChange={(e) => setPlayersNumber(e.target.value)}
                  placeholder={t('enterNumberOfPlayers', {
                    fallback: 'Enter number of players'
                  })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('fullDescription')}</CardTitle>
              <CardDescription>{commonT('description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <Label htmlFor='fullDescription'>{t('fullDescription')}</Label>
                <Textarea
                  id='fullDescription'
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder={t('enterFullDescription', {
                    fallback: 'Enter detailed description of the tournament'
                  })}
                  className='min-h-[200px]'
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {t('tournament')} {t('images')}
              </CardTitle>
              <CardDescription>{t('uploadImages')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='rounded-md border-2 border-dashed border-gray-300 p-6 text-center'>
                <p className='text-sm text-muted-foreground'>{t('dragDrop')}</p>
                <Input
                  id='images'
                  type='file'
                  multiple
                  accept='image/*'
                  className='mt-2'
                  onChange={(e) => {
                    if (e.target.files) {
                      setImages((prev) => [
                        ...prev,
                        ...Array.from(e.target.files || [])
                      ]);
                    }
                  }}
                />
              </div>

              {images.length > 0 && (
                <div className='mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4'>
                  {images.map((file, index) => (
                    <div
                      key={index}
                      className='relative aspect-square rounded-md border bg-muted'
                    >
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`${t('tournamentImage', { fallback: 'Tournament image' })} ${index}`}
                        fill
                        sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                        className='rounded-md object-cover'
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <CardFooter className='flex justify-end space-x-2 border-t p-4'>
            <Button
              variant='outline'
              onClick={() => router.push('/dashboard/tournament/overview')}
              disabled={isSubmitting}
            >
              {commonT('cancel')}
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting
                ? t('creating')
                : `${t('create')} ${t('tournament')}`}
            </Button>
          </CardFooter>
        </form>
      </div>
    </PageContainer>
  );
}
