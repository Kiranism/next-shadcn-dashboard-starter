import type { AnyFormApi } from '@tanstack/react-form';
import { useCallback, useState } from 'react';
import type { ZodTypeAny } from 'zod';

/**
 * Options for handling cancel/back actions
 */
type HandleCancelOrBackOpts = {
  onBack?: VoidFunction;
  onCancel?: VoidFunction;
};

/**
 * State of the current step
 */
type StepState = {
  value: number;
  count: number;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  isCompleted: boolean;
};

/**
 * Hook for managing multi-step form navigation and validation
 *
 * @param schemas - Array of Zod schemas for each step
 * @returns Object with stepper state and methods
 */
export function useFormStepper(schemas: ZodTypeAny[]) {
  const stepCount = schemas.length;
  const [currentStep, setCurrentStep] = useState(1); // Start from 1

  const goToNextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, stepCount));
  }, [stepCount]);

  const goToPrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const step: StepState = {
    value: currentStep,
    count: stepCount,
    goToNextStep,
    goToPrevStep,
    isCompleted: currentStep === stepCount
  };

  const currentValidator = schemas[currentStep - 1]; // Convert to 0-based for array access
  const isFirstStep = currentStep === 1;

  const triggerFormGroup = async (form: AnyFormApi) => {
    const result = currentValidator.safeParse(form.state.values);
    if (!result.success) {
      await form.handleSubmit({ step: String(currentStep) });
      return result;
    }

    return result;
  };

  const handleNextStepOrSubmit = async (form: AnyFormApi) => {
    const result = await triggerFormGroup(form);
    if (!result.success) {
      return;
    }

    if (currentStep < stepCount) {
      goToNextStep();
      return;
    }

    if (currentStep === stepCount) {
      form.handleSubmit();
    }
  };

  const handleCancelOrBack = (opts?: HandleCancelOrBackOpts) => {
    if (isFirstStep || step.isCompleted) {
      opts?.onCancel?.();
      return;
    }

    if (currentStep > 1) {
      opts?.onBack?.();
      goToPrevStep();
    }
  };

  return {
    step, // Current step state
    currentStep, // Current step number (1-based)
    isFirstStep, // Whether current step is the first step
    currentValidator, // Zod schema for current step
    triggerFormGroup, // Validate current step fields
    handleNextStepOrSubmit, // Handle next/submit action
    handleCancelOrBack // Handle back/cancel action
  };
}
