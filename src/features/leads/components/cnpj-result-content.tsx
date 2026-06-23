'use client';

import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { ApiError, toUserMessage } from '@/lib/api-client';
import type { ReceitaWSData } from '@/types/api';

interface CnpjResultContentProps {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: ReceitaWSData | undefined;
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
        {label}
      </span>
      <span className='break-words text-sm'>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className='space-y-2'>
      <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
        {title}
      </p>
      {children}
    </div>
  );
}

export function CnpjResultContent({ isLoading, isError, error, data }: CnpjResultContentProps) {
  const fullAddress = data
    ? [
        `${data.logradouro}, ${data.numero}`,
        data.complemento,
        data.bairro,
        `${data.municipio} - ${data.uf}`,
        data.cep
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground'>
        <Icons.spinner className='size-5 animate-spin' />
        <span className='text-sm'>Consultando CNPJ...</span>
      </div>
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 429) {
      return (
        <div className='flex flex-col items-center gap-3 py-10 text-center'>
          <span className='text-4xl'>😢</span>
          <p className='text-sm text-muted-foreground'>
            A presex não bancou a versão paga da API, o limite estourou — tente novamente em um
            minuto.
          </p>
        </div>
      );
    }
    return (
      <div className='flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
        <Icons.alertCircle className='mt-0.5 size-4 shrink-0' />
        <span>{toUserMessage(error as Error)}</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className='space-y-5'>
      {/* Company header card */}
      <div className='rounded-lg bg-muted px-4 py-3'>
        <p className='break-words text-base font-semibold leading-snug'>{data.nome}</p>
        {data.fantasia && data.fantasia !== '' && (
          <p className='mt-0.5 break-words text-sm text-muted-foreground'>{data.fantasia}</p>
        )}
        <div className='mt-2 flex flex-wrap gap-1.5'>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              data.situacao === 'ATIVA'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {data.situacao}
          </span>
          {data.tipo && (
            <span className='inline-flex items-center rounded-full bg-background px-2.5 py-0.5 text-xs font-medium'>
              {data.tipo}
            </span>
          )}
        </div>
      </div>

      <Separator />

      <Section title='Informações gerais'>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <InfoRow label='Abertura' value={data.abertura} />
          <InfoRow label='Natureza jurídica' value={data.natureza_juridica} />
          <InfoRow label='Capital social' value={data.capital_social} />
        </div>
      </Section>

      {(data.telefone || data.email) && (
        <>
          <Separator />
          <Section title='Contato'>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <InfoRow label='Telefone' value={data.telefone} />
              {data.email && (
                <div className='flex flex-col gap-0.5 sm:col-span-2'>
                  <span className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
                    E-mail
                  </span>
                  <span className='break-all text-sm'>{data.email}</span>
                </div>
              )}
            </div>
          </Section>
        </>
      )}

      {fullAddress && (
        <>
          <Separator />
          <Section title='Endereço'>
            <div className='flex items-start gap-2 text-sm'>
              <Icons.mapPin className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
              <span className='break-words text-muted-foreground'>{fullAddress}</span>
            </div>
          </Section>
        </>
      )}

      {data.atividade_principal && data.atividade_principal.length > 0 && (
        <>
          <Separator />
          <Section title='Atividade principal'>
            <div className='space-y-1'>
              {data.atividade_principal.map((a) => (
                <p key={a.code} className='break-words text-sm'>
                  <span className='font-mono text-xs text-muted-foreground'>{a.code}</span> —{' '}
                  {a.text}
                </p>
              ))}
            </div>
          </Section>
        </>
      )}

      {data.qsa && data.qsa.length > 0 && (
        <>
          <Separator />
          <Section title='Quadro societário'>
            <div className='space-y-1.5'>
              {data.qsa.map((s, i) => (
                <div key={i} className='flex flex-col gap-0.5'>
                  <span className='break-words text-sm font-medium'>{s.nome}</span>
                  <span className='text-xs text-muted-foreground'>{s.qual}</span>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
