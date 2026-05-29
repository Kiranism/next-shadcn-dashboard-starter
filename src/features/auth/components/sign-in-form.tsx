'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { GoogleAuthButton } from './google-auth-button';

export function SignInForm() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (!error) return;

    const MESSAGES: Record<string, string> = {
      access_denied:
        'Acesso negado pelo Google. Verifique se seu e-mail está na lista de usuários autorizados.',
      no_code: 'Nenhum código de autenticação recebido. Tente novamente.',
      exchange_failed: 'Falha ao trocar o código de autenticação.'
    };

    const message = MESSAGES[error] ?? 'Falha no login com Google.';
    toast.error(message);
  }, [searchParams]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl'>Entrar</CardTitle>
        <CardDescription>Use sua conta Google para acessar o sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleAuthButton />
      </CardContent>
    </Card>
  );
}
