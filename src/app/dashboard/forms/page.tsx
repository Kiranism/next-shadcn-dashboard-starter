import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Page() {
  await auth.protect();

  redirect('/dashboard/forms/basic');
}
