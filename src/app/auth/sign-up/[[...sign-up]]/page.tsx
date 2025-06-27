import { Metadata } from 'next';
import SignUpViewPage from '@/features/auth/components/sign-up-view';

export const metadata: Metadata = {
  title: 'Authentication | Sign Up',
  description: 'Sign Up page for authentication.'
};

export default async function Page() {
  let stars = 3000; // Default value

  try {
    const response = await fetch(
      'https://api.github.com/repos/kiranism/next-shadcn-dashboard-starter',
      {
        next: { revalidate: 86400 }
      }
    );

    if (response.ok) {
      const data = await response.json();
      stars = data.stargazers_count || stars; // Update stars if API response is valid
    }
  } catch (error) {
    // Error fetching GitHub stars, using default value
  }
  return <SignUpViewPage stars={stars} />;
}
