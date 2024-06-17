'use client';
import BreadCrumb from '@/components/breadcrumb';
import { PhotoShootForm } from '@/components/forms/photo-shoot-form';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { fetchPhotoShootById } from '@/app/api/photoShootApi';

interface PhotoShoot {
  title: string;
  type: string;
  status: boolean;
  featured: boolean;
  performers: string;
  photographers: string;
  category: string;
  images: string[];
  coverImage: string;
  [key: string]: any; // This allows for additional properties if needed
}

export default function Page() {
  const params = useParams();
  const id = Array.isArray(params.photoshootId) ? params.photoshootId[0] : params.photoshootId;
  const [initialData, setInitialData] = useState<PhotoShoot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id !== 'new') {
      const fetchData = async () => {
        try {
          const data = await fetchPhotoShootById(id);
          setInitialData(data);
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('An unexpected error occurred');
          }
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setLoading(false);
    }
  }, [id]);

  const breadcrumbItems = [
    { title: 'Photoshoot', link: '/dashboard/photoshoot' },
    { title: id === 'new' ? 'Create' : 'Edit', link: `/dashboard/photoshoot/${id}` }
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading photoshoot: {error}</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8">
      <BreadCrumb items={breadcrumbItems} />
      <PhotoShootForm initialData={initialData} />
    </div>
  );
}
