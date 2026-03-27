'use client';

import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { pokemonOptions } from '../api/queries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const POKEMON_IDS = [25, 1, 4, 7, 6, 150, 133, 39, 143, 94];

export function PokemonInfo() {
  const [pokemonId, setPokemonId] = useState(25);
  const { data } = useSuspenseQuery(pokemonOptions(pokemonId));

  return (
    <div className='space-y-6'>
      {/* Pokemon selector */}
      <Card>
        <CardHeader>
          <CardTitle>Pick a Pokemon</CardTitle>
          <CardDescription>
            Each selection triggers <code>useSuspenseQuery</code> — cached results are instant, new
            fetches show the Suspense fallback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            {POKEMON_IDS.map((id) => (
              <Button
                key={id}
                variant={pokemonId === id ? 'default' : 'outline'}
                size='sm'
                onClick={() => setPokemonId(id)}
              >
                #{id}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pokemon card */}
      <Card>
        <CardHeader>
          <div className='flex items-center gap-3'>
            <CardTitle className='capitalize'>{data.name}</CardTitle>
            <div className='flex gap-1'>
              {data.types.map(({ type }) => (
                <Badge key={type.name} variant='secondary'>
                  {type.name}
                </Badge>
              ))}
            </div>
          </div>
          <CardDescription>
            Height: {data.height / 10}m &middot; Weight: {data.weight / 10}kg
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center gap-6 sm:flex-row'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.sprites.front_shiny}
              alt={data.name}
              width={160}
              height={160}
              className='bg-muted/50 rounded-lg'
            />
            <div className='flex-1 space-y-3'>
              {data.stats.map((s) => (
                <div key={s.stat.name} className='space-y-1'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground capitalize'>{s.stat.name}</span>
                    <span className='font-medium'>{s.base_stat}</span>
                  </div>
                  <Progress value={Math.min(s.base_stat, 150) / 1.5} />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className='text-muted-foreground text-xs'>
            Data from PokeAPI &middot; Prefetched on server, hydrated on client
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
