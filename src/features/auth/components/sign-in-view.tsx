import { SignIn as ClerkSignInForm } from '@clerk/nextjs';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Authentication forms built using the components.'
};

export default function SignInViewPage() {
  return (
    <div className='relative h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-200 via-pink-100 to-pink-200 md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='relative hidden h-full flex-col p-10 text-white lg:flex'>
        <div className='absolute inset-0' />
        <Link
          href='/'
          className='relative z-20 flex items-center text-lg font-medium'
        >
          <div className='mr-3 h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600' />
          <span className='text-2xl font-bold text-gray-900'>SehatYarr</span>
        </Link>
        <div className='relative z-20 mx-auto flex h-full max-w-md items-center justify-center text-center'>
          <blockquote className='space-y-2'>
            <p className='text-lg text-gray-900'>
              &ldquo;This medical application has saved me countless hours of
              work and helped me deliver stunning laashe to my clients faster
              than ever before.&rdquo;
            </p>
            <footer className='text-sm text-gray-700'>Sofia Davis</footer>
          </blockquote>
        </div>
      </div>
      <div className='flex h-full items-center p-4 lg:p-8'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]'>
          <ClerkSignInForm
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'bg-white shadow-lg',
                headerTitle: 'text-gray-900',
                headerSubtitle: 'text-gray-600',
                socialButtonsBlockButton:
                  'bg-white border border-gray-300 hover:bg-gray-50',
                formButtonPrimary:
                  'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
                footerActionLink: 'text-purple-600 hover:text-purple-700',
                formFieldLabel: 'text-gray-700',
                formFieldInput:
                  'bg-white border-gray-300 text-gray-900 focus:border-purple-600 focus:ring-purple-600',
                identityPreviewText: 'text-gray-700',
                identityPreviewEditButton: 'text-purple-600',
                footer: 'bg-white',
                footerAction: 'bg-white',
                footerActionText: 'text-gray-700',
                footerPages: 'bg-white',
                footerPagesLink: 'text-purple-600',
                dividerLine: 'bg-gray-300',
                dividerText: 'text-gray-600',
                socialButtonsProviderIcon: 'text-gray-700',
                formFieldInputShowPasswordButton: 'text-gray-600',
                otpCodeFieldInput: 'border-gray-300 text-gray-900'
              }
            }}
            initialValues={{
              emailAddress: 'your_mail+clerk_test@example.com'
            }}
          />

          <p className='text-muted-foreground px-8 text-center text-sm'>
            By clicking continue, you agree to our{' '}
            <Link
              href='/terms'
              className='underline underline-offset-4 hover:text-purple-600'
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href='/privacy'
              className='underline underline-offset-4 hover:text-purple-600'
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
