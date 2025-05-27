'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { useGetAdminSettings } from '@/hooks/useQuery';
import { useUpdateAdminSettings } from '@/hooks/useMutation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const { data, isLoading, isError, error, refetch } = useGetAdminSettings();
  const { mutate: updateSettings, isPending } = useUpdateAdminSettings();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string | number | ''>('');

  useEffect(() => {
    if (data?.data && editingField) {
      switch (editingField) {
        case 'FeaturedJobPricePerWeek':
          setInputValue(data.data.FeaturedJobPricePerWeek);
          break;
        case 'ProMemberPricePerWeek':
          setInputValue(data.data.ProMemberPricePerWeek);
          break;
        case 'TrialEndsAt':
          setInputValue(
            new Date(data.data.TrialEndsAt).toISOString().split('T')[0]
          );
          break;
        default:
          setInputValue('');
      }
    }
  }, [data, editingField]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col space-y-4'>
          <Skeleton className='h-10 w-1/2' />
          <Skeleton className='h-4 w-1/4' />
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-1/3' />
            </CardHeader>
            <CardContent className='space-y-2'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-full' />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col text-red-500'>
          Error: {error?.message || 'Failed to load admin settings.'}
        </div>
      </PageContainer>
    );
  }

  const handleEditClick = (field: string, currentValue: string | number) => {
    setEditingField(field);
    setInputValue(currentValue);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue === '') {
      toast.error('Field cannot be empty.');
      return;
    }

    let payload: { [key: string]: any } = {};
    if (editingField === 'FeaturedJobPricePerWeek') {
      payload = { FeaturedJobPricePerWeek: Number(inputValue) };
    } else if (editingField === 'ProMemberPricePerWeek') {
      payload = { ProMemberPricePerWeek: Number(inputValue) };
    } else if (editingField === 'TrialEndsAt') {
      payload = { TrialEndsAt: new Date(inputValue as string).toISOString() };
    }

    updateSettings(payload, {
      onSuccess: () => {
        toast.success('Admin settings updated successfully.');
        setIsModalOpen(false);
        setEditingField(null); // Clear editing field
        setInputValue(''); // Clear input value
        refetch(); // Refetch settings to display updated values
      },
      onError: (err) => {
        toast.error(
          err.response?.data?.message || 'Failed to update settings.'
        );
      }
    });
  };

  const adminSettings = data?.data;

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col'>
        <h1 className='mb-6 text-3xl font-bold'>Admin Settings</h1>
        {adminSettings ? (
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setting</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className='font-medium'>
                    Featured Job Price Per Week
                  </TableCell>
                  <TableCell>
                    ${adminSettings.FeaturedJobPricePerWeek}
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button
                      onClick={() =>
                        handleEditClick(
                          'FeaturedJobPricePerWeek',
                          adminSettings.FeaturedJobPricePerWeek
                        )
                      }
                      size='sm'
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className='font-medium'>
                    Pro Member Price Per Week
                  </TableCell>
                  <TableCell>${adminSettings.ProMemberPricePerWeek}</TableCell>
                  <TableCell className='text-right'>
                    <Button
                      onClick={() =>
                        handleEditClick(
                          'ProMemberPricePerWeek',
                          adminSettings.ProMemberPricePerWeek
                        )
                      }
                      size='sm'
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className='font-medium'>Trial Ends At</TableCell>
                  <TableCell>
                    {new Date(adminSettings.TrialEndsAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button
                      onClick={() =>
                        handleEditClick(
                          'TrialEndsAt',
                          new Date(adminSettings.TrialEndsAt)
                            .toISOString()
                            .split('T')[0]
                        )
                      }
                      size='sm'
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <p>No admin settings found.</p>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className='sm:max-w-[425px]'>
            <DialogHeader>
              <DialogTitle>Edit Admin Settings</DialogTitle>
              <DialogDescription>
                Make changes to admin settings here. Click save when you&apos;re
                done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className='grid gap-4 py-4'>
              {editingField === 'FeaturedJobPricePerWeek' && (
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='featuredJobPrice' className='text-right'>
                    Featured Job Price
                  </Label>
                  <Input
                    id='featuredJobPrice'
                    type='number'
                    value={inputValue}
                    onChange={(e) => setInputValue(Number(e.target.value))}
                    className='col-span-3'
                  />
                </div>
              )}
              {editingField === 'ProMemberPricePerWeek' && (
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='proMemberPrice' className='text-right'>
                    Pro Member Price
                  </Label>
                  <Input
                    id='proMemberPrice'
                    type='number'
                    value={inputValue}
                    onChange={(e) => setInputValue(Number(e.target.value))}
                    className='col-span-3'
                  />
                </div>
              )}
              {editingField === 'TrialEndsAt' && (
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='trialEndsAt' className='text-right'>
                    Trial Ends At
                  </Label>
                  <Input
                    id='trialEndsAt'
                    type='date'
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className='col-span-3'
                  />
                </div>
              )}
              <DialogFooter>
                <Button type='submit' disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
