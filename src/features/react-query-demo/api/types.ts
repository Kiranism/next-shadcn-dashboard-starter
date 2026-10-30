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
