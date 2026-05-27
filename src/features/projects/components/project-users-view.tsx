/**
 * @file: src/features/projects/components/project-users-view.tsx
 * @description: Компонент управления пользователями проекта
 * @project: SaaS Bonus System
 * @dependencies: React, data table components
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectUsers } from '@/features/bonuses/hooks/use-project-users';
import { BonusStatsCards } from '@/features/bonuses/components/bonus-stats-cards';
import {
  ArrowLeft,
  Plus,
  Users,
  Search,
  Gift,
  Minus,
  Calendar,
  Phone,
  Mail,
  User as UserIcon,
  Badge as BadgeIcon,
  Target,
  TrendingUp,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { Loader2 } from 'lucide-react';
import * as xlsx from 'xlsx';
import type { Project, User, Bonus } from '@/types/bonus';
import type { DisplayUser } from '@/features/bonuses/types';
import { UserCreateDialog } from './user-create-dialog';
import { UserImportDialog } from './user-import-dialog';
import { UsersTable } from '../../bonuses/components/users-table';
import { UserMetadataSection } from '../../bonuses/components/user-metadata-section';
import { UserReferralsSection } from '../../bonuses/components/user-referrals-section';
import {
  PARTNER_ROLE_OPTIONS,
  PartnerRoleBadge,
  getPartnerRoleLabel
} from '../../bonuses/components/partner-role-badge';
import { BonusAwardDialog } from './bonus-award-dialog';
import { EnhancedBulkActionsToolbar } from '@/features/bonuses/components/enhanced-bulk-actions-toolbar';
import { RichNotificationDialog } from '@/features/bonuses/components/rich-notification-dialog';

interface ProjectUsersViewProps {
  projectId: string;
}

interface UserWithBonuses extends User {
  totalBonuses: number;
  activeBonuses: number;
  lastActivity: Date | null;
  bonusBalance?: number;
  totalEarned?: number;
  level?: any; // BonusLevel
  progressToNext?: {
    nextLevel: any; // BonusLevel
    amountNeeded: number;
    progressPercent: number;
  };
}

export function ProjectUsersView({ projectId }: ProjectUsersViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Состояние поискового запроса для UI (обновляется сразу)
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('search') || '';
    }
    return '';
  });

  // Debounced значение для API запросов (обновляется после остановки ввода)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchQuery);

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [pageSize, setPageSize] = useState(50);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<
    'bonus_award' | 'bonus_deduct' | 'notification'
  >('bonus_award');
  const [profileUser, setProfileUser] = useState<UserWithBonuses | null>(null);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isSelectAllMode, setIsSelectAllMode] = useState(false);

  // Phase 2 b2b-referral-hierarchy: фильтр по партнёрской роли (мульти-выбор).
  // Когда у проекта `enablePartnerRoles = false`, фильтр скрывается и не применяется.
  const [roleFilter, setRoleFilter] = useState<
    Array<'CLIENT' | 'TRAINER' | 'MANAGER' | 'DIRECTOR'>
  >([]);

  // Phase 2: локальные значения селекторов в диалоге профиля
  // (роль и outbound-план) и состояние сохранения.
  const [profileRole, setProfileRole] = useState<
    'CLIENT' | 'TRAINER' | 'MANAGER' | 'DIRECTOR'
  >('CLIENT');
  const [profileOutboundPlanId, setProfileOutboundPlanId] = useState<
    string | null
  >(null);
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  const [referralPlans, setReferralPlans] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Users management hook
  const {
    users,
    isLoading: usersLoading,
    error: usersError,
    totalUsers,
    activeUsers,
    totalBonuses,
    currentPage,
    totalPages,
    loadUsers,
    setSearchTerm
  } = useProjectUsers({
    projectId,
    pageSize,
    searchTerm: debouncedSearchTerm,
    roles: roleFilter
  });

  // Debounced обработчик поиска (согласно документации Next.js)
  // Определяем после получения loadUsers из хука
  const handleDebouncedSearch = useDebouncedCallback((term: string) => {
    setDebouncedSearchTerm(term);
    setSearchTerm(term);
    // Сбрасываем на первую страницу при новом поиске
    loadUsers(1);
  }, 400);

  // Обработчики пагинации
  const handlePageChange = useCallback(
    (page: number) => {
      loadUsers(page);
    },
    [loadUsers]
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      setPageSize(newPageSize);
      // При изменении размера страницы возвращаемся на первую страницу
      loadUsers(1);
    },
    [loadUsers]
  );

  const handleUserProfile = useCallback(
    async (user: DisplayUser) => {
      // Устанавливаем базовые данные пользователя
      setProfileUser(user as unknown as UserWithBonuses);

      // Phase 2: подтянем актуальные роль и outbound-план из единого GET
      // /api/projects/[id]/users/[userId] — список может быть кэширован.
      const initialRole =
        ((user as any).partnerRole as
          | 'CLIENT'
          | 'TRAINER'
          | 'MANAGER'
          | 'DIRECTOR'
          | undefined) || 'CLIENT';
      setProfileRole(initialRole);
      setProfileOutboundPlanId(
        ((user as any).outboundReferralPlanId as string | null | undefined) ??
          null
      );

      // Загружаем свежий баланс из транзакций для унификации с ботом
      try {
        const response = await fetch(
          `/api/projects/${projectId}/users/${user.id}/balance`,
          { cache: 'no-store' }
        );
        if (response.ok) {
          const balanceData = await response.json();
          if (balanceData.success && balanceData.balanceDetails) {
            // Обновляем баланс в профиле из транзакций
            setProfileUser((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                bonusBalance: Number(balanceData.balanceDetails.currentBalance),
                totalEarned: Number(balanceData.balanceDetails.totalEarned),
                totalSpent: Number(balanceData.balanceDetails.totalSpent)
              };
            });
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки баланса пользователя:', error);
        // В случае ошибки оставляем данные из списка пользователей
      }

      // Phase 2: если включён b2b-флаг, дозагружаем актуальные partnerRole
      // и outboundReferralPlanId из API одиночного юзера (на случай, если
      // в списке они устарели).
      if ((project as any)?.enablePartnerRoles) {
        try {
          const detailRes = await fetch(
            `/api/projects/${projectId}/users/${user.id}`,
            { cache: 'no-store' }
          );
          if (detailRes.ok) {
            const data = await detailRes.json();
            const fresh = data?.user;
            if (fresh) {
              if (fresh.partnerRole) {
                setProfileRole(
                  fresh.partnerRole as
                    | 'CLIENT'
                    | 'TRAINER'
                    | 'MANAGER'
                    | 'DIRECTOR'
                );
              }
              if ('outboundReferralPlanId' in fresh) {
                setProfileOutboundPlanId(fresh.outboundReferralPlanId ?? null);
              }
            }
          }
        } catch (error) {
          console.error(
            'Не удалось загрузить актуальные данные пользователя:',
            error
          );
        }
      }
    },
    [projectId, project]
  );

  // Stats data
  const statsData = {
    totalUsers,
    activeUsers,
    totalBonuses,
    expiringSoonBonuses: Math.floor(totalBonuses * 0.15), // Mock для демо
    monthlyGrowth: 12 // Mock для демо
  };

  // Dialog states
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showRichNotificationDialog, setShowRichNotificationDialog] =
    useState(false);
  const [showBonusDialog, setShowBonusDialog] = useState(false);
  const [showDeductionDialog, setShowDeductionDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyUserId, setHistoryUserId] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithBonuses | null>(
    null
  );
  const [deductionAmount, setDeductionAmount] = useState('');
  const [deductionDescription, setDeductionDescription] = useState('');
  const [isDeducting, setIsDeducting] = useState(false);

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Создание группы из выбранных пользователей
  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите название группы и выберите пользователей',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Создаем сегмент типа MANUAL
      const response = await fetch(`/api/projects/${projectId}/segments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          description: `Группа из ${selectedUsers.length} пользователей`,
          type: 'MANUAL',
          rules: {} // Пустые правила для ручной группы
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка создания группы');
      }

      const segment = await response.json();

      // Добавляем пользователей в группу
      const addMemberResponses = await Promise.all(
        selectedUsers.map((userId) =>
          fetch(`/api/projects/${projectId}/segments/${segment.id}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          })
        )
      );

      const allAdded = addMemberResponses.every((r) => r.ok);
      if (!allAdded) {
        throw new Error('Не все пользователи были добавлены в группу');
      }

      toast({
        title: 'Успешно',
        description: `Группа "${groupName}" создана с ${selectedUsers.length} пользователями`
      });

      setShowCreateGroupDialog(false);
      setGroupName('');
      setSelectedUsers([]);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать группу',
        variant: 'destructive'
      });
      console.error('Error creating group:', error);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) return;
    if (!confirm(`Удалить выбранных пользователей (${selectedUsers.length})?`))
      return;
    try {
      const responses = await Promise.all(
        selectedUsers.map((uid) =>
          fetch(`/api/projects/${projectId}/users/${uid}`, { method: 'DELETE' })
        )
      );
      const ok = responses.every((r) => r.ok);
      if (ok) {
        setSelectedUsers([]);
        loadUsers(currentPage); // Перезагружаем данные
        toast({ title: 'Пользователи удалены' });
      } else {
        toast({
          title: 'Часть пользователей не удалена',
          variant: 'destructive'
        });
      }
    } catch (e) {
      toast({ title: 'Ошибка удаления', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (user: DisplayUser) => {
    if (!confirm(`Удалить пользователя ${user.email || 'без email'}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/users/${user.id}`,
        {
          method: 'DELETE'
        }
      );

      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Пользователь удален'
        });
        loadUsers(currentPage); // Перезагружаем данные
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось удалить пользователя',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при удалении пользователя',
        variant: 'destructive'
      });
    }
  };

  // Select all users
  const selectAllUsers = () => {
    setSelectedUsers(users.map((user) => user.id));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedUsers([]);
  };

  // Обработчик изменения поискового запроса (обновляет UI сразу, без debounce)
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      // Запускаем debounced обновление поискового запроса
      handleDebouncedSearch(query);
    },
    [handleDebouncedSearch]
  );

  // Синхронизация поискового запроса с URL только при первом монтировании
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSearch = params.get('search') || '';
      if (urlSearch && urlSearch !== searchQuery && searchQuery === '') {
        setSearchQuery(urlSearch);
        setDebouncedSearchTerm(urlSearch);
        setSearchTerm(urlSearch);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Запускаем только при монтировании - инициализация из URL

  // Загружаем проект при монтировании
  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          setProject(projectData);
        }
      } catch (error) {
        console.error('Ошибка загрузки проекта:', error);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  // Phase 2 b2b-referral-hierarchy (task 2.7): подгружаем список планов
  // комиссий проекта, когда у проекта включена партнёрская иерархия.
  // Используем существующий GET /api/projects/[id]/referral-commission-plans.
  const partnerRolesEnabled = Boolean((project as any)?.enablePartnerRoles);
  useEffect(() => {
    if (!projectId) return;
    if (!partnerRolesEnabled) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/projects/${projectId}/referral-commission-plans`,
          { cache: 'no-store' }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const list: Array<{ id: string; name: string }> = Array.isArray(
          data?.plans
        )
          ? data.plans.map((p: any) => ({
              id: String(p.id),
              name: String(p.name)
            }))
          : [];
        setReferralPlans(list);
      } catch (error) {
        console.error('Не удалось загрузить планы реферальных %', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, partnerRolesEnabled]);

  const handleExportCSV = useCallback(async () => {
    try {
      // Получаем все данные без пагинации
      const response = await fetch(
        `/api/projects/${projectId}/users?limit=10000`
      );
      if (!response.ok) {
        throw new Error('Не удалось получить данные пользователей');
      }

      const allUsers = await response.json();
      const usersArray = Array.isArray(allUsers?.users) ? allUsers.users : [];

      // Создаем CSV
      const headers = [
        'ID',
        'Имя',
        'Email',
        'Телефон',
        'Telegram ID',
        'Активные бонусы',
        'Всего бонусов',
        'Дата регистрации',
        'Статус',
        'Уровень'
      ];

      const csvData = usersArray.map((user: any) => [
        user.id || '',
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`.trim()
          : user.email || '',
        user.email || '',
        user.phone || '',
        user.telegramId || '',
        user.bonusBalance || 0,
        user.totalEarned || 0,
        user.registeredAt
          ? new Date(user.registeredAt).toLocaleDateString('ru-RU')
          : '',
        user.isActive ? 'Активен' : 'Неактивен',
        user.currentLevel || 'Базовый'
      ]);

      // Добавляем заголовки
      csvData.unshift(headers);

      // Конвертируем в CSV строку
      const csvContent = csvData
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
        .join('\n');

      // Создаем и скачиваем файл
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `project-users-${projectId}-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Экспорт завершен',
        description: `Экспортировано ${usersArray.length} пользователей`
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      toast({
        title: 'Ошибка экспорта CSV',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  }, [projectId, toast]);

  const handleExportExcel = useCallback(async () => {
    try {
      // Получаем все данные (пагинация отключена благодаря высокому лимиту)
      const response = await fetch(
        `/api/projects/${projectId}/users?limit=1000000`
      );
      if (!response.ok) {
        throw new Error('Не удалось получить данные пользователей');
      }

      const allUsers = await response.json();
      const usersArray = Array.isArray(allUsers?.users) ? allUsers.users : [];

      const excelData = usersArray.map((user: any) => ({
        ID: user.id || '',
        Имя:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`.trim()
            : user.email || '',
        Email: user.email || '',
        Телефон: user.phone || '',
        'Telegram ID': user.telegramId || '',
        'Активные бонусы': user.bonusBalance || 0,
        'Всего бонусов': user.totalEarned || 0,
        'Дата регистрации': user.registeredAt
          ? new Date(user.registeredAt).toLocaleDateString('ru-RU')
          : '',
        Статус: user.isActive ? 'Активен' : 'Неактивен',
        Уровень: user.currentLevel || 'Базовый'
      }));

      const worksheet = xlsx.utils.json_to_sheet(excelData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Users');

      xlsx.writeFile(
        workbook,
        `project-users-${projectId}-${new Date().toISOString().split('T')[0]}.xlsx`
      );

      toast({
        title: 'Экспорт Excel завершен',
        description: `Экспортировано ${usersArray.length} пользователей`
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      toast({
        title: 'Ошибка экспорта Excel',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  }, [projectId, toast]);

  const handleCreateUser = (newUser: UserWithBonuses) => {
    console.log('Создан новый пользователь в проекте:', newUser); // Для отладки

    // Показываем уведомление сразу
    toast({
      title: 'Успех',
      description: `Пользователь ${newUser.email} создан`
    });

    // Перезагружаем данные из API
    loadUsers(currentPage);

    toast({
      title: 'Успех',
      description: 'Пользователь успешно добавлен'
    });
  };

  const handleBonusSuccess = () => {
    loadUsers(currentPage); // Перезагружаем данные для обновления балансов
    setSelectedUser(null);
  };

  /**
   * Phase 2 b2b-referral-hierarchy (tasks 2.5, 2.8): сохранить партнёрскую
   * роль и outbound-план реферальных %.
   *
   * Сохранение последовательное: сначала роль (PATCH /users/[userId]),
   * затем план (PATCH /users/[userId]/referral-outbound-plan). Если новая
   * роль — CLIENT, outbound-план принудительно сбрасывается, потому что
   * `setUserOutboundPlan` отказывает CLIENT'у при включённом флаге.
   */
  const handleSavePartnerSettings = useCallback(async () => {
    if (!profileUser || !projectId) return;
    setIsSavingPartner(true);
    try {
      // 1) Сохранение partnerRole
      const roleRes = await fetch(
        `/api/projects/${projectId}/users/${profileUser.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partnerRole: profileRole })
        }
      );
      if (!roleRes.ok) {
        const errorData = await roleRes.json().catch(() => ({}));
        throw new Error(errorData?.error || 'Не удалось сохранить роль');
      }

      // 2) Сохранение outbound-плана (только если роль не CLIENT)
      const targetPlanId =
        profileRole === 'CLIENT' ? null : profileOutboundPlanId;

      const planRes = await fetch(
        `/api/projects/${projectId}/users/${profileUser.id}/referral-outbound-plan`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outboundReferralPlanId: targetPlanId })
        }
      );
      if (!planRes.ok) {
        const errorData = await planRes.json().catch(() => ({}));
        throw new Error(
          errorData?.error || 'Не удалось сохранить outbound-план'
        );
      }

      // Обновляем локальное состояние карточки и список таблицы
      setProfileUser((prev) =>
        prev
          ? ({
              ...prev,
              partnerRole: profileRole,
              outboundReferralPlanId: targetPlanId
            } as UserWithBonuses)
          : prev
      );
      setProfileOutboundPlanId(targetPlanId);
      loadUsers(currentPage);

      toast({
        title: 'Сохранено',
        description: `Роль: ${getPartnerRoleLabel(profileRole)}`
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description:
          error instanceof Error ? error.message : 'Не удалось сохранить',
        variant: 'destructive'
      });
    } finally {
      setIsSavingPartner(false);
    }
  }, [
    profileUser,
    projectId,
    profileRole,
    profileOutboundPlanId,
    loadUsers,
    currentPage,
    toast
  ]);

  const handleOpenBonusDialog = (user: DisplayUser) => {
    // Находим полного пользователя по ID для получения всех необходимых данных
    const fullUser = users.find((u) => u.id === user.id);
    if (fullUser) {
      setSelectedUser({
        ...(fullUser as unknown as UserWithBonuses),
        totalBonuses: fullUser.bonusBalance || 0,
        activeBonuses: fullUser.bonusBalance || 0,
        lastActivity: null,
        bonusBalance: fullUser.bonusBalance || 0,
        totalEarned: fullUser.totalEarned || 0
      } as unknown as UserWithBonuses);
      setShowBonusDialog(true);
    }
  };

  const handleOpenHistoryDialog = async (userId: string) => {
    if (!projectId) return;
    setHistoryLoading(true);
    setHistoryUserId(userId);
    setHistoryPage(1);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/users/${userId}/bonuses?page=1&limit=20&aggregate=true`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      setHistoryItems(data?.transactions || []);
      setHistoryTotal(data?.total || data?.originalTotal || 0);
      setShowHistoryDialog(true);
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить историю транзакций',
        variant: 'destructive'
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadHistoryPage = async (page: number) => {
    if (!projectId || !historyUserId) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/users/${historyUserId}/bonuses?page=${page}&limit=20&aggregate=true`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      setHistoryItems(data?.transactions || []);
      setHistoryTotal(data?.total || data?.originalTotal || 0);
      setHistoryPage(page);
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить историю транзакций',
        variant: 'destructive'
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenDeductionDialog = (user: DisplayUser) => {
    setSelectedUser(user as unknown as UserWithBonuses);
    setDeductionAmount('');
    setDeductionDescription('');
    setShowDeductionDialog(true);
  };

  const handleDeductionSubmit = async () => {
    if (!selectedUser || !deductionAmount || parseFloat(deductionAmount) <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную сумму для списания',
        variant: 'destructive'
      });
      return;
    }

    if (parseFloat(deductionAmount) > selectedUser.activeBonuses) {
      toast({
        title: 'Ошибка',
        description: 'Недостаточно бонусов на балансе пользователя',
        variant: 'destructive'
      });
      return;
    }

    setIsDeducting(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/users/${selectedUser.id}/bonuses/deduct`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: parseFloat(deductionAmount),
            description:
              deductionDescription || 'Ручное списание через админ-панель'
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка списания бонусов');
      }

      const result = await response.json();

      toast({
        title: 'Успешно',
        description: `Списано ${result.deducted.amount} бонусов`
      });

      setShowDeductionDialog(false);
      setDeductionAmount('');
      setDeductionDescription('');
      loadUsers(currentPage); // Перезагружаем данные
    } catch (error) {
      toast({
        title: 'Ошибка',
        description:
          error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive'
      });
    } finally {
      setIsDeducting(false);
    }
  };

  // Фильтрация пользователей
  // Фильтрация теперь происходит на стороне API

  // Убрали проверку usersLoading для всего компонента - скелетон показывается только в таблице

  return (
    <div
      className={`flex min-w-0 flex-1 flex-col space-y-6 ${selectedUsers.length > 0 ? 'pb-24' : ''}`}
    >
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <Heading
            title={`Пользователи: ${project?.name || 'Проект'}`}
            description={`Управление пользователями и их бонусами (${totalUsers} пользователей)`}
          />
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {selectedUsers.length > 0 && (
            <Button
              variant='outline'
              onClick={() => setShowCreateGroupDialog(true)}
            >
              <Users className='mr-2 h-4 w-4' />
              Создать группу ({selectedUsers.length})
            </Button>
          )}
          <Button variant='outline' onClick={() => setShowImportDialog(true)}>
            <Upload className='mr-2 h-4 w-4' />
            Импорт CSV
          </Button>
          <Button onClick={() => setShowCreateUserDialog(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Добавить пользователя
          </Button>
        </div>
      </div>

      <Separator />

      {/* Statistics */}
      <BonusStatsCards
        stats={statsData}
        isLoading={usersLoading}
        error={usersError}
      />

      {/* Legacy Stats Cards - temporarily hidden */}
      {/*
      <div className='grid grid-cols-1 gap-6 overflow-x-hidden pr-2 md:grid-cols-5'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Всего пользователей
            </CardTitle>
            <Users className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Активных пользователей
            </CardTitle>
            <Users className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {users.filter((u) => u.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>С уровнями</CardTitle>
            <Target className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {users.filter((u) => u.level).length}
            </div>
            <p className='text-muted-foreground text-xs'>
              {
                users.filter((u) => u.level && u.level.name !== 'Базовый')
                  .length
              }{' '}
              выше базового
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Всего бонусов</CardTitle>
            <Gift className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {Number(
                users.reduce((sum, user) => sum + (user.totalBonuses || 0), 0)
              ).toFixed(2)}{' '}
              бонусов
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Активных бонусов
            </CardTitle>
            <Gift className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {Number(
                users.reduce((sum, user) => sum + (user.activeBonuses || 0), 0)
              ).toFixed(2)}{' '}
              бонусов
            </div>
          </CardContent>
        </Card>
      </div>
      */}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <CardTitle>Список пользователей</CardTitle>
              <CardDescription>
                Управление пользователями проекта и их бонусными счетами
              </CardDescription>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <div className='relative w-full sm:w-64'>
                <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  type='text'
                  placeholder='Поиск...'
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className='h-9 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden'
                  disabled={usersLoading && !debouncedSearchTerm}
                  autoComplete='off'
                  spellCheck='false'
                />
                {usersLoading && debouncedSearchTerm && (
                  <div className='pointer-events-none absolute top-1/2 right-3 -translate-y-1/2'>
                    <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />
                  </div>
                )}
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={selectAllUsers}
                disabled={users.length === 0}
              >
                Выбрать все
              </Button>
              {/* Phase 2 b2b-referral-hierarchy (task 2.3): мульти-фильтр
                  по партнёрской роли. Показываем только если у проекта
                  включён `enablePartnerRoles`. */}
              {(project as any)?.enablePartnerRoles && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm'>
                      <BadgeIcon className='mr-2 h-4 w-4' />
                      Роль
                      {roleFilter.length > 0 && (
                        <Badge
                          variant='secondary'
                          className='ml-2 px-1.5 text-xs'
                        >
                          {roleFilter.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-44'>
                    <DropdownMenuLabel>Фильтр по роли</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {PARTNER_ROLE_OPTIONS.map((opt) => (
                      <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={roleFilter.includes(opt.value)}
                        onCheckedChange={(checked) => {
                          setRoleFilter((prev) => {
                            const next = checked
                              ? Array.from(new Set([...prev, opt.value]))
                              : prev.filter((r) => r !== opt.value);
                            return next;
                          });
                          // Сброс на первую страницу при смене фильтра
                          loadUsers(1);
                        }}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {opt.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                    {roleFilter.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                          checked={false}
                          onCheckedChange={() => {
                            setRoleFilter([]);
                            loadUsers(1);
                          }}
                          onSelect={(e) => e.preventDefault()}
                        >
                          Сбросить
                        </DropdownMenuCheckboxItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                variant='default'
                size='sm'
                onClick={() => {
                  setIsSelectAllMode(true);
                  setShowRichNotificationDialog(true);
                }}
                disabled={totalUsers === 0}
              >
                <Mail className='mr-2 h-4 w-4' />
                Рассылка всем ({totalUsers})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading && debouncedSearchTerm ? (
            <div className='space-y-4 pr-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className='bg-muted h-16 animate-pulse rounded' />
              ))}
            </div>
          ) : users.length === 0 && !usersLoading ? (
            <div className='py-8 text-center'>
              <Users className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <p className='text-muted-foreground'>Пользователи не найдены</p>
              <p className='text-muted-foreground mt-2 text-sm'>
                {users.length === 0
                  ? 'В проекте пока нет пользователей'
                  : 'Попробуйте изменить поисковый запрос'}
              </p>
            </div>
          ) : (
            <UsersTable
              data={users.map((user) => ({
                ...user,
                name:
                  user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`.trim()
                    : user.email || 'Без имени',
                bonusBalance: user.bonusBalance || 0,
                activeBonuses: user.bonusBalance || 0,
                totalEarned: user.totalEarned || 0,
                createdAt: new Date(user.registeredAt),
                updatedAt: new Date(user.registeredAt),
                isActive: user.isActive !== undefined ? user.isActive : false
              }))}
              projectId={projectId}
              enablePartnerRoles={Boolean((project as any)?.enablePartnerRoles)}
              onSelectionChange={setSelectedUsers}
              onBonusAwardClick={(user: any) => handleOpenBonusDialog(user)}
              onBonusDeductClick={(user: any) =>
                handleOpenDeductionDialog(user)
              }
              onHistoryClick={handleOpenHistoryDialog}
              onProfileClick={handleUserProfile}
              onDeleteUser={handleDeleteUser}
              onUserUpdated={() => loadUsers(currentPage)}
              onExportCSV={handleExportCSV}
              onExportExcel={handleExportExcel}
              loading={usersLoading}
              totalCount={totalUsers}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserCreateDialog
        projectId={projectId}
        open={showCreateUserDialog}
        onOpenChange={setShowCreateUserDialog}
        onSuccess={handleCreateUser}
      />

      <UserImportDialog
        projectId={projectId}
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={() => loadUsers(1)}
      />

      {/* Диалог создания группы */}
      <Dialog
        open={showCreateGroupDialog}
        onOpenChange={setShowCreateGroupDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать группу пользователей</DialogTitle>
            <DialogDescription>
              Создать группу из {selectedUsers.length} выбранных пользователей
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='groupName'>Название группы</Label>
              <Input
                id='groupName'
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder='Введите название группы'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateGroup();
                  }
                }}
              />
            </div>
            <div className='text-muted-foreground text-sm'>
              В группу будет добавлено {selectedUsers.length} пользователей
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setShowCreateGroupDialog(false);
                setGroupName('');
              }}
            >
              Отмена
            </Button>
            <Button onClick={handleCreateGroup} disabled={!groupName.trim()}>
              Создать группу
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedUser && (
        <BonusAwardDialog
          projectId={projectId}
          userId={selectedUser.id}
          userName={
            selectedUser.firstName || selectedUser.lastName
              ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()
              : 'Без имени'
          }
          userContact={
            selectedUser.email ||
            selectedUser.phone ||
            `ID: ${selectedUser.id.slice(0, 8)}...`
          }
          open={showBonusDialog}
          onOpenChange={setShowBonusDialog}
          onSuccess={handleBonusSuccess}
        />
      )}

      {/* User Profile Dialog */}
      <Dialog
        open={!!profileUser}
        onOpenChange={(o) => !o && setProfileUser(null)}
      >
        <DialogContent className='max-h-[85vh] max-w-2xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Профиль пользователя</DialogTitle>
            <DialogDescription>
              Подробная информация о пользователе и его бонусном счёте
            </DialogDescription>
          </DialogHeader>
          {profileUser && (
            <div className='space-y-6'>
              <div className='flex items-center space-x-4'>
                <Avatar className='h-16 w-16'>
                  <AvatarImage
                    src={`https://api.slingacademy.com/public/sample-users/${(parseInt(profileUser.id.slice(-2), 16) % 10) + 1}.png`}
                  />
                  <AvatarFallback className='text-lg'>
                    {profileUser.firstName?.[0] || ''}
                    {profileUser.lastName?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className='text-xl font-semibold'>
                    {profileUser.firstName && profileUser.lastName
                      ? `${profileUser.firstName} ${profileUser.lastName}`.trim()
                      : profileUser.email || 'Без имени'}
                  </h3>
                  <p className='text-muted-foreground'>
                    ID: {profileUser.id.slice(0, 8)}...
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label className='text-sm font-medium'>Email</Label>
                  <p className='text-muted-foreground text-sm'>
                    {profileUser.email || 'Не указан'}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Телефон</Label>
                  <p className='text-muted-foreground text-sm'>
                    {profileUser.phone || 'Не указан'}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Активные бонусы</Label>
                  <p className='text-muted-foreground text-sm'>
                    {profileUser.bonusBalance || 0} бонусов
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>
                    Всего заработано
                  </Label>
                  <p className='text-muted-foreground text-sm'>
                    {profileUser.totalEarned || 0} бонусов
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>
                    Дата регистрации
                  </Label>
                  <p className='text-muted-foreground text-sm'>
                    {new Date(profileUser.registeredAt).toLocaleDateString(
                      'ru-RU'
                    )}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Статус</Label>
                  <p className='text-muted-foreground text-sm'>
                    {profileUser.isActive ? 'Активный' : 'Неактивный'}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Дата рождения</Label>
                  <p className='text-muted-foreground text-sm'>
                    {(profileUser as any).birthDate
                      ? new Date(
                          (profileUser as any).birthDate
                        ).toLocaleDateString('ru-RU')
                      : 'Не указана'}
                  </p>
                </div>
                {(project as any)?.operationMode === 'WITHOUT_BOT' && (
                  <div className='rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200'>
                    Режим без Telegram бота: поля Telegram скрыты, пользователи
                    активируются автоматически и могут тратить бонусы сразу.
                  </div>
                )}
                {/* Telegram поля показываем только в режиме WITH_BOT */}
                {(project as any)?.operationMode !== 'WITHOUT_BOT' && (
                  <>
                    <div>
                      <Label className='text-sm font-medium'>
                        Telegram Username
                      </Label>
                      <p className='text-muted-foreground text-sm'>
                        {profileUser.telegramUsername
                          ? `@${profileUser.telegramUsername}`
                          : 'Не указан'}
                      </p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium'>Telegram ID</Label>
                      <p className='text-muted-foreground text-sm'>
                        {profileUser.telegramId
                          ? typeof profileUser.telegramId === 'bigint'
                            ? profileUser.telegramId.toString()
                            : String(profileUser.telegramId)
                          : 'Не указан'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Phase 2 b2b-referral-hierarchy (tasks 2.4, 2.6, 2.7, 2.8):
                  селекторы партнёрской роли и outbound-плана. Показываются
                  только когда у проекта включён `enablePartnerRoles`. */}
              {(project as any)?.enablePartnerRoles && (
                <div className='bg-muted/30 space-y-4 rounded-md border p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label className='text-sm font-medium'>
                        Партнёрская иерархия
                      </Label>
                      <p className='text-muted-foreground text-xs'>
                        Текущая роль: <PartnerRoleBadge role={profileRole} />
                      </p>
                    </div>
                    <Button
                      size='sm'
                      onClick={handleSavePartnerSettings}
                      disabled={isSavingPartner}
                    >
                      {isSavingPartner && (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      )}
                      Сохранить
                    </Button>
                  </div>
                  <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                    <div className='space-y-1.5'>
                      <Label
                        htmlFor='partner-role-select'
                        className='text-xs font-medium'
                      >
                        Роль
                      </Label>
                      <Select
                        value={profileRole}
                        onValueChange={(value) => {
                          const next = value as
                            | 'CLIENT'
                            | 'TRAINER'
                            | 'MANAGER'
                            | 'DIRECTOR';
                          setProfileRole(next);
                          // Если переключаемся на CLIENT — сбрасываем outbound-план,
                          // т.к. он будет очищен при сохранении.
                          if (next === 'CLIENT') {
                            setProfileOutboundPlanId(null);
                          }
                        }}
                      >
                        <SelectTrigger id='partner-role-select'>
                          <SelectValue placeholder='Выберите роль' />
                        </SelectTrigger>
                        <SelectContent>
                          {PARTNER_ROLE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Outbound-план виден только для партнёров */}
                    {profileRole !== 'CLIENT' && (
                      <div className='space-y-1.5'>
                        <Label
                          htmlFor='outbound-plan-select'
                          className='text-xs font-medium'
                        >
                          Outbound-план комиссий
                        </Label>
                        <Select
                          value={profileOutboundPlanId ?? '__none__'}
                          onValueChange={(value) =>
                            setProfileOutboundPlanId(
                              value === '__none__' ? null : value
                            )
                          }
                          disabled={referralPlans.length === 0}
                        >
                          <SelectTrigger id='outbound-plan-select'>
                            <SelectValue
                              placeholder={
                                referralPlans.length === 0
                                  ? 'Нет планов в проекте'
                                  : 'Не назначен'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='__none__'>
                              — не назначен —
                            </SelectItem>
                            {referralPlans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className='text-muted-foreground text-xs'>
                          План применяется к тем, кого пригласит этот партнёр.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata Section */}
              <UserMetadataSection
                userId={profileUser.id}
                projectId={projectId}
                readOnly={false}
              />

              {/* Referrals Section */}
              <UserReferralsSection
                userId={profileUser.id}
                projectId={projectId}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог списания бонусов */}
      {selectedUser && (
        <Dialog
          open={showDeductionDialog}
          onOpenChange={setShowDeductionDialog}
        >
          <DialogContent className='sm:max-w-[425px]'>
            <DialogHeader>
              <DialogTitle>Списать бонусы</DialogTitle>
              <DialogDescription>
                Списание бонусов у пользователя{' '}
                {selectedUser.firstName || selectedUser.lastName
                  ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()
                  : 'Без имени'}
                <br />
                Доступно: {selectedUser.activeBonuses} бонусов
              </DialogDescription>
            </DialogHeader>

            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='amount' className='text-right'>
                  Сумма
                </Label>
                <Input
                  id='amount'
                  type='number'
                  placeholder='0'
                  value={deductionAmount}
                  onChange={(e) => setDeductionAmount(e.target.value)}
                  className='col-span-3'
                  min='0'
                  max={selectedUser.activeBonuses}
                />
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='description' className='text-right'>
                  Описание
                </Label>
                <Textarea
                  id='description'
                  placeholder='Причина списания (необязательно)'
                  value={deductionDescription}
                  onChange={(e) => setDeductionDescription(e.target.value)}
                  className='col-span-3'
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setShowDeductionDialog(false)}
                disabled={isDeducting}
              >
                Отмена
              </Button>
              <Button
                onClick={handleDeductionSubmit}
                disabled={
                  isDeducting ||
                  !deductionAmount ||
                  parseFloat(deductionAmount) <= 0
                }
                variant='destructive'
              >
                {isDeducting ? 'Списываем...' : 'Списать бонусы'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Диалог массовых операций */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>
              {bulkOperation === 'bonus_award' && 'Массовое начисление бонусов'}
              {bulkOperation === 'bonus_deduct' && 'Массовое списание бонусов'}
              {bulkOperation === 'notification' &&
                'Массовая отправка уведомлений'}
            </DialogTitle>
            <DialogDescription>
              Операция будет выполнена для {selectedUsers.length} выбранных
              пользователей
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            {(bulkOperation === 'bonus_award' ||
              bulkOperation === 'bonus_deduct') && (
              <>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='bulk-amount' className='text-right'>
                    Сумма
                  </Label>
                  <Input
                    id='bulk-amount'
                    type='number'
                    placeholder='0'
                    className='col-span-3'
                    min='0'
                  />
                </div>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='bulk-description' className='text-right'>
                    Описание
                  </Label>
                  <Textarea
                    id='bulk-description'
                    placeholder='Описание операции'
                    className='col-span-3'
                    rows={3}
                  />
                </div>
                {bulkOperation === 'bonus_award' && (
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='bulk-expires' className='text-right'>
                      Истекает
                    </Label>
                    <Input
                      id='bulk-expires'
                      type='date'
                      className='col-span-3'
                    />
                  </div>
                )}
              </>
            )}

            {bulkOperation === 'notification' && (
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='bulk-message' className='text-right'>
                  Сообщение
                </Label>
                <Textarea
                  id='bulk-message'
                  placeholder='Текст уведомления для отправки через Telegram бота'
                  className='col-span-3'
                  rows={5}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowBulkDialog(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => {
                // Логика выполнения массовой операции
                console.log('Выполняем массовую операцию:', {
                  operation: bulkOperation,
                  users: selectedUsers
                  // Здесь будут данные из формы
                });
                setShowBulkDialog(false);
                clearSelection();
              }}
            >
              {bulkOperation === 'bonus_award' && 'Начислить'}
              {bulkOperation === 'bonus_deduct' && 'Списать'}
              {bulkOperation === 'notification' && 'Отправить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Bulk Actions Toolbar */}
      <EnhancedBulkActionsToolbar
        selectedUserIds={selectedUsers}
        selectedCount={selectedUsers.length}
        onClearSelection={() => setSelectedUsers([])}
        onShowRichNotifications={() => setShowRichNotificationDialog(true)}
        onDeleteSelected={handleDeleteSelected}
      />

      {/* Rich Notification Dialog */}
      <RichNotificationDialog
        open={showRichNotificationDialog}
        onOpenChange={(open) => {
          setShowRichNotificationDialog(open);
          if (!open) setIsSelectAllMode(false);
        }}
        selectedUserIds={isSelectAllMode ? [] : selectedUsers}
        isSelectAll={isSelectAllMode}
        totalUsers={totalUsers}
        projectId={projectId}
      />

      {/* История транзакций */}
      <Dialog
        open={showHistoryDialog}
        onOpenChange={(o) => {
          setShowHistoryDialog(o);
          if (!o) {
            setHistoryUserId(null);
            setHistoryItems([]);
            setHistoryTotal(0);
            setHistoryPage(1);
          }
        }}
      >
        <DialogContent className='flex max-h-[80vh] max-w-4xl flex-col'>
          <DialogHeader>
            <DialogTitle>История транзакций</DialogTitle>
            <DialogDescription>
              Все операции с бонусами пользователя
            </DialogDescription>
          </DialogHeader>
          <div className='flex-1 overflow-hidden'>
            {historyLoading ? (
              <div className='text-muted-foreground p-6 text-center text-sm'>
                Загрузка...
              </div>
            ) : historyItems.length === 0 ? (
              <div className='text-muted-foreground p-6 text-center text-sm'>
                Нет операций
              </div>
            ) : (
              <div className='flex h-full flex-col space-y-3'>
                <div className='flex-1 overflow-auto rounded-lg border'>
                  <Table>
                    <TableHeader className='bg-background sticky top-0 z-10'>
                      <TableRow>
                        <TableHead className='w-[160px]'>Дата</TableHead>
                        <TableHead className='w-[120px] text-center'>
                          Тип
                        </TableHead>
                        <TableHead className='w-[120px] text-right'>
                          Сумма
                        </TableHead>
                        <TableHead className='min-w-[250px]'>
                          Описание
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyItems.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className='text-sm'>
                            {new Date(t.createdAt).toLocaleString('ru-RU')}
                          </TableCell>
                          <TableCell className='text-center'>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                t.type === 'EARN'
                                  ? 'bg-green-100 text-green-800'
                                  : t.type === 'SPEND'
                                    ? 'bg-red-100 text-red-800'
                                    : t.type === 'EXPIRE'
                                      ? 'bg-gray-100 text-gray-800'
                                      : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {t.type === 'EARN'
                                ? 'Начисление'
                                : t.type === 'SPEND'
                                  ? 'Списание'
                                  : t.type === 'EXPIRE'
                                    ? 'Истечение'
                                    : 'Коррекция'}
                            </span>
                          </TableCell>
                          <TableCell className='text-right font-medium'>
                            {t.type === 'EARN' ? '+' : '-'}
                            {Number(t.amount).toFixed(2)} бонусов
                          </TableCell>
                          <TableCell
                            className='text-sm break-words'
                            title={t.description || ''}
                          >
                            {t.description || '-'}
                            {t.metadata?.spendAggregatedCount ? (
                              <span className='text-muted-foreground ml-2 text-xs'>
                                (совмещено {t.metadata.spendAggregatedCount}{' '}
                                операций)
                              </span>
                            ) : null}
                            {t.type === 'EARN' &&
                            (t.userLevel ||
                              (t.metadata &&
                                (t.metadata.bonusPercent ||
                                  t.metadata.appliedPercent))) ? (
                              <div className='text-muted-foreground mt-1 text-xs'>
                                Уровень:{' '}
                                <span className='text-primary font-medium'>
                                  {t.userLevel || 'Базовый'}
                                </span>
                                {t.metadata?.bonusPercent ||
                                t.metadata?.appliedPercent
                                  ? ` (${t.metadata.bonusPercent || t.metadata.appliedPercent}% от ${t.metadata.orderTotal || 'заказа'})`
                                  : ''}
                              </div>
                            ) : null}
                            {Array.isArray(t.aggregatedTransactions) &&
                            t.aggregatedTransactions.length > 0 ? (
                              <div className='border-muted-foreground/30 bg-muted/50 text-muted-foreground mt-2 space-y-1 rounded-md border border-dashed p-2 text-xs'>
                                {t.aggregatedTransactions.map((child: any) => (
                                  <div
                                    key={child.id}
                                    className='flex flex-wrap items-center justify-between gap-2'
                                  >
                                    <span>
                                      {new Date(child.createdAt).toLocaleString(
                                        'ru-RU'
                                      )}
                                    </span>
                                    <span className='text-destructive font-medium'>
                                      -{Number(child.amount).toFixed(2)} бонусов
                                    </span>
                                    {child.metadata?.spentFromBonusId ? (
                                      <span className='opacity-70'>
                                        ID бонуса:{' '}
                                        {child.metadata.spentFromBonusId}
                                      </span>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className='flex items-center justify-between border-t pt-4 text-sm'>
                  <span className='text-muted-foreground'>
                    Показано{' '}
                    {historyItems.length > 0 ? (historyPage - 1) * 20 + 1 : 0}–
                    {historyItems.length > 0
                      ? Math.min(historyPage * 20, historyTotal)
                      : 0}{' '}
                    из {historyTotal}
                  </span>
                  <div className='space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={historyPage <= 1}
                      onClick={() => loadHistoryPage(historyPage - 1)}
                    >
                      Назад
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={historyPage * 20 >= historyTotal}
                      onClick={() => loadHistoryPage(historyPage + 1)}
                    >
                      Вперёд
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
