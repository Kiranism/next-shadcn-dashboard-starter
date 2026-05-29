'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/components/providers/session-provider';
import { createProfile, type CreateProfileDto } from '../api/service';
import { toUserMessage } from '@/lib/api-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SECTORS = [
  { value: 'projetos', label: 'Projetos' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'executivo', label: 'Executivo' },
  { value: 'institucional', label: 'Institucional' }
] as const;

export function OnboardingForm() {
  const { session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [sector, setSector] = useState<CreateProfileDto['sector'] | ''>('');
  const [cpf, setCpf] = useState('');

  const mutation = useMutation({
    mutationFn: (dto: CreateProfileDto) => createProfile(session?.access_token ?? '', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('Perfil criado com sucesso! Bem-vindo(a).');
      router.replace('/dashboard/ponto');
    }
  });

  function formatCpf(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sector) return;
    mutation.mutate({ name: name.trim(), sector, cpf: cpf.replace(/\D/g, '') });
  }

  const isValid = name.trim().length >= 1 && sector !== '' && cpf.replace(/\D/g, '').length === 11;

  return (
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle>Complete seu cadastro</CardTitle>
        <CardDescription>Preencha as informações abaixo para acessar o sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Nome completo</Label>
            <Input
              id='name'
              placeholder='Seu nome'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='sector'>Setor</Label>
            <Select
              value={sector}
              onValueChange={(v) => setSector(v as CreateProfileDto['sector'])}
            >
              <SelectTrigger id='sector'>
                <SelectValue placeholder='Selecione seu setor' />
              </SelectTrigger>
              <SelectContent>
                {SECTORS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='cpf'>CPF</Label>
            <Input
              id='cpf'
              placeholder='000.000.000-00'
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              maxLength={14}
              required
            />
          </div>

          {mutation.error && (
            <Alert variant='destructive'>
              <AlertTitle>
                {mutation.error.name === 'NetworkError'
                  ? 'Servidor indisponível'
                  : 'Erro ao criar perfil'}
              </AlertTitle>
              <AlertDescription className='text-xs'>
                {toUserMessage(mutation.error)}
              </AlertDescription>
            </Alert>
          )}

          <Button type='submit' className='w-full' disabled={!isValid || mutation.isPending}>
            {mutation.isPending ? 'Criando perfil...' : 'Entrar no sistema'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
