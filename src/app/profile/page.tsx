import { Metadata } from 'next';
import Profile from './Profile';

export const metadata: Metadata = {
  title: 'Profile | JSON Placeholder',
  description: 'Example profile page using React Query and JSON Placeholder API'
};

export default function ProfilePage() {
  return (
    <div className='container mx-auto py-8'>
      <h1 className='mb-6 text-3xl font-bold'>User Profile</h1>
      <Profile userId={1} />
    </div>
  );
}
