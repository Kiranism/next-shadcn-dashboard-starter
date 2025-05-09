'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useUserPosts, useUserTodos } from '@/lib/hooks/useUsers';

interface ProfileProps {
  userId: number;
}

export default function Profile({ userId }: ProfileProps) {
  const { data: user, isLoading: isLoadingUser } = useUser(userId);
  const { data: posts, isLoading: isLoadingPosts } = useUserPosts(userId);
  const { data: todos, isLoading: isLoadingTodos } = useUserTodos(userId);

  if (isLoadingUser) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className='mb-2 h-8 w-1/3' />
          <Skeleton className='h-4 w-1/4' />
        </CardHeader>
        <CardContent>
          <Skeleton className='mb-2 h-4 w-full' />
          <Skeleton className='mb-2 h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>{user.name}</CardTitle>
          <CardDescription>@{user.username}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-2'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <p className='text-sm font-medium'>Email</p>
              <p className='text-muted-foreground text-sm'>{user.email}</p>
            </div>
            <div>
              <p className='text-sm font-medium'>Phone</p>
              <p className='text-muted-foreground text-sm'>{user.phone}</p>
            </div>
            <div>
              <p className='text-sm font-medium'>Website</p>
              <p className='text-muted-foreground text-sm'>{user.website}</p>
            </div>
            <div>
              <p className='text-sm font-medium'>Company</p>
              <p className='text-muted-foreground text-sm'>
                {user.company.name}
              </p>
            </div>
          </div>
          <div>
            <p className='text-sm font-medium'>Address</p>
            <p className='text-muted-foreground text-sm'>
              {user.address.street}, {user.address.suite}, {user.address.city},{' '}
              {user.address.zipcode}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue='posts'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='posts'>Posts ({posts?.length || 0})</TabsTrigger>
          <TabsTrigger value='todos'>Todos ({todos?.length || 0})</TabsTrigger>
        </TabsList>
        <TabsContent value='posts' className='mt-4'>
          {isLoadingPosts ? (
            <div className='space-y-4'>
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader className='pb-2'>
                    <Skeleton className='h-5 w-3/4' />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className='h-16 w-full' />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className='space-y-4'>
              {posts?.slice(0, 5).map((post) => (
                <Card key={post.id}>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-lg'>{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground text-sm'>{post.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value='todos' className='mt-4'>
          {isLoadingTodos ? (
            <div className='space-y-2'>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className='h-10 w-full' />
              ))}
            </div>
          ) : (
            <div className='space-y-2'>
              {todos?.slice(0, 10).map((todo) => (
                <div
                  key={todo.id}
                  className={`rounded-md p-3 ${
                    todo.completed
                      ? 'bg-green-100 dark:bg-green-900/20'
                      : 'bg-amber-100 dark:bg-amber-900/20'
                  }`}
                >
                  <div className='flex items-start gap-2'>
                    <div
                      className={`mt-1.5 h-2 w-2 rounded-full ${
                        todo.completed ? 'bg-green-500' : 'bg-amber-500'
                      }`}
                    />
                    <span>{todo.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
