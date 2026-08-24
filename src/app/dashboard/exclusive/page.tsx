import { auth } from '@clerk/nextjs/server';
import ExclusiveView from './exclusive-view';

export default async function Page() {
  await auth.protect();
  return <ExclusiveView />;
}
