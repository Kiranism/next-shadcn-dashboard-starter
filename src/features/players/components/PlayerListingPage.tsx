'use client';

import React, { useEffect, useState } from 'react';
import { getSession } from 'next-auth/react';
import { Player } from '../api/fetchPlayers';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { DataTable } from '@/components/ui/table/data-table';
import { playerColumns } from './player-tables/columns';

const PlayerListingPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const session = await getSession();
        if (!session || !session.accessToken) {
          throw new Error('User is not authenticated');
        }

        const response = await fetch('http://localhost:8000/player/', {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch players');
        }

        const data = await response.json();
        setPlayers(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  if (loading) {
    return <DataTableSkeleton columnCount={4} rowCount={5} />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <DataTable
      columns={playerColumns}
      data={players}
      totalItems={players.length}
    />
  );
};

export default PlayerListingPage;
