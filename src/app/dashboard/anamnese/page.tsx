'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  User,
  MessageSquare,
  History,
  Stethoscope,
  Pill,
  FileText,
  CheckCircle,
  Circle,
  Download,
  Copy,
  RotateCcw,
  Heart,
  Brain,
  Thermometer,
  Activity,
  Zap,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useMedical } from '@/contexts/MedicalContext';
import { toast } from 'sonner';

type Step =
  | 'patient'
  | 'complaint'
  | 'history'
  | 'exam'
  | 'medications'
  | 'preview';

interface StepConfig {
  id: Step;
  label: string;
  icon: any;
  description: string;
  color: string;
}

export default function AnamnesePage() {
  const [currentStep, setCurrentStep] = useState<Step>('patient');
  const {
    anamnesisData,
    medicalColors,
    exportAnamnese,
    validateData,
    resetAnamnese,
    updateNestedAnamnesisData
  } = useMedical();

  const steps: StepConfig[] = [
    {
      id: 'patient',
      label: 'Dados do Paciente',
      icon: User,
      description: 'Informações básicas anônimas',
      color: medicalColors.primary
    },
    {
      id: 'complaint',
      label: 'Queixa Principal',
      icon: MessageSquare,
      description: 'HDA e sintomas atuais',
      color: medicalColors.warning
    },
    {
      id: 'history',
      label: 'História Médica',
      icon: History,
      description: 'Antecedentes e comorbidades',
      color: medicalColors.neurology
    },
    {
      id: 'exam',
      label: 'Exame Físico',
      icon: Stethoscope,
      description: 'Sinais vitais e exame',
      color: medicalColors.cardiology
    },
    {
      id: 'medications',
      label: 'Medicamentos',
      icon: Pill,
      description: 'Prescrições e orientações',
      color: medicalColors.success
    },
    {
      id: 'preview',
      label: 'Revisão Final',
      icon: FileText,
      description: 'Revisão e exportação',
      color: medicalColors.gastro
    }
  ];

  const isStepCompleted = (stepId: Step): boolean => {
    switch (stepId) {
      case 'patient':
        return !!(
          anamnesisData?.paciente?.faixaEtaria &&
          anamnesisData?.paciente?.sexoBiologico
        );
      case 'complaint':
        return !!(
          anamnesisData?.queixaPrincipal?.queixaPrincipal?.trim() &&
          anamnesisData?.queixaPrincipal?.duracaoSintomas?.trim()
        );
      case 'history':
        return !!(
          anamnesisData?.historicoMedico?.comorbidades?.length ||
          anamnesisData?.historicoMedico?.medicamentosUso?.length ||
          anamnesisData?.historicoMedico?.alergias?.length
        );
      case 'exam':
        return !!(
          anamnesisData?.exameFisico?.sinaisVitais?.pa ||
          anamnesisData?.exameFisico?.sinaisVitais?.fc ||
          anamnesisData?.exameFisico?.exameFisico?.aspectoGeral
        );
      case 'medications':
        return !!anamnesisData?.medicamentos?.prescricaoAtual?.length;
      case 'preview':
        return validateData();
      default:
        return false;
    }
  };

  const getCurrentStepIndex = () =>
    steps.findIndex((step) => step.id === currentStep);

  const getProgressPercentage = () => {
    const completedSteps = steps.filter((step) =>
      isStepCompleted(step.id)
    ).length;
    return (completedSteps / steps.length) * 100;
  };

  const canProceedToNext = () => {
    return isStepCompleted(currentStep) || currentStep === 'preview';
  };

  const handleNext = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleStepClick = (stepId: Step) => {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    const currentIndex = getCurrentStepIndex();

    // Pode navegar para trás ou para próximo step se o atual estiver completo
    if (
      stepIndex <= currentIndex ||
      (stepIndex === currentIndex + 1 && canProceedToNext())
    ) {
      setCurrentStep(stepId);
    }
  };

  const handleExport = async () => {
    try {
      const anamnesisText = exportAnamnese();

      // Tentar usar a API de clipboard moderna
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(anamnesisText);
        toast.success('Anamnese copiada para a área de transferência!');
      } else {
        // Fallback para navegadores antigos
        const textArea = document.createElement('textarea');
        textArea.value = anamnesisText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success('Anamnese copiada!');
      }
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast.error('Erro ao copiar anamnese');
    }
  };

  const handleDownload = () => {
    try {
      const anamnesisText = exportAnamnese();
      const blob = new Blob([anamnesisText], {
        type: 'text/plain;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const patientId = anamnesisData.paciente?.id?.slice(-8) || 'novo';
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `anamnese_${patientId}_${timestamp}.txt`;
      link.href = url;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Anamnese baixada com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar:', error);
      toast.error('Erro ao baixar anamnese');
    }
  };

  const handleReset = () => {
    resetAnamnese();
    setCurrentStep('patient');
    toast.success('Nova anamnese iniciada');
  };

  const renderStepContent = () => {
    const contentVariants = {
      hidden: { opacity: 0, x: 20 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 }
    };

    return (
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentStep}
          variants={contentVariants}
          initial='hidden'
          animate='visible'
          exit='exit'
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className='w-full'
        >
          {(() => {
            switch (currentStep) {
              case 'patient':
                return <PatientDataStep />;
              case 'complaint':
                return <ChiefComplaintStep />;
              case 'history':
                return <MedicalHistoryStep />;
              case 'exam':
                return <PhysicalExamStep />;
              case 'medications':
                return <MedicationsStep />;
              case 'preview':
                return <PreviewStep />;
              default:
                return <PatientDataStep />;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  const currentStepConfig = steps.find((step) => step.id === currentStep);
  const progressPercentage = getProgressPercentage();

  return (
    <div className='flex min-h-screen w-full flex-col bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900'>
      {/* Modern Header com Progress Premium */}
      <motion.header
        className='border-b border-slate-200/60 bg-white/80 shadow-xl shadow-blue-500/5 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Top Header Bar */}
        <div className='w-full px-6 py-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            {/* Title Section */}
            <div className='flex items-center gap-4'>
              <motion.div
                className='rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 shadow-lg'
                whileHover={{ scale: 1.05, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
              >
                <Stethoscope className='h-6 w-6 text-white' />
              </motion.div>
              <div>
                <h1 className='text-xl font-bold text-slate-900 sm:text-2xl lg:text-3xl dark:text-white'>
                  Nova Anamnese
                </h1>
                <p className='mt-1 text-sm text-slate-600 sm:text-base dark:text-slate-400'>
                  Preencha os campos para gerar a anamnese do paciente
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className='flex items-center gap-2 sm:gap-3'>
              <Badge
                variant='outline'
                className='gap-1.5 border-slate-300 bg-white/50 text-xs sm:text-sm dark:border-slate-600 dark:bg-slate-800/50'
              >
                <Clock className='h-3 w-3 sm:h-4 sm:w-4' />
                {anamnesisData.paciente?.timestamp
                  ? new Date(
                      anamnesisData.paciente.timestamp
                    ).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Nova'}
              </Badge>

              <Button
                variant='ghost'
                size='sm'
                onClick={handleReset}
                className='gap-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              >
                <RotateCcw className='h-4 w-4' />
                <span className='hidden sm:inline'>Nova Anamnese</span>
                <span className='sm:hidden'>Nova</span>
              </Button>
            </div>
          </div>

          {/* Progress Section */}
          <div className='mt-6 space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-semibold tracking-wide text-slate-700 uppercase dark:text-slate-300'>
                Progresso da Anamnese
              </h3>
              <div className='flex items-center gap-2'>
                <span className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                  {Math.round(progressPercentage)}
                </span>
                <span className='text-sm text-slate-500 dark:text-slate-400'>
                  %
                </span>
              </div>
            </div>
            <div className='relative'>
              <div className='absolute top-1/2 left-0 h-2 w-full -translate-y-1/2 rounded-full bg-slate-200 dark:bg-slate-700'></div>
              <motion.div
                className='absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25'
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              ></motion.div>
            </div>
          </div>
        </div>

        {/* Step Navigation Premium */}
        <div className='px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8'>
          <div className='relative'>
            {/* Connection Line */}
            <div className='absolute top-1/2 left-0 hidden h-0.5 w-full -translate-y-1/2 bg-slate-200 sm:block dark:bg-slate-700'></div>
            <motion.div
              className='absolute top-1/2 left-0 hidden h-0.5 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-indigo-600 sm:block'
              initial={{ width: 0 }}
              animate={{
                width: `${(getCurrentStepIndex() / (steps.length - 1)) * 100}%`
              }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            ></motion.div>

            {/* Steps */}
            <div className='relative flex justify-between gap-2 overflow-x-auto pb-2 sm:pb-0'>
              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = isStepCompleted(step.id);
                const isAccessible =
                  index <= getCurrentStepIndex() ||
                  (index === getCurrentStepIndex() + 1 && canProceedToNext());

                return (
                  <div
                    key={step.id}
                    className='min-w-0 flex-shrink-0 text-center'
                  >
                    <motion.button
                      onClick={() => handleStepClick(step.id)}
                      disabled={!isAccessible}
                      className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ring-4 ring-white transition-all duration-300 sm:h-12 sm:w-12 sm:ring-8 dark:ring-slate-900 ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/25'
                          : isCompleted
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/25'
                            : isAccessible
                              ? 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                              : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                      }`}
                      whileHover={isAccessible ? { scale: 1.05 } : {}}
                      whileTap={isAccessible ? { scale: 0.95 } : {}}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                    >
                      {isCompleted ? (
                        <CheckCircle className='h-5 w-5 sm:h-6 sm:w-6' />
                      ) : (
                        <step.icon className='h-4 w-4 sm:h-5 sm:w-5' />
                      )}
                    </motion.button>
                    <p
                      className={`mt-2 max-w-[80px] truncate text-xs font-semibold sm:max-w-none sm:text-sm sm:whitespace-normal ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : isCompleted
                            ? 'text-green-600 dark:text-green-400'
                            : isAccessible
                              ? 'text-slate-600 dark:text-slate-400'
                              : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <div className='w-full flex-1'>
        <div className='flex h-full max-w-none gap-6 p-4 sm:p-6 lg:p-8'>
          {/* Coluna Principal - Formulário */}
          <div className='w-full flex-1 overflow-y-auto'>
            <div className='w-full max-w-none space-y-6'>
              {/* Step Header Card */}
              {currentStepConfig && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <Card className='rounded-xl border-slate-200/60 bg-white/80 p-4 shadow-xl shadow-blue-500/5 backdrop-blur-xl sm:p-6 dark:border-slate-700/50 dark:bg-slate-900/80'>
                    <div className='flex items-center gap-3 sm:gap-4'>
                      <motion.div
                        className='rounded-xl p-3'
                        style={{
                          backgroundColor: `${currentStepConfig.color}20`
                        }}
                        whileHover={{ scale: 1.05, rotate: 3 }}
                      >
                        <currentStepConfig.icon
                          className='h-5 w-5 sm:h-6 sm:w-6'
                          style={{ color: currentStepConfig.color }}
                        />
                      </motion.div>
                      <div className='flex-1'>
                        <h2 className='text-lg font-bold text-slate-900 sm:text-xl dark:text-white'>
                          {currentStepConfig.label}
                        </h2>
                        <p className='mt-1 text-sm text-slate-600 sm:text-base dark:text-slate-400'>
                          {currentStepConfig.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Step Content */}
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                {renderStepContent()}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Footer Navigation */}
      <motion.footer
        className='border-t border-slate-200/60 bg-white/95 shadow-2xl shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/95'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className='mx-auto max-w-screen-2xl p-4 sm:p-6'>
          <div className='flex items-center justify-between gap-4'>
            <Button
              variant='outline'
              onClick={handlePrevious}
              disabled={getCurrentStepIndex() === 0}
              className='gap-2 border-slate-300 bg-white/50 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-700'
              size='sm'
            >
              <ChevronLeft className='h-4 w-4' />
              <span className='hidden sm:inline'>Anterior</span>
            </Button>

            <div className='flex items-center gap-2 sm:gap-3'>
              {currentStep === 'preview' ? (
                <>
                  <Button
                    variant='outline'
                    onClick={handleExport}
                    className='gap-2 border-slate-300 bg-white/50 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-700'
                    size='sm'
                  >
                    <Copy className='h-4 w-4' />
                    <span className='hidden sm:inline'>Copiar</span>
                  </Button>
                  <Button
                    variant='outline'
                    onClick={handleDownload}
                    className='gap-2 border-slate-300 bg-white/50 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-700'
                    size='sm'
                  >
                    <Download className='h-4 w-4' />
                    <span className='hidden sm:inline'>Baixar TXT</span>
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={
                    !canProceedToNext() ||
                    getCurrentStepIndex() === steps.length - 1
                  }
                  className='gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none'
                  size='sm'
                >
                  <span className='hidden sm:inline'>Próximo</span>
                  <span className='sm:hidden'>Próx.</span>
                  <ChevronRight className='h-4 w-4' />
                </Button>
              )}
            </div>
          </div>

          {/* Progress Summary */}
          <div className='mt-4 border-t border-slate-200/60 pt-4 dark:border-slate-700/50'>
            <div className='flex items-center justify-center gap-4 text-xs text-slate-600 sm:text-sm dark:text-slate-400'>
              <span>
                Etapa {getCurrentStepIndex() + 1} de {steps.length}
              </span>
              <span className='hidden sm:inline'>•</span>
              <span className='hidden sm:inline'>
                {Math.round(progressPercentage)}% concluído
              </span>
            </div>
          </div>
        </div>
      </motion.footer>

      {/* Validation Alert */}
      <AnimatePresence>
        {!validateData() && progressPercentage > 50 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className='fixed right-4 bottom-20 z-50 max-w-sm sm:right-6 sm:bottom-24'
          >
            <Card className='border-amber-200 bg-amber-50 p-4 shadow-xl shadow-amber-500/10 dark:border-amber-800/50 dark:bg-amber-900/20'>
              <div className='flex items-start gap-3'>
                <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400' />
                <div>
                  <p className='text-sm font-medium text-amber-800 dark:text-amber-200'>
                    Campos obrigatórios
                  </p>
                  <p className='mt-1 text-xs text-amber-700 dark:text-amber-300'>
                    Alguns campos obrigatórios não foram preenchidos
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Placeholder components for each step - these would be fully implemented with forms
function PatientDataStep() {
  const { anamnesisData, updateNestedAnamnesisData } = useMedical();

  return (
    <Card className='p-6'>
      <CardHeader>
        <CardTitle>Dados do Paciente</CardTitle>
        <CardDescription>
          Informações básicas e anônimas do paciente
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div>
            <label className='text-sm font-medium'>Faixa Etária</label>
            <select
              className='w-full rounded-md border p-2'
              value={anamnesisData.paciente.faixaEtaria}
              onChange={(e) =>
                updateNestedAnamnesisData(
                  'paciente',
                  'faixaEtaria',
                  e.target.value
                )
              }
            >
              <option value=''>Selecione...</option>
              <option value='pediatrico'>Pediátrico (0-12 anos)</option>
              <option value='adulto'>Adulto (13-59 anos)</option>
              <option value='idoso'>Idoso (60+ anos)</option>
            </select>
          </div>
          <div>
            <label className='text-sm font-medium'>Sexo Biológico</label>
            <select
              className='w-full rounded-md border p-2'
              value={anamnesisData.paciente.sexoBiologico}
              onChange={(e) =>
                updateNestedAnamnesisData(
                  'paciente',
                  'sexoBiologico',
                  e.target.value
                )
              }
            >
              <option value=''>Selecione...</option>
              <option value='M'>Masculino</option>
              <option value='F'>Feminino</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChiefComplaintStep() {
  const { anamnesisData, updateNestedAnamnesisData } = useMedical();

  return (
    <Card className='p-6'>
      <CardHeader>
        <CardTitle>Queixa Principal</CardTitle>
        <CardDescription>História da doença atual e sintomas</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <label className='text-sm font-medium'>Queixa Principal</label>
          <textarea
            className='w-full rounded-md border p-2'
            rows={3}
            placeholder='Descreva a queixa principal do paciente...'
            value={anamnesisData.queixaPrincipal.queixaPrincipal}
            onChange={(e) =>
              updateNestedAnamnesisData(
                'queixaPrincipal',
                'queixaPrincipal',
                e.target.value
              )
            }
          />
        </div>
        <div>
          <label className='text-sm font-medium'>Duração dos Sintomas</label>
          <input
            type='text'
            className='w-full rounded-md border p-2'
            placeholder='Ex: 3 dias, 2 semanas...'
            value={anamnesisData.queixaPrincipal.duracaoSintomas}
            onChange={(e) =>
              updateNestedAnamnesisData(
                'queixaPrincipal',
                'duracaoSintomas',
                e.target.value
              )
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MedicalHistoryStep() {
  return (
    <Card className='p-6'>
      <CardHeader>
        <CardTitle>História Médica</CardTitle>
        <CardDescription>
          Antecedentes patológicos e comorbidades
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className='text-muted-foreground text-sm'>
          Implementação completa pendente...
        </p>
      </CardContent>
    </Card>
  );
}

function PhysicalExamStep() {
  return (
    <Card className='p-6'>
      <CardHeader>
        <CardTitle>Exame Físico</CardTitle>
        <CardDescription>
          Sinais vitais e achados do exame físico
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className='text-muted-foreground text-sm'>
          Implementação completa pendente...
        </p>
      </CardContent>
    </Card>
  );
}

function MedicationsStep() {
  return (
    <Card className='p-6'>
      <CardHeader>
        <CardTitle>Medicamentos</CardTitle>
        <CardDescription>Prescrições e orientações médicas</CardDescription>
      </CardHeader>
      <CardContent>
        <p className='text-muted-foreground text-sm'>
          Implementação completa pendente...
        </p>
      </CardContent>
    </Card>
  );
}

function PreviewStep() {
  const { exportAnamnese } = useMedical();

  return (
    <Card className='p-6'>
      <CardHeader>
        <CardTitle>Revisão Final</CardTitle>
        <CardDescription>Preview da anamnese gerada</CardDescription>
      </CardHeader>
      <CardContent>
        <pre className='max-h-96 overflow-auto rounded-md bg-slate-50 p-4 text-sm whitespace-pre-wrap dark:bg-slate-800'>
          {exportAnamnese()}
        </pre>
      </CardContent>
    </Card>
  );
}
