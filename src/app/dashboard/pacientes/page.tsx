'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconTrash,
  IconStethoscope,
  IconCalendarTime,
  IconFileText
} from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';
import { useState } from 'react';

// Mock data for patients
const mockPatients = [
  {
    id: 1,
    nome: 'Maria Silva Santos',
    cpf: '123.456.789-00',
    telefone: '(11) 99999-8888',
    email: 'maria.silva@email.com',
    dataNascimento: '1985-03-15',
    ultimaConsulta: '2024-09-05',
    status: 'Ativo',
    convenio: 'Unimed'
  },
  {
    id: 2,
    nome: 'João Carlos Oliveira',
    cpf: '987.654.321-00',
    telefone: '(11) 88888-7777',
    email: 'joao.carlos@email.com',
    dataNascimento: '1978-11-22',
    ultimaConsulta: '2024-09-03',
    status: 'Ativo',
    convenio: 'Bradesco Saúde'
  },
  {
    id: 3,
    nome: 'Ana Paula Ferreira',
    cpf: '456.789.123-00',
    telefone: '(11) 77777-6666',
    email: 'ana.paula@email.com',
    dataNascimento: '1992-07-08',
    ultimaConsulta: '2024-08-28',
    status: 'Inativo',
    convenio: 'Particular'
  },
  {
    id: 4,
    nome: 'Roberto Mendes Lima',
    cpf: '789.123.456-00',
    telefone: '(11) 66666-5555',
    email: 'roberto.mendes@email.com',
    dataNascimento: '1965-12-03',
    ultimaConsulta: '2024-09-10',
    status: 'Ativo',
    convenio: 'SulAmérica'
  }
];

export default function PacientesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = mockPatients.filter(
    (patient) =>
      patient.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.cpf.includes(searchTerm) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    return status === 'Ativo' ? (
      <Badge
        variant='default'
        className='border-green-300 bg-green-100 text-green-800'
      >
        {status}
      </Badge>
    ) : (
      <Badge
        variant='secondary'
        className='border-gray-300 bg-gray-100 text-gray-800'
      >
        {status}
      </Badge>
    );
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  return (
    <PageContainer>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Pacientes</h1>
            <p className='text-muted-foreground'>
              Gerencie e acompanhe seus pacientes
            </p>
          </div>
          <Button className='flex items-center gap-2'>
            <IconPlus className='h-4 w-4' />
            Novo Paciente
          </Button>
        </div>

        {/* Stats Cards */}
        <div className='grid gap-4 md:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total de Pacientes
              </CardTitle>
              <IconStethoscope className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{mockPatients.length}</div>
              <p className='text-muted-foreground text-xs'>
                +2 novos neste mês
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Pacientes Ativos
              </CardTitle>
              <IconStethoscope className='h-4 w-4 text-green-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {mockPatients.filter((p) => p.status === 'Ativo').length}
              </div>
              <p className='text-muted-foreground text-xs'>
                {Math.round(
                  (mockPatients.filter((p) => p.status === 'Ativo').length /
                    mockPatients.length) *
                    100
                )}
                % do total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Consultas Agendadas
              </CardTitle>
              <IconCalendarTime className='h-4 w-4 text-blue-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>12</div>
              <p className='text-muted-foreground text-xs'>
                Para os próximos 7 dias
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Prontuários</CardTitle>
              <IconFileText className='h-4 w-4 text-purple-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{mockPatients.length}</div>
              <p className='text-muted-foreground text-xs'>
                100% digitalizados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Pacientes</CardTitle>
            <CardDescription>
              Busque e gerencie todos os pacientes cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='mb-4 flex items-center space-x-2'>
              <div className='relative flex-1'>
                <IconSearch className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
                <Input
                  placeholder='Buscar por nome, CPF ou email...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-8'
                />
              </div>
            </div>

            {/* Patients Table */}
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Convênio</TableHead>
                    <TableHead>Última Consulta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div>
                          <div className='font-medium'>{patient.nome}</div>
                          <div className='text-muted-foreground text-sm'>
                            CPF: {patient.cpf}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {calculateAge(patient.dataNascimento)} anos
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className='text-sm'>{patient.telefone}</div>
                          <div className='text-muted-foreground text-sm'>
                            {patient.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{patient.convenio}</TableCell>
                      <TableCell>
                        {new Date(patient.ultimaConsulta).toLocaleDateString(
                          'pt-BR'
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(patient.status)}</TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' className='h-8 w-8 p-0'>
                              <IconDotsVertical className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem className='flex items-center gap-2'>
                              <IconEye className='h-4 w-4' />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem className='flex items-center gap-2'>
                              <IconEdit className='h-4 w-4' />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className='flex items-center gap-2'>
                              <IconCalendarTime className='h-4 w-4' />
                              Agendar Consulta
                            </DropdownMenuItem>
                            <DropdownMenuItem className='flex items-center gap-2 text-red-600'>
                              <IconTrash className='h-4 w-4' />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredPatients.length === 0 && (
              <div className='py-8 text-center'>
                <p className='text-muted-foreground'>
                  Nenhum paciente encontrado com os critérios de busca.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
