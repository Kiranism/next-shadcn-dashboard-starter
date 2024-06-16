// components/PhotoShootList.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchPhotoShoots } from '@/app/api/photoShootApi';
import PhotoShootCard from '@/components/cards/photo-shooht-card';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface PhotoShoot {
  id: string;
  title: string;
  author: string;
  coverImage: string;
}

export default function PhotoShootList() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const pageLimit = Number(searchParams.get('limit')) || 10;
  
  const [photoShoots, setPhotoShoots] = useState<PhotoShoot[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPhotoShoots() {
      try {
        setIsLoading(true);
        const data = await fetchPhotoShoots(page, pageLimit);
        setPhotoShoots(data.PhotoShoot);
        setTotalCount(data.total);
        setError(null);
      } catch (err) {
        setError('Error fetching photo shoots');
      } finally {
        setIsLoading(false);
      }
    }
    loadPhotoShoots();
  }, [page, pageLimit]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-start justify-between">
          <Heading
            title={`Photo shoots (${totalCount})`}
            description="Manage photo shoots (Server side table functionalities.)"
          />
          <Link
            href="/dashboard/photoshoot/new"
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link>
        </div>
        <Separator />
        <div className="h-screen overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photoShoots.map((photoShoot) => (
              <PhotoShootCard
                key={photoShoot.id}
                title={photoShoot.title}
                author={photoShoot.author}
                coverImage={photoShoot.coverImage}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
