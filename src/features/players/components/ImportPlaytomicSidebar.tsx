'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/useApi';
// If you have a "toast" utility, import it:
// import { toast } from 'react-hot-toast'; // or whichever toast library you use

interface ImportPlaytomicSidebarProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface PlaytomicUser {
  user_id: string;
  full_name: string;
  gender: string;
  picture: string;
  additional_data?: Array<{
    level_value: number;
  }>;
}

export default function ImportPlaytomicSidebar({
  onClose,
  onSuccess
}: ImportPlaytomicSidebarProps) {
  const callApi = useApi();

  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<PlaytomicUser[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    setError(null);
    setIsSearching(true);
    setResults(null);

    try {
      const resp = await callApi(
        `/player/playtomic-player/?name=${searchText}`
      );
      if (!resp.ok) {
        throw new Error('Failed to search from Playtomic');
      }
      const data = await resp.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleImport(user: PlaytomicUser) {
    try {
      const genderInt = user.gender.toUpperCase() === 'MALE' ? 1 : 2;
      const resp = await callApi('/player/from-playtomic/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.user_id,
          gender: genderInt
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.message || 'Failed to import this user');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
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

      <h2 className='mb-4 text-lg font-semibold'>
        Create Player from Playtomic
      </h2>

      <div className='space-y-2'>
        <label htmlFor='playtomic-search' className='block text-sm font-medium'>
          Search by Name
        </label>
        <input
          id='playtomic-search'
          type='text'
          className='block w-full rounded border border-input bg-background p-2 text-foreground'
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        {error && <div className='text-sm text-destructive'>{error}</div>}

        <Button
          variant='default'
          onClick={handleSearch}
          disabled={!searchText || isSearching}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* SKELETON LOADING */}
      {isSearching && (
        <div className='mt-4 space-y-2'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='flex animate-pulse items-center gap-2 p-2'>
              <div className='h-10 w-10 rounded-full bg-muted'></div>
              <div className='h-4 flex-1 rounded bg-muted'></div>
            </div>
          ))}
        </div>
      )}

      {/* RESULTS */}
      {results && (
        <div className='mt-4 space-y-4 overflow-auto'>
          {results.length === 0 && !isSearching && (
            <div className='text-sm'>No results found.</div>
          )}
          {results.map((user) => {
            const level = user?.additional_data?.[0]?.level_value ?? 0;
            return (
              <div
                key={user.user_id}
                className='flex items-center gap-2 rounded-md border border-input p-2'
              >
                <div className='relative h-10 w-10 overflow-hidden rounded-full bg-muted'>
                  {user.picture && (
                    <Image
                      fill
                      src={user.picture}
                      alt={user.full_name}
                      className='object-cover'
                    />
                  )}
                </div>
                <div className='flex flex-col'>
                  <span className='text-sm font-medium'>{user.full_name}</span>
                  <span className='text-xs text-muted-foreground'>
                    Level: {level.toFixed(2)}
                  </span>
                </div>
                <Button
                  variant='secondary'
                  className='ml-auto'
                  onClick={() => handleImport(user)}
                >
                  Import
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
