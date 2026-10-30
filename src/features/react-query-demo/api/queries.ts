import { queryOptions } from '@tanstack/react-query';
import { getPokemon } from './service';
import type { Pokemon } from './types';

export type { Pokemon };

export const pokemonQueries = {
  all: () => ['pokemon'] as const,
  detail: (id: number) =>
    queryOptions({
      queryKey: [...pokemonQueries.all(), 'detail', id] as const,
      queryFn: () => getPokemon(id)
    })
};
