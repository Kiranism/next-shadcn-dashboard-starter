import { Metadata } from 'next';
import PostsList from './PostsList';

export const metadata: Metadata = {
  title: 'Posts | JSON Placeholder',
  description: 'Example posts page using React Query and JSON Placeholder API'
};

export default function PostsPage() {
  return (
    <div className='container mx-auto py-8'>
      <h1 className='mb-6 text-3xl font-bold'>Posts</h1>
      <PostsList />
    </div>
  );
}
