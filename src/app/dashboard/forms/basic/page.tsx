import { auth } from '@clerk/nextjs/server';
import PageContainer from '@/components/layout/page-container';
import DemoForm from '@/components/forms/demo-form';

export const metadata = {
  title: 'Dashboard: Basic Form'
};

export default async function Page() {
  await auth.protect();

  return (
    <PageContainer
      pageTitle='Basic Form'
      pageDescription='A comprehensive form demo with all field types.'
    >
      <DemoForm />
    </PageContainer>
  );
}
