'use client';

import { motion } from 'framer-motion';
import { Heart, Pill, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { useMedical } from '@/contexts/MedicalContext';

export function MedicationsStep() {
  const { anamnesisData, updateAnamnesisData } = useMedical();

  const handleAddPrescription = () => {
    const newPrescription = {
      medicamento: '',
      dose: '',
      via: '',
      frequencia: '',
      duracao: '',
      orientacoes: ''
    };
    updateAnamnesisData({
      medicamentos: {
        ...anamnesisData.medicamentos,
        prescricaoAtual: [
          ...anamnesisData.medicamentos.prescricaoAtual,
          newPrescription
        ]
      }
    });
  };

  const handlePrescriptionChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const newPrescriptions = [...anamnesisData.medicamentos.prescricaoAtual];
    newPrescriptions[index] = { ...newPrescriptions[index], [field]: value };
    updateAnamnesisData({
      medicamentos: {
        ...anamnesisData.medicamentos,
        prescricaoAtual: newPrescriptions
      }
    });
  };

  const handleRemovePrescription = (index: number) => {
    const newPrescriptions = anamnesisData.medicamentos.prescricaoAtual.filter(
      (_, i) => i !== index
    );
    updateAnamnesisData({
      medicamentos: {
        ...anamnesisData.medicamentos,
        prescricaoAtual: newPrescriptions
      }
    });
  };

  const handleMedicationsInUseChange = (value: string) => {
    updateAnamnesisData({
      medicamentos: {
        ...anamnesisData.medicamentos,
        medicamentosEmUso: value.split('\n').filter(Boolean)
      }
    });
  };

  return (
    <Card className='card-medical p-6 shadow-xl'>
      <CardHeader className='space-y-3'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600'>
            <Pill className='h-5 w-5 text-white' />
          </div>
          <div>
            <CardTitle className='text-xl font-bold text-slate-900 dark:text-white'>
              Medicamentos
            </CardTitle>
            <CardDescription className='text-slate-600 dark:text-slate-400'>
              Prescrições e orientações médicas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-8'>
        {/* Medicamentos em Uso */}
        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <Heart className='h-5 w-5 text-red-500' />
            <Label className='text-lg font-semibold text-slate-700 dark:text-slate-300'>
              Medicamentos em Uso Atual
            </Label>
          </div>
          <Textarea
            placeholder={`Liste os medicamentos que o paciente já utiliza, um por linha:\nEx: Losartana 50mg - 1x ao dia\nMetformina 850mg - 2x ao dia\nSinvastatina 20mg - 1x à noite`}
            value={anamnesisData.medicamentos.medicamentosEmUso.join('\n')}
            onChange={(e) => handleMedicationsInUseChange(e.target.value)}
            className='input-medical min-h-[120px] border-slate-300 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/50'
            aria-label='Medicamentos em uso atual'
          />
        </div>

        <div className='border-t border-slate-200 dark:border-slate-700'></div>

        {/* Nova Prescrição */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Zap className='h-5 w-5 text-blue-500' />
              <Label className='text-lg font-semibold text-slate-700 dark:text-slate-300'>
                Nova Prescrição
              </Label>
            </div>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={handleAddPrescription}
              className='gap-2 border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800'
            >
              <Pill className='h-4 w-4' />
              Adicionar Medicamento
            </Button>
          </div>

          {anamnesisData.medicamentos.prescricaoAtual.length === 0 ? (
            <div className='rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-600'>
              <Pill className='mx-auto h-12 w-12 text-slate-400' />
              <p className='mt-2 text-sm text-slate-500 dark:text-slate-400'>
                Nenhum medicamento prescrito
              </p>
              <p className='text-xs text-slate-400 dark:text-slate-500'>
                Clique em &quot;Adicionar Medicamento&quot; para começar
              </p>
            </div>
          ) : (
            <div className='space-y-6'>
              {anamnesisData.medicamentos.prescricaoAtual.map(
                (prescription, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='rounded-lg border border-slate-200/60 bg-white/30 p-4 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-800/30'
                  >
                    <div className='mb-4 flex items-center justify-between'>
                      <Badge
                        variant='outline'
                        className='gap-1 border-slate-300 dark:border-slate-600'
                      >
                        <Pill className='h-3 w-3' />
                        Medicamento {index + 1}
                      </Badge>
                      <Button
                        type='button'
                        size='sm'
                        variant='ghost'
                        onClick={() => handleRemovePrescription(index)}
                        className='text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20'
                        aria-label={`Remover medicamento ${index + 1}`}
                      >
                        <span className='sr-only'>Remover medicamento</span>×
                      </Button>
                    </div>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <Label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                          Medicamento
                        </Label>
                        <Input
                          placeholder='Ex: Dipirona Sódica'
                          value={prescription.medicamento}
                          onChange={(e) =>
                            handlePrescriptionChange(
                              index,
                              'medicamento',
                              e.target.value
                            )
                          }
                          className='input-medical border-slate-300 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/50'
                          aria-label={`Nome do medicamento ${index + 1}`}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                          Dose
                        </Label>
                        <Input
                          placeholder='Ex: 500mg'
                          value={prescription.dose}
                          onChange={(e) =>
                            handlePrescriptionChange(
                              index,
                              'dose',
                              e.target.value
                            )
                          }
                          className='input-medical border-slate-300 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/50'
                          aria-label={`Dose do medicamento ${index + 1}`}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                          Via de Administração
                        </Label>
                        <Input
                          placeholder='Ex: Oral, EV, IM, SC'
                          value={prescription.via}
                          onChange={(e) =>
                            handlePrescriptionChange(
                              index,
                              'via',
                              e.target.value
                            )
                          }
                          className='input-medical border-slate-300 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/50'
                          aria-label={`Via de administração do medicamento ${index + 1}`}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                          Frequência
                        </Label>
                        <Input
                          placeholder='Ex: 1x ao dia, 8/8h, SOS'
                          value={prescription.frequencia}
                          onChange={(e) =>
                            handlePrescriptionChange(
                              index,
                              'frequencia',
                              e.target.value
                            )
                          }
                          className='input-medical border-slate-300 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/50'
                          aria-label={`Frequência do medicamento ${index + 1}`}
                        />
                      </div>
                      <div className='space-y-2 md:col-span-2'>
                        <Label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                          Duração do Tratamento
                        </Label>
                        <Input
                          placeholder='Ex: 7 dias, 30 dias, Uso contínuo'
                          value={prescription.duracao}
                          onChange={(e) =>
                            handlePrescriptionChange(
                              index,
                              'duracao',
                              e.target.value
                            )
                          }
                          className='input-medical border-slate-300 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/50'
                          aria-label={`Duração do tratamento do medicamento ${index + 1}`}
                        />
                      </div>
                      <div className='space-y-2 md:col-span-2'>
                        <Label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                          Orientações Especiais
                        </Label>
                        <Textarea
                          placeholder='Ex: Tomar com alimentos, Não ingerir álcool durante o tratamento...'
                          value={prescription.orientacoes}
                          onChange={(e) =>
                            handlePrescriptionChange(
                              index,
                              'orientacoes',
                              e.target.value
                            )
                          }
                          className='input-medical min-h-[80px] border-slate-300 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/50'
                          aria-label={`Orientações especiais do medicamento ${index + 1}`}
                        />
                      </div>
                    </div>
                  </motion.div>
                )
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
