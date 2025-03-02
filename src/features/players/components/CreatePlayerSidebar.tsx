'use client';
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface CreatePlayerSidebarProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePlayerSidebar({
  onClose,
  onSuccess
}: CreatePlayerSidebarProps) {
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use NextAuth to get the token
  const { data: session } = useSession();
  const token = session?.accessToken || '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/player/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nickname,
          gender
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.message || 'Failed to create player');
      }

      // Success
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-card p-4 text-card-foreground shadow'>
      <Button
        variant='ghost'
        onClick={onClose}
        className='mb-2 ml-auto flex items-center space-x-2 p-2'
      >
        <X className='h-4 w-4' />
        <span>Close</span>
      </Button>

      <h2 className='mb-4 text-lg font-semibold'>Create New Player</h2>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label htmlFor='nickname' className='block text-sm font-medium'>
            Nickname
          </label>
          <input
            id='nickname'
            type='text'
            className='mt-1 block w-full rounded border border-input bg-background p-2 text-foreground'
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor='gender' className='block text-sm font-medium'>
            Gender
          </label>
          <select
            id='gender'
            className='mt-1 block w-full rounded border border-input bg-background p-2 text-foreground'
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value='1'>Male</option>
            <option value='2'>Female</option>
          </select>
        </div>

        {error && <div className='text-sm text-destructive'>{error}</div>}

        <Button type='submit' disabled={isLoading} className='w-full'>
          {isLoading ? 'Saving...' : 'Confirm'}
        </Button>
      </form>
    </div>
  );
}
