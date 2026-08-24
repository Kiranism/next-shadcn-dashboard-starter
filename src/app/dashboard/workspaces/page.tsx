import { auth } from '@clerk/nextjs/server';
import WorkspacesView from './workspaces-view';

export default async function Page() {
  await auth.protect();
  return <WorkspacesView />;
}
