'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';

interface AddressState {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface ViacepAddressFieldsProps {
  values: AddressState;
  onChange: (field: keyof AddressState, value: string) => void;
  disabled?: boolean;
}

interface ViaCepResponse {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export function ViacepAddressFields({ values, onChange, disabled }: ViacepAddressFieldsProps) {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  async function handleCepBlur() {
    const raw = values.cep.replace(/\D/g, '');
    if (raw.length !== 8) return;
    setCepLoading(true);
    setCepError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const data: ViaCepResponse = await res.json();
      if (data.erro) {
        setCepError('CEP não encontrado.');
      } else {
        onChange('logradouro', data.logradouro ?? '');
        onChange('bairro', data.bairro ?? '');
        onChange('cidade', data.localidade ?? '');
        onChange('estado', data.uf ?? '');
      }
    } catch {
      setCepError('Não foi possível consultar o CEP.');
    } finally {
      setCepLoading(false);
    }
  }

  function handleCepChange(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 8);
    onChange('cep', digits);
    if (cepError) setCepError(null);
  }

  return (
    <div className='space-y-3'>
      <p className='text-sm font-medium text-muted-foreground'>Endereço</p>

      {/* CEP */}
      <div className='space-y-1.5'>
        <Label htmlFor='lead-cep'>CEP</Label>
        <div className='relative'>
          <Input
            id='lead-cep'
            value={values.cep}
            onChange={(e) => handleCepChange(e.target.value)}
            onBlur={handleCepBlur}
            placeholder='00000000'
            maxLength={8}
            inputMode='numeric'
            disabled={disabled}
          />
          {cepLoading && (
            <Icons.spinner className='absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground' />
          )}
        </div>
        {cepError && <p className='text-xs text-destructive'>{cepError}</p>}
      </div>

      {/* Logradouro + Número */}
      <div className='grid grid-cols-[1fr_100px] gap-3'>
        <div className='space-y-1.5'>
          <Label htmlFor='lead-logradouro'>Logradouro *</Label>
          <Input
            id='lead-logradouro'
            value={values.logradouro}
            onChange={(e) => onChange('logradouro', e.target.value)}
            placeholder='Rua, Av., etc.'
            disabled={disabled}
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='lead-numero'>Número *</Label>
          <Input
            id='lead-numero'
            value={values.numero}
            onChange={(e) => onChange('numero', e.target.value)}
            placeholder='42'
            disabled={disabled}
          />
        </div>
      </div>

      {/* Complemento */}
      <div className='space-y-1.5'>
        <Label htmlFor='lead-complemento'>Complemento</Label>
        <Input
          id='lead-complemento'
          value={values.complemento}
          onChange={(e) => onChange('complemento', e.target.value)}
          placeholder='Sala 10, Bloco B…'
          disabled={disabled}
        />
      </div>

      {/* Bairro */}
      <div className='space-y-1.5'>
        <Label htmlFor='lead-bairro'>Bairro *</Label>
        <Input
          id='lead-bairro'
          value={values.bairro}
          onChange={(e) => onChange('bairro', e.target.value)}
          placeholder='Nome do bairro'
          disabled={disabled}
        />
      </div>

      {/* Cidade + Estado */}
      <div className='grid grid-cols-[1fr_80px] gap-3'>
        <div className='space-y-1.5'>
          <Label htmlFor='lead-cidade'>Cidade *</Label>
          <Input
            id='lead-cidade'
            value={values.cidade}
            onChange={(e) => onChange('cidade', e.target.value)}
            placeholder='São Paulo'
            disabled={disabled}
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='lead-estado'>UF *</Label>
          <Input
            id='lead-estado'
            value={values.estado}
            onChange={(e) => onChange('estado', e.target.value.toUpperCase().slice(0, 2))}
            placeholder='SP'
            maxLength={2}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
