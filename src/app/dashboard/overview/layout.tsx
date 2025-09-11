import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import {
  IconTrendingDown,
  IconTrendingUp,
  IconStethoscope,
  IconUserPlus,
  IconCalendarTime,
  IconHeartRateMonitor
} from '@tabler/icons-react';
import React from 'react';

export default function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Painel Médico 🏥
          </h2>
        </div>

        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Pacientes Ativos</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                348
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconStethoscope className='size-3' />
                  <IconTrendingUp />
                  +8.2%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Crescimento no último mês <IconTrendingUp className='size-4' />
              </div>
              <div className='text-muted-foreground'>
                Pacientes em acompanhamento ativo
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Novos Pacientes</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                42
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconUserPlus className='size-3' />
                  <IconTrendingUp />
                  +15.3%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Aumento neste período <IconTrendingUp className='size-4' />
              </div>
              <div className='text-muted-foreground'>
                Novos cadastros na clínica
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Consultas Agendadas</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                156
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconCalendarTime className='size-3' />
                  <IconTrendingUp />
                  +22.1%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Alto volume de agendamentos{' '}
                <IconTrendingUp className='size-4' />
              </div>
              <div className='text-muted-foreground'>
                Consultas nos próximos 30 dias
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Taxa de Adesão</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                89.3%
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconHeartRateMonitor className='size-3' />
                  <IconTrendingUp />
                  +5.7%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Excelente adesão ao tratamento{' '}
                <IconTrendingUp className='size-4' />
              </div>
              <div className='text-muted-foreground'>
                Pacientes seguindo prescrições
              </div>
            </CardFooter>
          </Card>
        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-3'>
            {/* sales arallel routes */}
            {sales}
          </div>
          <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 md:col-span-3'>{pie_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
