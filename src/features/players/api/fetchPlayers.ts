import { getSession } from 'next-auth/react';

export type Player = {
  id: number;
  nickname: string;
  gender: number;
  name: string | null;
  surname: string | null;
  number: string | null;
  email: string | null;
  playtomic_id: number;
  level: number;
  picture: string | null;
};

export async function fetchPlayers(token: string): Promise<Player[]> {
  const response = await fetch('http://localhost:8000/player/', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch players');
  }

  return response.json();
}
