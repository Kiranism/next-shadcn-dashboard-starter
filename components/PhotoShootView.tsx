'use client';

import { FC } from 'react';
import Image from 'next/image';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

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
  [key: string]: any;
}

interface PhotoShootViewProps {
  initialData: PhotoShoot;
}

const PhotoShootView: FC<PhotoShootViewProps> = ({ initialData }) => {
  return (
    <div className="flex-1 space-y-4 p-8">
      <Heading title={initialData.title} description="View photo shoot details" />
      <Separator />
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">Type</h2>
          <p>{initialData.type}</p>
        </div>
        <div>
          <h2 className="text-xl font-bold">Status</h2>
          <p>{initialData.status ? "Active" : "Inactive"}</p>
        </div>
        <div>
          <h2 className="text-xl font-bold">Featured</h2>
          <p>{initialData.featured ? "Yes" : "No"}</p>
        </div>
        <div>
          <h2 className="text-xl font-bold">Performers</h2>
          <p>{initialData.performers}</p>
        </div>
        <div>
          <h2 className="text-xl font-bold">Photographers</h2>
          <p>{initialData.photographers}</p>
        </div>
        <div>
          <h2 className="text-xl font-bold">Category</h2>
          <p>{initialData.category}</p>
        </div>
        <div>
          <h2 className="text-xl font-bold">Cover Image</h2>
          <Image 
            src={initialData.coverImage} 
            alt={initialData.title} 
            width={800} 
            height={600} 
            className="w-full h-auto"
          />
        </div>
        <div>
          <h2 className="text-xl font-bold">Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {initialData.images.map((image, index) => (
              <Image 
                key={index} 
                src={image} 
                alt={`Photo ${index + 1}`} 
                width={400} 
                height={300} 
                className="w-full h-auto" 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoShootView;
