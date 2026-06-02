import { z } from 'zod';

export const leadSchema = z.object({
  company_name: z.string().min(1, 'Nome da empresa é obrigatório'),
  status: z.enum(['nao_contatado', 'em_progresso', 'contatado']).optional(),
  interest_items: z.array(z.string()).optional(),
  address_cep: z
    .string()
    .regex(/^\d{8}$/, 'CEP deve ter 8 dígitos')
    .or(z.string().length(0)),
  address_logradouro: z.string().min(1, 'Logradouro é obrigatório'),
  address_numero: z.string().min(1, 'Número é obrigatório'),
  address_complemento: z.string().optional(),
  address_bairro: z.string().min(1, 'Bairro é obrigatório'),
  address_cidade: z.string().min(1, 'Cidade é obrigatória'),
  address_estado: z.string().min(2, 'Estado é obrigatório').max(2)
});

export type LeadFormValues = z.infer<typeof leadSchema>;
