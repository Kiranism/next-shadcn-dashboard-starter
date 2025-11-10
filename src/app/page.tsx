import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Header from '@/components/landing/header';
import Hero from '@/components/landing/hero';
import Services from '@/components/landing/services';
import Integrations from '@/components/landing/integrations';
import Doctors from '@/components/landing/doctors';
import CTA from '@/components/landing/cta';
import Stats from '@/components/landing/stats';
import Testimonial from '@/components/landing/testimonial';
import Footer from '@/components/landing/footer';

export default async function Page() {
  const { userId } = await auth();

  // If the user is authenticated, go to dashboard.
  if (userId) {
    redirect('/dashboard/overview');
  }

  // Not authenticated: render the landing page (server component)
  return (
    <main className='w-full bg-white'>
      <Header />
      <div className='pt-14 sm:pt-16'>
        <Hero />
        <CTA />
        <Services />
        <Integrations />
        <Doctors />
        <Stats />
        <Testimonial />
        <Footer />
      </div>
    </main>
  );
}
