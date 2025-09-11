import { redirect } from 'next/navigation';

export default async function Page() {
  // Sem autenticação: levar direto ao overview do dashboard
  redirect('/dashboard/overview');
}
