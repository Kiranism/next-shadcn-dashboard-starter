'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePosts } from '@/lib/hooks/usePosts';
import Link from 'next/link';

export default function PostsList() {
  const { data: posts, isLoading, isError, error } = usePosts();

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className='overflow-hidden'>
            <CardHeader className='pb-0'>
              <Skeleton className='mb-2 h-6 w-3/4' />
              <Skeleton className='h-4 w-1/2' />
            </CardHeader>
            <CardContent className='py-4'>
              <Skeleton className='h-20 w-full' />
            </CardContent>
            <CardFooter>
              <Skeleton className='h-10 w-full' />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className='bg-destructive/10 rounded-md p-4'>
        <p className='text-destructive font-medium'>
          Error loading posts: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {posts?.map((post) => (
        <Card key={post.id} className='overflow-hidden'>
          <CardHeader className='pb-0'>
            <CardTitle className='line-clamp-1'>{post.title}</CardTitle>
            <CardDescription>User ID: {post.userId}</CardDescription>
          </CardHeader>
          <CardContent className='py-4'>
            <p className='text-muted-foreground line-clamp-3 text-sm'>
              {post.body}
            </p>
          </CardContent>
          <CardFooter>
            <Link href={`/posts/${post.id}`} className='w-full'>
              <Button variant='outline' className='w-full'>
                View Post
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
