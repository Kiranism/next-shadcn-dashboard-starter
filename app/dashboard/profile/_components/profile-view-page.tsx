import PageContainer from '@/components/layout/page-container';
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
