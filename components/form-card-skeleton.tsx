import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Skeleton } from './ui/skeleton';

export default function FormCardSkeleton() {
  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <Skeleton className="h-8 w-48" /> {/* Title */}
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Image upload area skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-4 w-16" /> {/* Label */}
            <Skeleton className="h-32 w-full rounded-lg" /> {/* Upload area */}
          </div>

          {/* Grid layout for form fields */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Product Name field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Input */}
            </div>

            {/* Category field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Select */}
            </div>

            {/* Price field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Input */}
            </div>
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" /> {/* Label */}
            <Skeleton className="h-32 w-full" /> {/* Textarea */}
          </div>

          {/* Submit button */}
          <Skeleton className="h-10 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}
