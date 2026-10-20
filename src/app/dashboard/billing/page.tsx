import { auth } from '@clerk/nextjs/server';
import BillingView from './billing-view';

export default async function Page() {
  await auth.protect();
  return <BillingView />;
}
