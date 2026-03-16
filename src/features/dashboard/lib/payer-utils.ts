import type { Trip } from '@/features/trips/api/trips.service';
import type { Payer } from '@/features/payers/types/payer.types';

export interface PayerDistributionData {
  payerId: string;
  name: string;
  count: number;
  fill: string;
}

/**
 * Aggregates trips by payer to show distribution
 */
export function getPayerDistribution(
  trips: Trip[],
  payers: Payer[]
): PayerDistributionData[] {
  const distributionMap = new Map<string, number>();

  trips.forEach((trip) => {
    const payerId = trip.payer_id || 'unknown';
    distributionMap.set(payerId, (distributionMap.get(payerId) || 0) + 1);
  });

  const chartColors = [
    'var(--primary)',
    'var(--primary-light)',
    'var(--primary-lighter)',
    'var(--primary-dark)',
    'var(--primary-darker)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)'
  ];

  return Array.from(distributionMap.entries())
    .map(([payerId, count], index) => {
      const payer = payers.find((p) => p.id === payerId);
      return {
        payerId,
        name: payer
          ? payer.name
          : payerId === 'unknown'
            ? 'Unbekannt'
            : payerId,
        count,
        fill: chartColors[index % chartColors.length]
      };
    })
    .sort((a, b) => b.count - a.count);
}
