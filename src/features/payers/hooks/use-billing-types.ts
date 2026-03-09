import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PayersService } from '../api/payers.service';
import type { BillingType, BillingTypeBehavior } from '../types/payer.types';
import { PAYERS_QUERY_KEY } from './use-payers';

export const BILLING_TYPES_QUERY_KEY = 'billing_types';

export function useBillingTypes(payerId: string | undefined | null) {
  const queryClient = useQueryClient();

  const query = useQuery<BillingType[]>({
    queryKey: [BILLING_TYPES_QUERY_KEY, payerId],
    queryFn: () => PayersService.getBillingTypes(payerId as string),
    enabled: !!payerId,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      PayersService.createBillingType(payerId as string, name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BILLING_TYPES_QUERY_KEY, payerId]
      });
      // Invalidate payers to update the count
      queryClient.invalidateQueries({ queryKey: [PAYERS_QUERY_KEY] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => PayersService.deleteBillingType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BILLING_TYPES_QUERY_KEY, payerId]
      });
      // Invalidate payers to update the count
      queryClient.invalidateQueries({ queryKey: [PAYERS_QUERY_KEY] });
    }
  });

  const updateBehaviorMutation = useMutation({
    mutationFn: ({
      id,
      behavior
    }: {
      id: string;
      behavior: BillingTypeBehavior;
    }) => PayersService.updateBillingTypeBehavior(id, behavior),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BILLING_TYPES_QUERY_KEY, payerId]
      });
    }
  });

  return {
    ...query,
    createBillingType: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteBillingType: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    updateBehavior: updateBehaviorMutation.mutateAsync,
    isUpdatingBehavior: updateBehaviorMutation.isPending
  };
}
