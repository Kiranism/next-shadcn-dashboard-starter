import { redirect } from 'next/navigation';

export default function ExclusivePage() {
  redirect('/dashboard/overview');
}
