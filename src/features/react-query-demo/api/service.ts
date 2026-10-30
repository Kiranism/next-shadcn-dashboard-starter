import type { Pokemon } from './types';

export async function getPokemon(id: number): Promise<Pokemon> {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  if (!response.ok) throw new Error('Failed to fetch pokemon');
  return response.json();
}
