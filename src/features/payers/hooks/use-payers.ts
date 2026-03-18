import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PayersService } from '../api/payers.service';
import type { PayerWithBillingCount } from '../types/payer.types';
import { createClient } from '@/lib/supabase/client';

export const PAYERS_QUERY_KEY = 'payers';

export function usePayers() {
  const queryClient = useQueryClient();

  // We fetch company_id from the users table — required by RLS policy for insert/update
  const getCompanyId = async () => {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('accounts')
      .select('company_id')
      .eq('id', user.id)
      .single();

    return profile?.company_id ?? null;
  };

  const query = useQuery<PayerWithBillingCount[]>({
    queryKey: [PAYERS_QUERY_KEY],
    queryFn: () => PayersService.getPayers(),
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, number }: { name: string; number: string }) => {
      const companyId = await getCompanyId();
      if (!companyId) throw new Error('Not authenticated');
      return PayersService.createPayer(companyId, name, number);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAYERS_QUERY_KEY] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      name,
      number
    }: {
      id: string;
      name: string;
      number: string;
    }) => PayersService.updatePayer(id, name, number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAYERS_QUERY_KEY] });
    }
  });

  return {
    ...query,
    createPayer: createMutation.mutateAsync,
    updatePayer: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending
  };
}
