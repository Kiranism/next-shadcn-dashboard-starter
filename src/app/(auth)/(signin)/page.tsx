'use server';
import { Metadata } from 'next';
import { SiteConfig } from '@/constants/site-config';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icons from '@/components/ui/icons';
import Image from 'next/image';
import LoginForm from '@/features/auth/components/login-form';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SiteConfig.siteTitle.signIn,
    description: SiteConfig.siteDescription.signIn
  };
}

export default async function Page() {
  return (
    <main className='h-screen bg-gradient-to-br from-orange-550/50 to-orange-600/80'>
      {/* Auth container here */}
      <section className='container flex h-full flex-col items-center justify-center'>
        <div className='flex max-w-screen-md flex-col items-center justify-center gap-4 rounded-lg bg-background p-8 drop-shadow-lg'>
          {/* <p className='text-h4 font-semibold'>Welcome Back</p> */}
          <Image
            src={'/site-logo.svg'}
            height={0}
            width={0}
            alt='Gadget Nova'
            className='w-32'
          />
          <p className='text-h6 font-semibold'>Sign In</p>

          {/* Login form */}
          <LoginForm />

          {/* Registration section */}
          <p className='text-xs text-primary-foreground sm:text-sm'>
            Don&apos;t have an account?
            <Button
              size={'sm'}
              variant={'link'}
              className='text-sm font-semibold text-primary-foreground'
            >
              Register
            </Button>
          </p>

          <p className='text-xs text-primary-foreground sm:text-sm'>
            Or Login with
          </p>
          <div className='flex gap-6 *:size-8'>
            <Icons.google />
            <Icons.fb />
          </div>
        </div>
      </section>
    </main>
  );
}
