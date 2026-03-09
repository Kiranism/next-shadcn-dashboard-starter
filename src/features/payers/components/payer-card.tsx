import { Hash, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { PayerWithBillingCount } from '../types/payer.types';
import { cn } from '@/lib/utils';

interface PayerCardProps {
  payer: PayerWithBillingCount;
  onClick: (payer: PayerWithBillingCount) => void;
}

export function PayerCard({ payer, onClick }: PayerCardProps) {
  const billingCount =
    payer.billing_types && payer.billing_types.length > 0
      ? payer.billing_types[0]?.count || 0
      : 0;

  const hasCases = billingCount > 0;
  const initial = payer.name.charAt(0).toUpperCase();

  return (
    <Card
      className={cn(
        'group hover:bg-muted/50 flex cursor-pointer items-center p-4 transition-all hover:shadow-md',
        'border-border/50'
      )}
      onClick={() => onClick(payer)}
    >
      <Avatar className='group-hover:bg-background mr-4 h-12 w-12 border transition-colors'>
        <AvatarFallback className='text-foreground/80 text-lg font-semibold'>
          {initial}
        </AvatarFallback>
      </Avatar>

      <div className='min-w-0 flex-1 pr-4'>
        <h3 className='mb-1 truncate text-base font-semibold'>{payer.name}</h3>
        {payer.number && (
          <div className='text-muted-foreground flex items-center text-sm'>
            <Hash className='mr-1 h-3.5 w-3.5 flex-shrink-0' />
            <span className='truncate'>{payer.number}</span>
          </div>
        )}
      </div>

      <div className='flex shrink-0 flex-col items-end gap-2'>
        <Badge
          variant={hasCases ? 'default' : 'secondary'}
          className={cn(
            'ml-2 rounded-full px-2.5 font-medium shadow-sm transition-colors',
            hasCases
              ? 'border-teal-500/20 bg-teal-500/15 text-teal-700 hover:bg-teal-500/25'
              : 'text-muted-foreground bg-muted hover:bg-muted'
          )}
        >
          {hasCases ? `${billingCount} Arten` : 'Keine'}
        </Badge>
      </div>

      <ChevronRight className='text-muted-foreground/30 group-hover:text-muted-foreground ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5' />
    </Card>
  );
}
