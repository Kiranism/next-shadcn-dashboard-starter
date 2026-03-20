import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PayersPage } from '@/features/payers/components/payers-page';

export const metadata = {
  title: 'Kostenträger',
  description: 'Verwaltung der Kostenträger und Abrechnungsarten'
};

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/sign-in');
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pt-6 md:p-8'>
      <PayersPage />
    </div>
  );
}
