'use client';

import React, { useState, useEffect } from 'react';
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
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Link } from '@/lib/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUploader } from '@/components/file-uploader';
import { SerializedEditorState } from 'lexical';
import { Editor } from '@/components/blocks/editor-00/editor';

// Initial value for editor
const initialEditorValue = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '',
            type: 'text',
            version: 1
          }
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1
      }
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1
  }
} as unknown as SerializedEditorState;

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
  const [editorState, setEditorState] =
    useState<SerializedEditorState>(initialEditorValue);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [playersNumber, setPlayersNumber] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageUploaded, setIsImageUploaded] = useState(false);

  // Handle image upload using the court API
  async function handleImageUpload() {
    if (images.length === 0) {
      toast.error(
        t('pleaseSelectImage', { fallback: 'Please select an image to upload' })
      );
      return;
    }

    try {
      setIsUploading(true);

      // Prepare FormData for image upload
      const formData = new FormData();
      // Use the same field name as court upload API
      for (let i = 0; i < images.length; i++) {
        formData.append('files', images[i], images[i].name);
      }

      // Make API request to upload images
      const response = await callApi('/court/upload_image/', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(
          errorT('failedToUploadImages', {
            fallback: 'Failed to upload images'
          })
        );
      }

      // If the server returns { "image_urls": [...] }, store it
      const data = await response.json();
      const imageUrls = data.image_urls || [];
      setUploadedImageUrls(imageUrls);
      setIsImageUploaded(true);

      toast.success(
        t('imagesUploaded', { fallback: 'Images uploaded successfully' })
      );
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(
        error instanceof Error ? error.message : errorT('somethingWentWrong')
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !description || !startDate || !endDate || !playersNumber) {
      toast.error(t('requiredFields'));
      return;
    }

    if (!isImageUploaded || uploadedImageUrls.length === 0) {
      toast.error(
        t('pleaseUploadImageFirst', {
          fallback:
            'Please upload at least one image before creating the tournament'
        })
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // Create tournament with the expected BE format
      const tournamentData = {
        name: name,
        description: description,
        images: uploadedImageUrls, // Use the uploaded image URLs
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        players_number: parseInt(playersNumber, 10),
        full_description: editorState // Pass the full editor state as the BE expects
      };

      // Make API request
      const response = await callApi('/tournament/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tournamentData)
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
      <div className='flex w-full flex-col space-y-6'>
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

        {!isImageUploaded && (
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              {t('uploadImageFirst', {
                fallback:
                  'You need to upload an image before creating a tournament.'
              })}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className='w-full space-y-8'>
          {/* Image Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t('tournament')} {t('images')}*
              </CardTitle>
              <CardDescription>
                {t('uploadImages', {
                  fallback: 'Upload images for your tournament'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <FileUploader
                  value={images}
                  onValueChange={setImages}
                  maxFiles={1}
                  maxSize={5 * 1024 * 1024}
                  disabled={isUploading || isImageUploaded}
                />

                <div className='flex justify-end'>
                  <Button
                    type='button'
                    onClick={handleImageUpload}
                    disabled={
                      isUploading || images.length === 0 || isImageUploaded
                    }
                  >
                    {isUploading
                      ? t('uploading', { fallback: 'Uploading...' })
                      : t('uploadImage', { fallback: 'Upload Image' })}
                  </Button>
                </div>

                {uploadedImageUrls.length > 0 && (
                  <div className='mt-4 grid grid-cols-1 gap-2'>
                    {uploadedImageUrls.map((url, index) => (
                      <div
                        key={index}
                        className='relative aspect-video w-full rounded-md border bg-muted'
                      >
                        <Image
                          src={url}
                          alt={`${t('tournamentImage', { fallback: 'Tournament image' })} ${index}`}
                          fill
                          sizes='100vw'
                          className='rounded-md object-cover'
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tournament Details Section */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t('tournament')} {t('details')}
              </CardTitle>
              <CardDescription>{commonT('description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
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

                <div className='space-y-2 md:col-span-2'>
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
            </CardContent>
          </Card>

          {/* Full Description Section with Rich Text Editor */}
          <Card>
            <CardHeader>
              <CardTitle>{t('fullDescription')}</CardTitle>
              <CardDescription>
                {t('detailedTournamentDescription', {
                  fallback: 'Provide a detailed description of your tournament'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <Label htmlFor='fullDescription'>{t('fullDescription')}</Label>
                <Editor
                  editorSerializedState={editorState}
                  onSerializedChange={(value) => setEditorState(value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className='flex justify-end space-x-2'>
            <Button
              variant='outline'
              onClick={() => router.push('/dashboard/tournament/overview')}
              disabled={isSubmitting}
            >
              {commonT('cancel')}
            </Button>
            <Button type='submit' disabled={isSubmitting || !isImageUploaded}>
              {isSubmitting
                ? t('creating')
                : `${t('create')} ${t('tournament')}`}
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
