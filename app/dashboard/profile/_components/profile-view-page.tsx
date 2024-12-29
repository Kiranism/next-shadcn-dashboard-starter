import PageContainer from '@/components/layout/page-container';
import ProfileCreateForm from './profile-create-form';
import ProfileForm from './profile-form';

export default function ProfileViewPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <ProfileForm />
      </div>
    </PageContainer>
  );
}
