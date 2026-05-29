import { Icons } from '@/components/icons';
import { OnboardingForm } from '@/features/onboarding/components/onboarding-form';
import Link from 'next/link';

export const metadata = { title: 'WattDash — Cadastro' };

export default function OnboardingPage() {
  return (
    <div className='bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10'>
      <div className='flex w-full max-w-md flex-col gap-6'>
        <Link href='/' className='flex items-center gap-2 self-center font-medium'>
          <div className='bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md'>
            <Icons.logo className='size-4' />
          </div>
          WattDash
        </Link>
        <OnboardingForm />
      </div>
    </div>
  );
}
