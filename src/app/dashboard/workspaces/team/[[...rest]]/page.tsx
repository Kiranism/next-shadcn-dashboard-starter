import { auth } from '@clerk/nextjs/server';
import TeamView from './team-view';

export default async function Page() {
  await auth.protect();
  return <TeamView />;
}
