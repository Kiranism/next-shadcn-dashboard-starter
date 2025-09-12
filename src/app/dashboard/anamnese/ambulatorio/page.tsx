'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  CalendarCheck,
  User,
  MessageSquare,
  History,
  Stethoscope,
  Pill,
  FileText,
  Download,
  Copy,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMedical } from '@/contexts/MedicalContext';
import { toast } from 'sonner';
import {
  AnamneseLayout,
  AnamneseStepHeader,
  AnamneseStepper,
  type StepConfig,
  PatientDataStep,
  ChiefComplaintStep,
  MedicalHistoryStep,
  PhysicalExamStep,
  MedicationsStep,
  PreviewStep
} from '@/features/anamnese/components';

type Step =
  | 'patient'
  | 'complaint'
  | 'history'
  | 'exam'
  | 'medications'
  | 'preview';

export default function AmbulatorioAnamnesePage() {
  const [currentStep, setCurrentStep] = useState<Step>('patient');
  const [completed, setCompleted] = useState<Record<Step, boolean>>({
    patient: false,
    complaint: false,
    history: false,
    exam: false,
    medications: false,
    preview: false
  });

  const {
    anamnesisData,
    medicalColors,
    exportAnamnese,
    validateData,
    resetAnamnese,
    setContextType
  } = useMedical();

  useEffect(() => {
    if (anamnesisData.contextType !== 'ambulatorio') {
      setContextType('ambulatorio');
    }
  }, [anamnesisData.contextType, setContextType]);

  const steps = useMemo<StepConfig<Step>[]>(
    () => [
      {
        id: 'patient',
        label: 'Paciente',
        icon: User,
        description: 'Identificação básica',
        color: medicalColors.primary
      },
      {
        id: 'complaint',
        label: 'Queixa',
        icon: MessageSquare,
        description: 'HDA e sintomas',
        color: medicalColors.warning
      },
      {
        id: 'history',
        label: 'História',
        icon: History,
        description: 'Antecedentes e riscos',
        color: medicalColors.neurology
      },
      {
        id: 'exam',
        label: 'Exame',
        icon: Stethoscope,
        description: 'Exame dirigido',
        color: medicalColors.cardiology
      },
      {
        id: 'medications',
        label: 'Plano',
        icon: Pill,
        description: 'Conduta e seguimento',
        color: medicalColors.success
      },
      {
        id: 'preview',
        label: 'Revisão',
        icon: FileText,
        description: 'Exportação',
        color: medicalColors.primary
      }
    ],
    [medicalColors]
  );

  const someValues = useCallback(
    (obj?: Record<string, any>) => Object.values(obj ?? {}).some(Boolean),
    []
  );

  // Outpatient-specific: emphasize continuity data if present
  const isStepCompleted = useCallback(
    (stepId: Step): boolean => {
      switch (stepId) {
        case 'patient':
          return !!(
            anamnesisData?.paciente?.faixaEtaria &&
            anamnesisData?.paciente?.sexoBiologico
          );
        case 'complaint':
          return someValues(anamnesisData.queixaPrincipal?.selectedComplaints);
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
          return !!(
            anamnesisData?.medicamentos?.prescricaoAtual?.length ||
            anamnesisData?.avaliacaoConduta?.retorno
          );
        case 'preview':
          return validateData();
        default:
          return false;
      }
    },
    [anamnesisData, validateData, someValues]
  );

  useEffect(() => {
    const initialCompleted: Record<Step, boolean> = {
      patient: isStepCompleted('patient'),
      complaint: isStepCompleted('complaint'),
      history: isStepCompleted('history'),
      exam: isStepCompleted('exam'),
      medications: isStepCompleted('medications'),
      preview: isStepCompleted('preview')
    };
    setCompleted(initialCompleted);
  }, [anamnesisData, isStepCompleted]);

  const getCurrentStepIndex = () =>
    steps.findIndex((s) => s.id === currentStep);
  // progressPercentage is computed via useMemo below
  const canProceedToNext = () =>
    completed[currentStep] || currentStep === 'preview';

  const handleNext = () => {
    const idx = getCurrentStepIndex();
    if (idx < steps.length - 1) setCurrentStep(steps[idx + 1].id as Step);
  };
  const handlePrevious = () => {
    const idx = getCurrentStepIndex();
    if (idx > 0) setCurrentStep(steps[idx - 1].id as Step);
  };
  const handleStepClick = (id: Step) => {
    const idx = steps.findIndex((s) => s.id === id);
    const cur = getCurrentStepIndex();
    if (id === 'preview') return setCurrentStep('preview');
    if (idx <= cur || (idx === cur + 1 && canProceedToNext()))
      setCurrentStep(id);
  };

  const handleExport = async () => {
    try {
      const text = exportAnamnese();
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success('Anamnese copiada para a área de transferência!');
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        toast.success('Anamnese copiada!');
      }
    } catch {
      toast.error('Erro ao copiar anamnese');
    }
  };

  const handleDownload = () => {
    try {
      const text = exportAnamnese();
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const patientId = anamnesisData.paciente?.id?.slice(-8) || 'novo';
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `anamnese_amb_${patientId}_${timestamp}.txt`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Anamnese baixada com sucesso!');
    } catch {
      toast.error('Erro ao baixar anamnese');
    }
  };

  const handleReset = () => {
    resetAnamnese('ambulatorio');
    setCurrentStep('patient');
    toast.success('Nova anamnese ambulatorial');
  };

  const renderStepContent = () => {
    const variants = {
      hidden: { opacity: 0, x: 20 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 }
    };
    return (
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentStep}
          variants={variants}
          initial='hidden'
          animate='visible'
          exit='exit'
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className='w-full'
        >
          {currentStep === 'patient' && <PatientDataStep />}
          {currentStep === 'complaint' && <ChiefComplaintStep />}
          {currentStep === 'history' && <MedicalHistoryStep />}
          {currentStep === 'exam' && <PhysicalExamStep />}
          {currentStep === 'medications' && <MedicationsStep />}
          {currentStep === 'preview' && <PreviewStep />}
        </motion.div>
      </AnimatePresence>
    );
  };

  const currentStepConfig = steps.find((s) => s.id === currentStep)!;
  const progressPercentage = useMemo(
    () =>
      (steps.filter((s) => completed[s.id as Step]).length / steps.length) *
      100,
    [completed, steps]
  );

  return (
    <AnamneseLayout
      sidebar={
        <div className='space-y-6'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-semibold tracking-wide text-slate-700 uppercase dark:text-slate-300'>
                Progresso (Amb.)
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
            <div
              className='relative'
              role='progressbar'
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progressPercentage)}
              aria-label='Progresso da anamnese'
            >
              <div className='absolute top-1/2 left-0 h-2 w-full -translate-y-1/2 rounded-full bg-slate-200 dark:bg-slate-700'></div>
              <motion.div
                className='absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25'
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </div>
          <AnamneseStepper<Step>
            steps={steps}
            currentStepIndex={getCurrentStepIndex()}
            completedSteps={steps.map((s) => completed[s.id as Step])}
            onStepClick={handleStepClick}
          />
        </div>
      }
    >
      <motion.header
        className='glass-medical border-b border-slate-200/60 shadow-xl shadow-blue-500/10 dark:border-slate-700/50'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className='w-full px-6 py-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-4'>
              <motion.div
                className='rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 shadow-lg'
                whileHover={{ scale: 1.05, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
              >
                <CalendarCheck className='h-6 w-6 text-white' />
              </motion.div>
              <div>
                <h1 className='text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100'>
                  Anamnese - Ambulatório
                </h1>
                <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
                  Foco em continuidade de cuidado e seguimento.
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Badge
                variant='outline'
                className='border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-300'
              >
                Ambulatorial
              </Badge>
              <Button
                variant='ghost'
                size='sm'
                className='gap-2'
                onClick={handleReset}
              >
                <RotateCcw className='h-4 w-4' />
                Nova anamnese
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {currentStepConfig && (
        <AnamneseStepHeader
          title={currentStepConfig.label}
          description={currentStepConfig.description}
          icon={<currentStepConfig.icon className='h-5 w-5 sm:h-6 sm:w-6' />}
          color={currentStepConfig.color}
        />
      )}

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {renderStepContent()}
      </motion.div>

      <motion.footer
        className='glass-medical border-t border-slate-200/60 shadow-2xl shadow-slate-900/5 dark:border-slate-700/50'
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
              className='btn-medical gap-2 border-slate-300 bg-white/50 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-700'
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
                    disabled={!validateData()}
                    className='btn-medical gap-2 border-slate-300 bg-white/50 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-700'
                    size='sm'
                  >
                    <Copy className='h-4 w-4' />
                    <span className='hidden sm:inline'>Copiar</span>
                  </Button>
                  <Button
                    variant='outline'
                    onClick={handleDownload}
                    disabled={!validateData()}
                    className='btn-medical gap-2 border-slate-300 bg-white/50 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-700'
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
                  className='btn-medical gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none'
                  size='sm'
                >
                  <span className='hidden sm:inline'>Próximo</span>
                  <span className='sm:hidden'>Próx.</span>
                  <ChevronRight className='h-4 w-4' />
                </Button>
              )}
            </div>
          </div>
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
    </AnamneseLayout>
  );
}
