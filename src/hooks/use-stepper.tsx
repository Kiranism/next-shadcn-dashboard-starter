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
  goToStep: (step: number) => void;
  isCompleted: boolean;
};

type UseFormStepperOptions = {
  /** The complete form schema. When provided, the FINAL submit re-validates
   *  the whole form (not just the last step); on failure the wizard jumps to
   *  the first failing step and surfaces its errors. */
  fullSchema?: ZodTypeAny;
};

/**
 * Hook for managing multi-step form navigation and validation.
 *
 * The step gate awaits ASYNC field validators (uniqueness checks can block
 * Next), marks only the current step's mounted fields touched (later steps
 * stay pristine — no submitted-state leak), and Back works from every step
 * after the first, including the review step.
 *
 * @param schemas - Array of Zod schemas, one per step
 * @param options - Optional fullSchema for final-submit re-validation
 */
export function useFormStepper(schemas: ZodTypeAny[], options?: UseFormStepperOptions) {
  const stepCount = schemas.length;
  const [currentStep, setCurrentStep] = useState(1); // Start from 1

  const goToNextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, stepCount));
  }, [stepCount]);

  const goToPrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      setCurrentStep(Math.min(Math.max(step, 1), stepCount));
    },
    [stepCount]
  );

  const step: StepState = {
    value: currentStep,
    count: stepCount,
    goToNextStep,
    goToPrevStep,
    goToStep,
    isCompleted: currentStep === stepCount
  };

  const currentValidator = schemas[currentStep - 1]; // Convert to 0-based for array access
  const isFirstStep = currentStep === 1;

  /**
   * Validate the current step: the step schema PLUS every mounted field's
   * validators including async ones (awaited — an async uniqueness check can
   * fail the gate). Mounted fields are marked touched so their errors render;
   * submissionAttempts is NOT incremented, so untouched later steps show no
   * errors when they mount.
   */
  const triggerFormGroup = async (form: AnyFormApi) => {
    const fieldErrors = await form.validateAllFields('submit');
    for (const name of Object.keys(form.state.fieldMeta)) {
      form.setFieldMeta(name as never, (meta) => ({ ...meta, isTouched: true }));
    }
    const result = currentValidator.safeParse(form.state.values);
    const hasFieldErrors = fieldErrors.flat(Infinity).filter(Boolean).length > 0;
    if (!result.success || hasFieldErrors) {
      return { ...result, success: false as const };
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

    // Final step: re-validate the WHOLE form when fullSchema is provided —
    // otherwise only the last step's schema guards the submit and earlier
    // steps' values could regress silently (e.g. a listener cleared them).
    if (options?.fullSchema) {
      const full = options.fullSchema.safeParse(form.state.values);
      if (!full.success) {
        const failing = schemas.findIndex((s) => !s.safeParse(form.state.values).success);
        if (failing >= 0) {
          goToStep(failing + 1);
          // After React commits the step switch (onDynamic now wired to the
          // failing step's schema), run a submit attempt to paint its errors;
          // it fails validation, so onSubmit never fires.
          setTimeout(() => {
            void form.handleSubmit();
          }, 0);
          return;
        }
        // Cross-step failure not attributable to one step (e.g. a pathless
        // refine): fall through — the submit below runs the form's own
        // validators and FormErrors renders pathless issues.
      }
    }

    await form.handleSubmit();
  };

  const handleCancelOrBack = (opts?: HandleCancelOrBackOpts) => {
    // Back works from EVERY step after the first — including the review
    // step (previously a no-op there); cancel only from step 1.
    if (currentStep > 1) {
      opts?.onBack?.();
      goToPrevStep();
      return;
    }
    opts?.onCancel?.();
  };

  return {
    step, // Current step state
    currentStep, // Current step number (1-based)
    isFirstStep, // Whether current step is the first step
    currentValidator, // Zod schema for current step
    triggerFormGroup, // Validate current step fields (async-aware)
    handleNextStepOrSubmit, // Handle next/submit action
    handleCancelOrBack // Handle back/cancel action
  };
}
