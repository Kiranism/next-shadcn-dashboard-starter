import PageContainer from '@/components/layout/page-container';
import ProfileCreateForm from './profile-create-form';

export default function ProfileViewPage() {
  return (
    <PageContainer>
      <div className='space-y-4'>
        <ProfileCreateForm initialData={null} />
      </div>
    </PageContainer>
  );
}
