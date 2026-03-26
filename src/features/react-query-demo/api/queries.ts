import { queryOptions } from '@tanstack/react-query';

export type Pokemon = {
  id: number;
  name: string;
  sprites: {
    front_shiny: string;
    front_default: string;
  };
  types: { type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  height: number;
  weight: number;
};

export const pokemonOptions = (id: number = 25) =>
  queryOptions({
    queryKey: ['pokemon', id],
    queryFn: async (): Promise<Pokemon> => {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      if (!response.ok) throw new Error('Failed to fetch pokemon');
      return response.json();
    }
  });
