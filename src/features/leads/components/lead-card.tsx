import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { LeadStatusDot } from './lead-status-badge';
import type { Lead } from '@/types/api';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const contacts = lead.contacts ?? [];
  const primary = contacts[0] ?? null;
  const extraCount = Math.max(0, contacts.length - 1);

  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full rounded-xl border bg-card p-4 text-left shadow-sm',
        'transition-all hover:shadow-md hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
    >
      {/* Header: company name + status dot */}
      <div className='flex items-start justify-between gap-2 mb-3'>
        <p className='font-semibold leading-snug text-foreground line-clamp-1'>
          {lead.company_name}
        </p>
        <LeadStatusDot status={lead.status} className='mt-0.5' />
      </div>

      {/* Contact info */}
      <div className='space-y-1.5'>
        {primary ? (
          <>
            <div className='flex items-center gap-1.5 text-sm text-foreground/80'>
              <Icons.user className='size-3.5 shrink-0 text-muted-foreground' />
              <span className='truncate'>
                {primary.name}
                {primary.role ? (
                  <span className='text-muted-foreground'>, {primary.role}</span>
                ) : null}
              </span>
            </div>
            {primary.phone && (
              <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                <Icons.phone className='size-3.5 shrink-0' />
                <span>{primary.phone}</span>
              </div>
            )}
          </>
        ) : (
          <p className='text-sm text-muted-foreground italic'>Nenhum contato</p>
        )}
      </div>

      {/* Interest items */}
      {lead.interest_items.length > 0 && (
        <div className='mt-3 flex flex-wrap gap-1.5'>
          {lead.interest_items.map((item) => (
            <span
              key={item}
              className='inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground'
            >
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Extra contacts indicator */}
      {extraCount > 0 && (
        <p className='mt-2 text-xs text-muted-foreground'>
          + {extraCount} contato{extraCount > 1 ? 's' : ''} adiciona{extraCount > 1 ? 'is' : 'l'}
        </p>
      )}
    </button>
  );
}
