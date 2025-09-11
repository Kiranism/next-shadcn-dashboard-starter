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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
  IconFileText,
  IconClipboardList,
  IconUser,
  IconCalendar,
  IconChevronRight,
  IconStethoscope
} from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';
import { useState } from 'react';

// Mock data for anamneses
const mockAnamneses = [
  {
    id: 1,
    paciente: 'Maria Silva Santos',
    dataConsulta: '2024-09-10',
    motivo: 'Consulta de rotina - Hipertensão',
    status: 'Completa',
    medico: 'Dr. João Cardiologista'
  },
  {
    id: 2,
    paciente: 'João Carlos Oliveira',
    dataConsulta: '2024-09-08',
    motivo: 'Dor no peito e falta de ar',
    status: 'Em revisão',
    medico: 'Dr. Ana Pneumologista'
  },
  {
    id: 3,
    paciente: 'Ana Paula Ferreira',
    dataConsulta: '2024-09-05',
    motivo: 'Check-up anual',
    status: 'Completa',
    medico: 'Dr. Carlos Clínico Geral'
  }
];

export default function AnamnesesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    paciente: '',
    motivoConsulta: '',
    queixaPrincipal: '',
    historiaDoencaAtual: '',
    antecedentesPessoais: '',
    antecedentesFamiliares: '',
    medicamentosUso: '',
    alergias: '',
    habitosVida: '',
    exameFisico: '',
    hipoteseDiagnostica: '',
    conduta: ''
  });

  const filteredAnamneses = mockAnamneses.filter(
    (anamnese) =>
      anamnese.paciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anamnese.motivo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    return status === 'Completa' ? (
      <Badge
        variant='default'
        className='border-green-300 bg-green-100 text-green-800'
      >
        {status}
      </Badge>
    ) : (
      <Badge
        variant='secondary'
        className='border-yellow-300 bg-yellow-100 text-yellow-800'
      >
        {status}
      </Badge>
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Anamnese data:', formData);
    setShowForm(false);
    // Reset form
    setFormData({
      paciente: '',
      motivoConsulta: '',
      queixaPrincipal: '',
      historiaDoencaAtual: '',
      antecedentesPessoais: '',
      antecedentesFamiliares: '',
      medicamentosUso: '',
      alergias: '',
      habitosVida: '',
      exameFisico: '',
      hipoteseDiagnostica: '',
      conduta: ''
    });
  };

  if (showForm) {
    return (
      <PageContainer>
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                Nova Anamnese
              </h1>
              <p className='text-muted-foreground'>
                Preencha os dados da anamnese médica
              </p>
            </div>
            <Button variant='outline' onClick={() => setShowForm(false)}>
              Voltar à Lista
            </Button>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <IconUser className='h-5 w-5' />
                  Dados do Paciente
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <Label htmlFor='paciente'>Paciente</Label>
                    <Select
                      onValueChange={(value) =>
                        handleInputChange('paciente', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Selecione o paciente' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='maria'>
                          Maria Silva Santos
                        </SelectItem>
                        <SelectItem value='joao'>
                          João Carlos Oliveira
                        </SelectItem>
                        <SelectItem value='ana'>Ana Paula Ferreira</SelectItem>
                        <SelectItem value='roberto'>
                          Roberto Mendes Lima
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor='motivoConsulta'>Motivo da Consulta</Label>
                    <Input
                      id='motivoConsulta'
                      value={formData.motivoConsulta}
                      onChange={(e) =>
                        handleInputChange('motivoConsulta', e.target.value)
                      }
                      placeholder='Ex: Consulta de rotina, dor no peito...'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <IconClipboardList className='h-5 w-5' />
                  História Clínica
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label htmlFor='queixaPrincipal'>Queixa Principal</Label>
                  <Textarea
                    id='queixaPrincipal'
                    value={formData.queixaPrincipal}
                    onChange={(e) =>
                      handleInputChange('queixaPrincipal', e.target.value)
                    }
                    placeholder='Descreva a queixa principal do paciente...'
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor='historiaDoencaAtual'>
                    História da Doença Atual
                  </Label>
                  <Textarea
                    id='historiaDoencaAtual'
                    value={formData.historiaDoencaAtual}
                    onChange={(e) =>
                      handleInputChange('historiaDoencaAtual', e.target.value)
                    }
                    placeholder='Descreva a evolução dos sintomas atuais...'
                    rows={4}
                  />
                </div>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <Label htmlFor='antecedentesPessoais'>
                      Antecedentes Pessoais
                    </Label>
                    <Textarea
                      id='antecedentesPessoais'
                      value={formData.antecedentesPessoais}
                      onChange={(e) =>
                        handleInputChange(
                          'antecedentesPessoais',
                          e.target.value
                        )
                      }
                      placeholder='Doenças anteriores, cirurgias...'
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor='antecedentesFamiliares'>
                      Antecedentes Familiares
                    </Label>
                    <Textarea
                      id='antecedentesFamiliares'
                      value={formData.antecedentesFamiliares}
                      onChange={(e) =>
                        handleInputChange(
                          'antecedentesFamiliares',
                          e.target.value
                        )
                      }
                      placeholder='Histórico familiar de doenças...'
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <IconStethoscope className='h-5 w-5' />
                  Exame e Diagnóstico
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <Label htmlFor='medicamentosUso'>Medicamentos em Uso</Label>
                    <Textarea
                      id='medicamentosUso'
                      value={formData.medicamentosUso}
                      onChange={(e) =>
                        handleInputChange('medicamentosUso', e.target.value)
                      }
                      placeholder='Lista de medicamentos atuais...'
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor='alergias'>Alergias</Label>
                    <Textarea
                      id='alergias'
                      value={formData.alergias}
                      onChange={(e) =>
                        handleInputChange('alergias', e.target.value)
                      }
                      placeholder='Alergias conhecidas...'
                      rows={3}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor='exameFisico'>Exame Físico</Label>
                  <Textarea
                    id='exameFisico'
                    value={formData.exameFisico}
                    onChange={(e) =>
                      handleInputChange('exameFisico', e.target.value)
                    }
                    placeholder='Achados do exame físico...'
                    rows={4}
                  />
                </div>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <Label htmlFor='hipoteseDiagnostica'>
                      Hipótese Diagnóstica
                    </Label>
                    <Textarea
                      id='hipoteseDiagnostica'
                      value={formData.hipoteseDiagnostica}
                      onChange={(e) =>
                        handleInputChange('hipoteseDiagnostica', e.target.value)
                      }
                      placeholder='Principais hipóteses diagnósticas...'
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor='conduta'>Conduta</Label>
                    <Textarea
                      id='conduta'
                      value={formData.conduta}
                      onChange={(e) =>
                        handleInputChange('conduta', e.target.value)
                      }
                      placeholder='Plano de tratamento e acompanhamento...'
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className='flex gap-4'>
              <Button type='submit' className='flex items-center gap-2'>
                <IconFileText className='h-4 w-4' />
                Salvar Anamnese
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Anamneses</h1>
            <p className='text-muted-foreground'>
              Cadastro e revisão de anamneses médicas
            </p>
          </div>
          <Button
            className='flex items-center gap-2'
            onClick={() => setShowForm(true)}
          >
            <IconPlus className='h-4 w-4' />
            Nova Anamnese
          </Button>
        </div>

        {/* Stats Cards */}
        <div className='grid gap-4 md:grid-cols-3'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total de Anamneses
              </CardTitle>
              <IconFileText className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{mockAnamneses.length}</div>
              <p className='text-muted-foreground text-xs'>
                +
                {
                  mockAnamneses.filter((a) => a.dataConsulta >= '2024-09-01')
                    .length
                }{' '}
                neste mês
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Completas</CardTitle>
              <IconClipboardList className='h-4 w-4 text-green-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {mockAnamneses.filter((a) => a.status === 'Completa').length}
              </div>
              <p className='text-muted-foreground text-xs'>
                {Math.round(
                  (mockAnamneses.filter((a) => a.status === 'Completa').length /
                    mockAnamneses.length) *
                    100
                )}
                % concluídas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Em Revisão</CardTitle>
              <IconCalendar className='h-4 w-4 text-yellow-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {mockAnamneses.filter((a) => a.status === 'Em revisão').length}
              </div>
              <p className='text-muted-foreground text-xs'>
                Aguardando revisão médica
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Anamneses</CardTitle>
            <CardDescription>
              Visualize e gerencie todas as anamneses realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='mb-4 flex items-center space-x-2'>
              <div className='relative flex-1'>
                <IconSearch className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
                <Input
                  placeholder='Buscar por paciente ou motivo...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-8'
                />
              </div>
            </div>

            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Data da Consulta</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnamneses.map((anamnese) => (
                    <TableRow key={anamnese.id}>
                      <TableCell className='font-medium'>
                        {anamnese.paciente}
                      </TableCell>
                      <TableCell>
                        {new Date(anamnese.dataConsulta).toLocaleDateString(
                          'pt-BR'
                        )}
                      </TableCell>
                      <TableCell>{anamnese.motivo}</TableCell>
                      <TableCell>{anamnese.medico}</TableCell>
                      <TableCell>{getStatusBadge(anamnese.status)}</TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='flex items-center gap-1'
                        >
                          Ver Detalhes
                          <IconChevronRight className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredAnamneses.length === 0 && (
              <div className='py-8 text-center'>
                <p className='text-muted-foreground'>
                  Nenhuma anamnese encontrada com os critérios de busca.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
