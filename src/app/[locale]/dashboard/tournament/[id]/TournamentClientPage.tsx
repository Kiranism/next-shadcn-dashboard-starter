'use client';

import React, { useState, useEffect, JSX } from 'react';
import { useApi } from '@/hooks/useApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  Calendar,
  Users,
  ArrowLeft,
  Plus,
  UserPlus,
  AlertCircle,
  Search,
  Import,
  RefreshCw,
  Trash2,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/navigation';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetDescription
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

// Import Tournament interface from the overview page to maintain consistency
interface Tournament {
  id: number;
  name: string;
  description: string;
  images: string[];
  company_id: number;
  start_date: string;
  end_date: string;
  players_number: number;
  full_description?: any;
}

interface Player {
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
}

interface TournamentPlayer {
  tournament_id: number;
  player_id: number;
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  player: Player;
}

interface Couple {
  id: number;
  tournament_id: number;
  first_player_id: number;
  second_player_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  name: string;
  first_player: Player;
  second_player: Player;
}

interface PlaytomicPlayer {
  user_id: string;
  full_name: string;
  gender: string;
  picture: string;
  additional_data?: Array<{
    level_value: number;
  }>;
}

// Helper functions for date formatting and status determination
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getTournamentStatus(
  tourney: Tournament
): 'ended' | 'ongoing' | 'upcoming' {
  const now = new Date();
  const startDate = new Date(tourney.start_date);
  const endDate = new Date(tourney.end_date);

  if (now < startDate) return 'upcoming';
  if (now > endDate) return 'ended';
  return 'ongoing';
}

// Helper function to get player initials from nickname
function getInitials(nickname: string): string {
  return nickname
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Helper function to format player level
function formatPlayerLevel(level: number): string {
  // Divide by 100 and format with 2 decimal places
  return (level / 100).toFixed(2);
}

// Lexical rendering functions for full description
function renderLexicalDescription(lexicalData: any): JSX.Element | null {
  if (!lexicalData || !lexicalData.root || !lexicalData.root.children) {
    return null;
  }
  return <>{lexicalData.root.children.map(renderNode)}</>;
}

function renderNode(node: any): JSX.Element | string | null {
  if (!node) return null;

  switch (node.type) {
    case 'paragraph':
      return (
        <p key={Math.random()} className='mb-2'>
          {node.children?.map(renderNode)}
        </p>
      );
    case 'text':
      let text = node.text;
      if (node.format & 1) text = <strong key={Math.random()}>{text}</strong>; // Bold
      if (node.format & 2) text = <em key={Math.random()}>{text}</em>; // Italic
      if (node.format & 8) text = <u key={Math.random()}>{text}</u>; // Underline
      return <React.Fragment key={Math.random()}>{text}</React.Fragment>;
    case 'heading':
      const HeadingTag = `h${node.tag}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag key={Math.random()} className='mb-2 mt-4'>
          {node.children?.map(renderNode)}
        </HeadingTag>
      );
    default:
      return null;
  }
}

// Component to render a single player card
function PlayerCard({
  player,
  t,
  onDelete,
  disableDelete = false
}: {
  player: Player;
  t: any;
  onDelete?: (playerId: number) => void;
  disableDelete?: boolean;
}) {
  // Get Common translations for actions
  const commonT = useTranslations('Common');

  return (
    <div className='flex h-auto items-center rounded-md border p-2'>
      <Avatar className='mr-2 h-8 w-8'>
        <AvatarImage src={player.picture || ''} alt={player.nickname} />
        <AvatarFallback>{getInitials(player.nickname)}</AvatarFallback>
      </Avatar>
      <div className='flex-1'>
        <p className='text-sm font-medium'>{player.nickname}</p>
        <p className='text-xs text-muted-foreground'>
          {t('level')}: {formatPlayerLevel(player.level)}
        </p>
      </div>
      {onDelete && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0'
              disabled={disableDelete}
            >
              <MoreHorizontal className='h-4 w-4' />
              <span className='sr-only'>{commonT('actions')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem className='cursor-pointer'>
              <Eye className='mr-2 h-4 w-4' />
              {t('viewPlayerDetails')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(player.id)}
              className='cursor-pointer text-destructive focus:text-destructive'
              disabled={disableDelete}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              {t('removePlayer')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// Component to render a single couple card
function CoupleCard({ couple, t }: { couple: Couple; t: any }) {
  return (
    <div className='rounded-md border p-3'>
      <p className='mb-2 font-medium'>{couple.name}</p>
      <div className='mb-2 flex items-center gap-2'>
        <Avatar className='h-8 w-8'>
          <AvatarImage
            src={couple.first_player.picture || ''}
            alt={couple.first_player.nickname}
          />
          <AvatarFallback>
            {getInitials(couple.first_player.nickname)}
          </AvatarFallback>
        </Avatar>
        <div className='flex-1'>
          <p className='text-sm'>{couple.first_player.nickname}</p>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Avatar className='h-8 w-8'>
          <AvatarImage
            src={couple.second_player.picture || ''}
            alt={couple.second_player.nickname}
          />
          <AvatarFallback>
            {getInitials(couple.second_player.nickname)}
          </AvatarFallback>
        </Avatar>
        <div className='flex-1'>
          <p className='text-sm'>{couple.second_player.nickname}</p>
        </div>
      </div>
    </div>
  );
}

// Component for creating a new player
function CreatePlayerForm({
  onPlayerCreated,
  onCancel,
  t
}: {
  onPlayerCreated: (playerId: number) => void;
  onCancel: () => void;
  t: any;
}) {
  const callApi = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    gender: '1' // 1 = male, 2 = female
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const response = await callApi('/player/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: formData.nickname,
          gender: parseInt(formData.gender),
          // Default level (3.00)
          level: 300
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('failedToCreatePlayer'));
      }

      const newPlayer = await response.json();
      toast.success(t('playerCreated'));
      onPlayerCreated(newPlayer.id);
    } catch (error) {
      console.error('Error creating player:', error);
      toast.error(
        error instanceof Error ? error.message : t('failedToCreatePlayer')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='nickname'>{t('nickname')} *</Label>
        <Input
          id='nickname'
          name='nickname'
          value={formData.nickname}
          onChange={handleChange}
          required
          placeholder={t('enterNickname')}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='gender'>{t('gender')}</Label>
        <Select
          name='gender'
          value={formData.gender}
          onValueChange={(value) => handleSelectChange('gender', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('selectGender')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='1'>{t('male')}</SelectItem>
            <SelectItem value='2'>{t('female')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='flex justify-end space-x-2 pt-4'>
        <Button type='button' variant='outline' onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button type='submit' disabled={isLoading}>
          {isLoading ? t('creating') : t('createPlayer')}
        </Button>
      </div>
    </form>
  );
}

// Component for importing players from Playtomic
function ImportPlaytomicPlayer({
  onPlayerImported,
  onCancel,
  t
}: {
  onPlayerImported: (playerId: number) => void;
  onCancel: () => void;
  t: any;
}) {
  const callApi = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [playtomicPlayers, setPlaytomicPlayers] = useState<PlaytomicPlayer[]>(
    []
  );
  const [selectedPlayer, setSelectedPlayer] = useState<PlaytomicPlayer | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setIsSearching(true);
      setError(null);
      // Use the correct endpoint from ImportPlaytomicSidebar
      const response = await callApi(
        `/player/playtomic-player/?name=${searchTerm}`
      );

      if (!response.ok) {
        throw new Error(t('failedToSearchPlaytomic'));
      }

      const data = await response.json();
      setPlaytomicPlayers(data);
    } catch (error) {
      console.error('Error searching Playtomic players:', error);
      setError(
        error instanceof Error ? error.message : t('failedToSearchPlaytomic')
      );
      toast.error(
        error instanceof Error ? error.message : t('failedToSearchPlaytomic')
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async () => {
    if (!selectedPlayer) return;

    try {
      setIsImporting(true);
      setError(null);

      // Convert gender string to integer (1 for male, 2 for female)
      const genderInt = selectedPlayer.gender.toUpperCase() === 'MALE' ? 1 : 2;

      // Use the correct endpoint and payload from ImportPlaytomicSidebar
      const response = await callApi('/player/from-playtomic/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: selectedPlayer.user_id,
          gender: genderInt
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || t('failedToImportPlayer'));
      }

      toast.success(t('playerImported'));
      onPlayerImported(data.id);
    } catch (error) {
      console.error('Error importing player:', error);
      setError(
        error instanceof Error ? error.message : t('failedToImportPlayer')
      );
      toast.error(
        error instanceof Error ? error.message : t('failedToImportPlayer')
      );
    } finally {
      setIsImporting(false);
    }
  };

  // Updated rendering to match player page style with picture and without gender
  return (
    <div className='space-y-4'>
      {error && (
        <Alert variant='destructive' className='mb-4'>
          <AlertCircle className='mr-2 h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className='flex space-x-2'>
        <Input
          placeholder={t('searchPlaytomicPlayers')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          onClick={handleSearch}
          disabled={isSearching || !searchTerm.trim()}
          type='button'
        >
          {isSearching ? (
            <span className='mr-2 animate-spin'>⟳</span>
          ) : (
            <Search className='mr-2 h-4 w-4' />
          )}
          {t('search')}
        </Button>
      </div>

      {playtomicPlayers.length === 0 && !isSearching ? (
        <div className='py-4 text-center'>
          <p className='text-sm text-muted-foreground'>
            {t('searchPlaytomicPlayersPrompt')}
          </p>
        </div>
      ) : isSearching ? (
        <div className='space-y-2'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </div>
      ) : (
        <div className='overflow-hidden rounded-md border'>
          <ScrollArea className='max-h-40'>
            <div className='space-y-1 p-1'>
              {playtomicPlayers.map((player) => (
                <div
                  key={player.user_id}
                  className={`cursor-pointer rounded-md p-2 hover:bg-accent ${selectedPlayer?.user_id === player.user_id ? 'bg-accent' : ''}`}
                  onClick={() => setSelectedPlayer(player)}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center'>
                      <Avatar className='mr-2 h-8 w-8'>
                        <AvatarImage
                          src={player.picture}
                          alt={player.full_name}
                        />
                        <AvatarFallback>
                          {getInitials(player.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className='text-sm font-medium'>
                          {player.full_name}
                        </p>
                        {player.additional_data &&
                          player.additional_data.length > 0 && (
                            <p className='text-xs text-muted-foreground'>
                              {t('level')}:{' '}
                              {formatPlayerLevel(
                                player.additional_data[0].level_value
                              )}
                            </p>
                          )}
                      </div>
                    </div>
                    {selectedPlayer?.user_id === player.user_id && (
                      <Badge variant='outline' className='text-xs'>
                        {t('selected')}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className='flex justify-end space-x-2 pt-2'>
        <Button type='button' variant='outline' onClick={onCancel} size='sm'>
          {t('cancel')}
        </Button>
        <Button
          type='button'
          onClick={handleImport}
          disabled={isImporting || !selectedPlayer}
          size='sm'
        >
          {isImporting ? (
            t('importing')
          ) : (
            <>
              <Import className='mr-2 h-4 w-4' />
              {t('importPlayer')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Create a new component for the initial selection screen in the sidebar
function PlayerAdditionSelector({
  onSelectOption,
  t
}: {
  onSelectOption: (option: 'existing' | 'create' | 'import') => void;
  t: any;
}) {
  return (
    <div className='space-y-4 pt-4'>
      <h3 className='text-lg font-medium'>{t('addPlayerOptions')}</h3>
      <p className='mb-4 text-sm text-muted-foreground'>
        {t('selectAddPlayerMethod')}
      </p>

      <div className='space-y-3'>
        <Button
          onClick={() => onSelectOption('existing')}
          variant='outline'
          className='w-full justify-start text-left'
        >
          <UserPlus className='mr-2 h-4 w-4' />
          <div>
            <div className='font-medium'>{t('addExistingPlayer')}</div>
            <div className='text-xs text-muted-foreground'>
              {t('addExistingPlayerDesc')}
            </div>
          </div>
        </Button>

        <Button
          onClick={() => onSelectOption('create')}
          variant='outline'
          className='w-full justify-start text-left'
        >
          <Plus className='mr-2 h-4 w-4' />
          <div>
            <div className='font-medium'>{t('createNewPlayer')}</div>
            <div className='text-xs text-muted-foreground'>
              {t('createPlayerDesc')}
            </div>
          </div>
        </Button>

        <Button
          onClick={() => onSelectOption('import')}
          variant='outline'
          className='w-full justify-start text-left'
        >
          <Import className='mr-2 h-4 w-4' />
          <div>
            <div className='font-medium'>{t('importFromPlaytomic')}</div>
            <div className='text-xs text-muted-foreground'>
              {t('importPlayerDesc')}
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
}

// Main component
export default function TournamentClientPage({
  tournamentId
}: {
  tournamentId: string;
}) {
  const t = useTranslations('Dashboard');
  const errorT = useTranslations('Errors');
  const callApi = useApi();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Players and Couples state
  const [tournamentPlayers, setTournamentPlayers] = useState<
    TournamentPlayer[]
  >([]);
  const [couples, setCouples] = useState<Couple[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingCouples, setLoadingCouples] = useState(false);
  const [loadingAllPlayers, setLoadingAllPlayers] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [addingPlayer, setAddingPlayer] = useState(false);

  // Player creation/import state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add state for player addition mode
  const [playerAdditionMode, setPlayerAdditionMode] = useState<
    'selection' | 'existing' | 'create' | 'import'
  >('selection');

  // Add state for player deletion
  const [playerToDelete, setPlayerToDelete] = useState<number | null>(null);
  const [isDeletingPlayer, setIsDeletingPlayer] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchTournamentDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await callApi(`/tournament/${tournamentId}`);

        if (!response.ok) {
          throw new Error(t('failedToFetchTournament'));
        }

        const data = await response.json();
        setTournament(data);
      } catch (err) {
        console.error('Error fetching tournament details:', err);
        setError(
          err instanceof Error ? err.message : errorT('somethingWentWrong')
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (tournamentId) {
      fetchTournamentDetails();
    }
  }, [callApi, tournamentId, t, errorT]);

  // Fetch tournament players when tab is active
  useEffect(() => {
    if (activeTab === 'players' && tournamentId) {
      fetchTournamentPlayers();
      fetchTournamentCouples();
    }
  }, [activeTab, tournamentId]);

  // Function to fetch tournament players
  const fetchTournamentPlayers = async () => {
    try {
      setLoadingPlayers(true);
      const response = await callApi(`/tournament/${tournamentId}/player/`);

      if (!response.ok) {
        throw new Error(t('failedLoadPlayers'));
      }

      const data = await response.json();
      setTournamentPlayers(data);
    } catch (error) {
      console.error('Error fetching tournament players:', error);
      toast.error(t('failedLoadPlayers'));
    } finally {
      setLoadingPlayers(false);
    }
  };

  // Function to fetch tournament couples
  const fetchTournamentCouples = async () => {
    try {
      setLoadingCouples(true);
      const response = await callApi(`/tournament/${tournamentId}/couple/`);

      if (!response.ok) {
        throw new Error(t('failedLoadCouples'));
      }

      const data = await response.json();
      setCouples(data);
    } catch (error) {
      console.error('Error fetching tournament couples:', error);
      toast.error(t('failedLoadCouples'));
    } finally {
      setLoadingCouples(false);
    }
  };

  // Function to fetch all players
  const fetchAllPlayers = async () => {
    try {
      setLoadingAllPlayers(true);
      const response = await callApi('/player/');

      if (!response.ok) {
        throw new Error(t('failedLoadPlayers'));
      }

      const data = await response.json();
      setAllPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error(t('failedLoadPlayers'));
    } finally {
      setLoadingAllPlayers(false);
    }
  };

  // Add player to tournament
  const addPlayerToTournament = async (playerId: number) => {
    try {
      // Check if tournament player limit is reached
      if (tournament && tournamentPlayers.length >= tournament.players_number) {
        toast.error(
          t('playerLimitReached', {
            number: tournament.players_number
          })
        );
        return;
      }

      setAddingPlayer(true);
      const response = await callApi('/tournament/player/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tournament_id: tournamentId,
          player_id: playerId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('failedAddPlayer'));
      }

      toast.success(t('playerAdded'));
      fetchTournamentPlayers(); // Refresh the list
      // Don't close the sidebar automatically to allow adding multiple players
      // Let the user close it manually when they're done
    } catch (error) {
      console.error('Error adding player to tournament:', error);
      toast.error(
        error instanceof Error ? error.message : t('failedAddPlayer')
      );
    } finally {
      setAddingPlayer(false);
    }
  };

  // Function to handle player creation and automatic addition to tournament
  const handlePlayerCreated = async (playerId: number) => {
    await addPlayerToTournament(playerId);
    // Return to selection screen after player creation
    setPlayerAdditionMode('selection');
    fetchAllPlayers(); // Refresh the player list in the background
  };

  // Function to handle player import and automatic addition to tournament
  const handlePlayerImported = async (playerId: number) => {
    await addPlayerToTournament(playerId);
    // Return to selection screen after player import
    setPlayerAdditionMode('selection');
    fetchAllPlayers(); // Refresh the player list in the background
  };

  // Calculate player count percentage
  const getPlayerCountProgress = () => {
    if (!tournament || tournament.players_number === 0) return 0;
    return (tournamentPlayers.length / tournament.players_number) * 100;
  };

  // Check if player limit is reached
  const isPlayerLimitReached = (): boolean => {
    return Boolean(
      tournament && tournamentPlayers.length >= tournament.players_number
    );
  };

  // Function to filter players
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredPlayers =
    searchQuery.trim() === ''
      ? allPlayers
      : allPlayers.filter(
          (player) =>
            player.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (player.name &&
              player.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (player.surname &&
              player.surname
                .toLowerCase()
                .includes(searchQuery.toLowerCase())) ||
            (player.email &&
              player.email.toLowerCase().includes(searchQuery.toLowerCase()))
        );

  // Function to handle the player addition mode selection
  const handlePlayerAdditionModeSelect = (
    mode: 'existing' | 'create' | 'import'
  ) => {
    setPlayerAdditionMode(mode);

    // If selecting existing, make sure we fetch all players
    if (mode === 'existing' && allPlayers.length === 0) {
      fetchAllPlayers();
    }
  };

  // Function to go back to selection screen
  const handleBackToSelection = () => {
    setPlayerAdditionMode('selection');
  };

  // Then update the renderPlayerAdditionOptions function to show the appropriate content based on mode
  const renderPlayerAdditionOptions = () => {
    // When sidebar is initially opened, show selection screen
    if (playerAdditionMode === 'selection') {
      return (
        <PlayerAdditionSelector
          onSelectOption={handlePlayerAdditionModeSelect}
          t={t}
        />
      );
    }

    // Show back button when in any specific mode
    const renderBackButton = () => (
      <Button
        variant='ghost'
        size='sm'
        onClick={handleBackToSelection}
        className='mb-4'
      >
        <ArrowLeft className='mr-2 h-4 w-4' />
        {t('backToOptions')}
      </Button>
    );

    // Existing players mode
    if (playerAdditionMode === 'existing') {
      return (
        <div className='pt-4'>
          {renderBackButton()}
          <div className='mb-4 flex items-center space-x-2'>
            <Input
              placeholder={t('searchPlayers')}
              value={searchQuery}
              onChange={handleSearchChange}
              className='flex-1'
            />
            <Button
              variant='outline'
              size='icon'
              onClick={() => {
                setSearchQuery('');
                fetchAllPlayers();
              }}
              title={t('refresh')}
            >
              <RefreshCw className='h-4 w-4' />
            </Button>
          </div>

          {loadingAllPlayers ? (
            <div className='space-y-2 py-6'>
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-full' />
            </div>
          ) : (
            <ScrollArea className='h-[calc(100vh-320px)]'>
              <div className='space-y-2 pr-4'>
                {filteredPlayers.length === 0 ? (
                  <p className='py-4 text-center text-muted-foreground'>
                    {t('noPlayersFound')}
                  </p>
                ) : (
                  filteredPlayers.map((player) => (
                    <div
                      key={player.id}
                      className='flex w-full items-center rounded-md border p-2'
                    >
                      <Avatar className='mr-2 h-8 w-8'>
                        <AvatarImage
                          src={player.picture || ''}
                          alt={player.nickname}
                        />
                        <AvatarFallback>
                          {getInitials(player.nickname)}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex-1'>
                        <p className='text-sm font-medium'>{player.nickname}</p>
                        <p className='text-xs text-muted-foreground'>
                          {t('level')}: {formatPlayerLevel(player.level)}
                        </p>
                      </div>
                      <Button
                        size='sm'
                        onClick={() => addPlayerToTournament(player.id)}
                        disabled={
                          addingPlayer ||
                          tournamentPlayers.some(
                            (tp) => tp.player_id === player.id
                          ) ||
                          isPlayerLimitReached()
                        }
                      >
                        {tournamentPlayers.some(
                          (tp) => tp.player_id === player.id
                        )
                          ? t('added')
                          : addingPlayer
                            ? t('adding')
                            : t('add')}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      );
    }

    // Create player mode
    if (playerAdditionMode === 'create') {
      return (
        <div className='pt-4'>
          {renderBackButton()}
          <h4 className='mb-4 text-sm font-medium'>{t('createNewPlayer')}</h4>
          <CreatePlayerForm
            onPlayerCreated={(playerId) => {
              handlePlayerCreated(playerId);
              // Now returns to selection mode after creation
            }}
            onCancel={handleBackToSelection}
            t={t}
          />
        </div>
      );
    }

    // Import from Playtomic mode
    if (playerAdditionMode === 'import') {
      return (
        <div className='pt-4'>
          {renderBackButton()}
          <h4 className='mb-4 text-sm font-medium'>
            {t('importFromPlaytomic')}
          </h4>
          <ImportPlaytomicPlayer
            onPlayerImported={(playerId) => {
              handlePlayerImported(playerId);
              // Now returns to selection mode after import
            }}
            onCancel={handleBackToSelection}
            t={t}
          />
        </div>
      );
    }

    return null;
  };

  // Reset player addition mode when sidebar is closed
  useEffect(() => {
    if (!isSidebarOpen) {
      setPlayerAdditionMode('selection');
    }
  }, [isSidebarOpen]);

  // When using the main "Add Player" button in the card, directly go to existing players mode
  const handleOpenSidebarToExistingPlayers = () => {
    setIsSidebarOpen(true);
    setPlayerAdditionMode('existing');
    if (allPlayers.length === 0) {
      fetchAllPlayers();
    }
  };

  // Add function to handle player deletion
  const handleDeletePlayer = (playerId: number) => {
    setPlayerToDelete(playerId);
    setShowDeleteDialog(true);
  };

  // Add function to confirm and execute player deletion
  const confirmDeletePlayer = async () => {
    if (!playerToDelete) return;

    try {
      setIsDeletingPlayer(true);
      const response = await callApi(
        `/tournament/${tournamentId}/player/${playerToDelete}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error(t('failedToRemovePlayer'));
      }

      toast.success(t('playerRemoved'));

      // Refresh both players and couples lists
      fetchTournamentPlayers();
      fetchTournamentCouples();
    } catch (error) {
      console.error('Error removing player from tournament:', error);
      toast.error(
        error instanceof Error ? error.message : t('failedToRemovePlayer')
      );
    } finally {
      setIsDeletingPlayer(false);
      setShowDeleteDialog(false);
      setPlayerToDelete(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className='space-y-8'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-10 w-64' />
          <Skeleton className='h-10 w-20' />
        </div>
        <Skeleton className='h-8 w-full' />
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-32' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='rounded-md bg-destructive/15 p-4 text-destructive'>
        <p>{error}</p>
        <Button
          variant='outline'
          onClick={() => window.location.reload()}
          className='mt-4'
        >
          {t('tryAgain')}
        </Button>
      </div>
    );
  }

  // No tournament data
  if (!tournament) {
    return (
      <div className='flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center'>
        <h3 className='mb-2 text-lg font-semibold'>
          {t('tournamentNotFound')}
        </h3>
        <p className='mb-4 text-sm text-muted-foreground'>
          {t('tournamentNotFoundDesc')}
        </p>
        <Link href='/dashboard/tournament/overview'>
          <Button>{t('backToTournaments')}</Button>
        </Link>
      </div>
    );
  }

  // Tournament exists, display content with tabs
  const status = getTournamentStatus(tournament);
  const startDate = new Date(tournament.start_date);
  const endDate = new Date(tournament.end_date);

  return (
    <div className='space-y-6'>
      {/* Back button and title section */}
      <div className='flex flex-col space-y-2 md:flex-row md:items-center md:justify-between'>
        <div>
          <Link
            href='/dashboard/tournament/overview'
            className='mb-2 flex items-center text-sm font-medium text-muted-foreground hover:text-primary'
          >
            <ArrowLeft className='mr-1 h-4 w-4' />
            {t('backTo')} {t('tournament')}
          </Link>
          <Heading
            title={tournament.name}
            description={tournament.description}
          />
        </div>
        <div>
          <Badge
            variant={
              status === 'ongoing'
                ? 'default'
                : status === 'upcoming'
                  ? 'outline'
                  : 'secondary'
            }
            className='text-base'
          >
            {t(status)}
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Tab navigation */}
      <Tabs
        defaultValue='overview'
        value={activeTab}
        onValueChange={setActiveTab}
        className='w-full'
      >
        <TabsList className='mb-4 w-full justify-start overflow-auto sm:w-auto'>
          <TabsTrigger value='overview'>{t('overview')}</TabsTrigger>
          <TabsTrigger value='manage'>{t('manage')}</TabsTrigger>
          <TabsTrigger value='players'>{t('playersAndTeams')}</TabsTrigger>
          <TabsTrigger value='leaderboard'>{t('leaderboard')}</TabsTrigger>
          <TabsTrigger value='games'>{t('games')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab Content */}
        <TabsContent value='overview' className='space-y-6'>
          {/* Tournament Header Info */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            {/* Tournament Image */}
            <Card className='overflow-hidden'>
              <div className='relative h-64 w-full'>
                {tournament.images && tournament.images.length > 0 ? (
                  <Image
                    src={tournament.images[0]}
                    alt={tournament.name}
                    fill
                    className='object-cover'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center bg-muted'>
                    <span className='text-muted-foreground'>
                      {t('noItemsFound')}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Tournament Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t('tournamentDetails')}</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-5 w-5 text-muted-foreground' />
                  <div>
                    <div className='font-medium'>{t('dates')}</div>
                    <div className='text-sm text-muted-foreground'>
                      {formatDate(startDate)} - {formatDate(endDate)}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      {formatTime(startDate)} - {formatTime(endDate)}
                    </div>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <Users className='h-5 w-5 text-muted-foreground' />
                  <div>
                    <div className='font-medium'>{t('players')}</div>
                    <div className='text-sm text-muted-foreground'>
                      {tournament.players_number} {t('players').toLowerCase()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full Description */}
          {tournament.full_description && (
            <Card>
              <CardHeader>
                <CardTitle>{t('fullDescription')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='prose dark:prose-invert max-w-none'>
                  {renderLexicalDescription(tournament.full_description)}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Manage Tab Content */}
        <TabsContent value='manage' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>
                {t('manage')} {t('tournament')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>{t('managementOptions')}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Players & Teams Tab Content */}
        <TabsContent value='players' className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {/* Tournament Players Card */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <div>
                  <CardTitle>{t('players')}</CardTitle>
                  <CardDescription className='mt-1.5 flex items-center'>
                    <Users className='mr-1 h-4 w-4' />
                    {tournamentPlayers.length} / {tournament.players_number}{' '}
                    {t('players').toLowerCase()}
                  </CardDescription>
                </div>
                <Sheet
                  open={isSidebarOpen}
                  onOpenChange={(open) => {
                    setIsSidebarOpen(open);
                    if (open) {
                      fetchAllPlayers();
                    }
                  }}
                >
                  <SheetTrigger asChild>
                    <Button
                      size='sm'
                      className='gap-1'
                      disabled={isPlayerLimitReached()}
                    >
                      <UserPlus className='h-4 w-4' />
                      {t('addPlayer')}
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side='right'
                    className='w-full overflow-y-auto sm:max-w-md'
                  >
                    <SheetHeader>
                      <SheetTitle>{t('addPlayerToTournament')}</SheetTitle>
                      {isPlayerLimitReached() && (
                        <Alert variant='destructive' className='mt-4'>
                          <AlertCircle className='h-4 w-4' />
                          <AlertDescription>
                            {t('playerLimitReached', {
                              number: tournament.players_number
                            })}
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className='mt-2'>
                        <div className='mb-1 flex justify-between text-sm'>
                          <span>
                            {t('players')}: {tournamentPlayers.length} /{' '}
                            {tournament.players_number}
                          </span>
                          <span>{Math.round(getPlayerCountProgress())}%</span>
                        </div>
                        <Progress
                          value={getPlayerCountProgress()}
                          className='h-2'
                        />
                      </div>
                    </SheetHeader>

                    {/* Player addition content based on selected mode */}
                    {renderPlayerAdditionOptions()}
                  </SheetContent>
                </Sheet>
              </CardHeader>
              <CardContent>
                <div className='mb-4'>
                  <div className='mb-1 flex justify-between text-sm'>
                    <span>
                      {t('players')}: {tournamentPlayers.length} /{' '}
                      {tournament.players_number}
                    </span>
                    <span>{Math.round(getPlayerCountProgress())}%</span>
                  </div>
                  <Progress value={getPlayerCountProgress()} className='h-2' />
                </div>

                {loadingPlayers ? (
                  <div className='space-y-2'>
                    <Skeleton className='h-12 w-full' />
                    <Skeleton className='h-12 w-full' />
                    <Skeleton className='h-12 w-full' />
                  </div>
                ) : tournamentPlayers.length === 0 ? (
                  <div className='rounded-md border py-8 text-center'>
                    <p className='mb-4 text-muted-foreground'>
                      {t('noPlayersAdded')}
                    </p>
                    <Button
                      size='sm'
                      onClick={handleOpenSidebarToExistingPlayers}
                      className='gap-1'
                      disabled={isPlayerLimitReached()}
                    >
                      <UserPlus className='h-4 w-4' />
                      {t('addPlayer')}
                    </Button>
                  </div>
                ) : (
                  <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'>
                    {tournamentPlayers.map((tp) => (
                      <PlayerCard
                        key={tp.id}
                        player={tp.player}
                        t={t}
                        onDelete={handleDeletePlayer}
                        disableDelete={isDeletingPlayer}
                      />
                    ))}
                  </div>
                )}

                {isPlayerLimitReached() && tournamentPlayers.length > 0 && (
                  <Alert className='mt-4'>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription>
                      {t('playerLimitReached', {
                        number: tournament.players_number
                      })}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Tournament Couples Card */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle>{t('couples')}</CardTitle>
                <Button size='sm' className='gap-1'>
                  <Plus className='h-4 w-4' />
                  {t('createCouple')}
                </Button>
              </CardHeader>
              <CardContent>
                {loadingCouples ? (
                  <div className='space-y-2'>
                    <Skeleton className='h-20 w-full' />
                    <Skeleton className='h-20 w-full' />
                  </div>
                ) : couples.length === 0 ? (
                  <div className='rounded-md border py-8 text-center'>
                    <p className='mb-4 text-muted-foreground'>
                      {t('noCouplesCreated')}
                    </p>
                    <Button size='sm' className='gap-1'>
                      <Plus className='h-4 w-4' />
                      {t('createCouple')}
                    </Button>
                  </div>
                ) : (
                  <div className='grid grid-cols-1 gap-2'>
                    {couples.map((couple) => (
                      <CoupleCard key={couple.id} couple={couple} t={t} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leaderboard Tab Content */}
        <TabsContent value='leaderboard' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>{t('leaderboard')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>{t('leaderboardDesc')}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Games Tab Content */}
        <TabsContent value='games' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>
                {t('tournament')} {t('games')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>{t('gamesDesc')}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add the confirmation dialog to the component's JSX */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('removePlayerFromTournament')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('removePlayerConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingPlayer}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePlayer}
              disabled={isDeletingPlayer}
              className='bg-destructive hover:bg-destructive/90'
            >
              {isDeletingPlayer ? t('removing') : t('remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
