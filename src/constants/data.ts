import { NavItem } from '@/types';

// Real data types for the consignment system
export type Cliente = {
  cpf: string;
  nomeCompleto: string;
  telefone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
};

export type Proposta = {
  id: number;
  clienteCpf: string;
  clienteNomeCompleto: string;
  status: string;
  banco?: string;
  orgao?: string;
  valorParcela?: number;
  valorLiquido?: number;
  dataProposta: string;
  created_at: string;
  updated_at: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Clientes',
    url: '/dashboard/clientes',
    icon: 'users',
    shortcut: ['c', 'c'],
    isActive: false,
    items: []
  },
  {
    title: 'Propostas',
    url: '/dashboard/propostas',
    icon: 'fileText',
    shortcut: ['p', 'p'],
    isActive: false,
    items: []
  },
  {
    title: 'Kanban',
    url: '/dashboard/kanban',
    icon: 'kanban',
    shortcut: ['k', 'k'],
    isActive: false,
    items: []
  },
  {
    title: 'Conta',
    url: '#',
    icon: 'billing',
    isActive: true,
    items: [
      {
        title: 'Perfil',
        url: '/dashboard/profile',
        icon: 'userPen',
        shortcut: ['m', 'm']
      },
      {
        title: 'Sair',
        shortcut: ['l', 'l'],
        url: '/auth/logout',
        icon: 'login'
      }
    ]
  }
];

// Status configuration for proposals
export const PropostaStatus = {
  AGUARD_DIGITACAO: { label: 'Aguard. Digitação', color: 'warning' },
  AGUARD_LIB_MARGEM: { label: 'Aguard. Lib. Margem', color: 'info' },
  SALDO_PAGO: { label: 'Saldo Pago', color: 'success' },
  AGUARD_CIP: { label: 'Aguard. CIP', color: 'info' },
  CANCELADA: { label: 'Cancelada', color: 'danger' },
  DIGITADO_BANCO: { label: 'Digitado no Banco', color: 'warning' },
  AVERBADO: { label: 'Averbado', color: 'success' },
  PAGO_BANCO: { label: 'Pago pelo Banco', color: 'primary' },
  COMISSAO_PAGA: { label: 'Comissão Paga', color: 'success' },
  PENDENTE: { label: 'Pendente', color: 'warning' },
  INTENCAO_CEF: { label: 'Intenção CEF', color: 'info' },
  AGUARD_ANAL_CEF: { label: 'Aguard. Anal. CEF', color: 'info' },
  CTT_CEF_GERADO: { label: 'CTT CEF Gerado', color: 'info' },
  AVERB_PARCIAL: { label: 'Averb. Parcial', color: 'warning' }
} as const;
