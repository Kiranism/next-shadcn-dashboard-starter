import PageContainer from '@/components/layout/page-container';
import DemoForm from '@/components/forms/demo-form';

export const metadata = {
  title: 'Dashboard: Basic Form'
};

export default function Page() {
  return (
    <PageContainer
      scrollable
      pageTitle='Basic Form'
      pageDescription='A comprehensive form demo with all field types.'
    >
      <DemoForm />
    </PageContainer>
  );
}
