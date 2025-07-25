import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, BonusTransaction, BonusStats } from '../types';

interface BonusStore {
  // Состояние
  users: User[];
  selectedUsers: string[];
  transactions: BonusTransaction[];
  stats: BonusStats | null;
  isLoading: boolean;
  
  // Действия для пользователей
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  
  // Управление выбором пользователей
  selectUser: (userId: string) => void;
  deselectUser: (userId: string) => void;
  selectAllUsers: () => void;
  clearSelection: () => void;
  toggleUserSelection: (userId: string) => void;
  
  // Операции с бонусами
  addBonusToUser: (userId: string, amount: number, description: string, expirationDays?: number) => void;
  deductBonusFromUser: (userId: string, amount: number, description: string) => void;
  setBonusBalance: (userId: string, newBalance: number, description: string) => void;
  
  // Массовые операции
  bulkAddBonus: (userIds: string[], amount: number, description: string, expirationDays?: number) => void;
  bulkDeductBonus: (userIds: string[], amount: number, description: string) => void;
  bulkSetBalance: (userIds: string[], newBalance: number, description: string) => void;
  
  // Транзакции
  setTransactions: (transactions: BonusTransaction[]) => void;
  addTransaction: (transaction: BonusTransaction) => void;
  
  // Статистика
  setStats: (stats: BonusStats) => void;
  
  // Утилиты
  setLoading: (loading: boolean) => void;
  getUserById: (userId: string) => User | undefined;
  getUserTransactions: (userId: string) => BonusTransaction[];
}

export const useBonusStore = create<BonusStore>()(
  persist(
    (set, get) => ({
      // Начальное состояние
      users: [],
      selectedUsers: [],
      transactions: [],
      stats: null,
      isLoading: false,

      // Действия для пользователей
      setUsers: (users) => set({ users }),
      
      addUser: (user) => set((state) => ({
        users: [...state.users, user]
      })),
      
      updateUser: (userId, updates) => set((state) => ({
        users: state.users.map(user => 
          user.id === userId ? { ...user, ...updates, updatedAt: new Date() } : user
        )
      })),

      // Управление выбором
      selectUser: (userId) => set((state) => ({
        selectedUsers: state.selectedUsers.includes(userId) 
          ? state.selectedUsers 
          : [...state.selectedUsers, userId]
      })),
      
      deselectUser: (userId) => set((state) => ({
        selectedUsers: state.selectedUsers.filter(id => id !== userId)
      })),
      
      selectAllUsers: () => set((state) => ({
        selectedUsers: state.users.map(user => user.id)
      })),
      
      clearSelection: () => set({ selectedUsers: [] }),
      
      toggleUserSelection: (userId) => set((state) => ({
        selectedUsers: state.selectedUsers.includes(userId)
          ? state.selectedUsers.filter(id => id !== userId)
          : [...state.selectedUsers, userId]
      })),

      // Операции с бонусами
      addBonusToUser: (userId, amount, description, expirationDays) => {
        const transaction: BonusTransaction = {
          id: crypto.randomUUID(),
          userId,
          type: 'EARN',
          amount,
          description,
          expiresAt: expirationDays ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000) : undefined,
          createdAt: new Date()
        };
        
        set((state) => ({
          users: state.users.map(user => 
            user.id === userId 
              ? { 
                  ...user, 
                  bonusBalance: user.bonusBalance + amount,
                  totalEarned: user.totalEarned + amount,
                  updatedAt: new Date()
                }
              : user
          ),
          transactions: [transaction, ...state.transactions]
        }));
      },
      
      deductBonusFromUser: (userId, amount, description) => {
        const user = get().getUserById(userId);
        if (!user || user.bonusBalance < amount) return;
        
        const transaction: BonusTransaction = {
          id: crypto.randomUUID(),
          userId,
          type: 'SPEND',
          amount: -amount,
          description,
          createdAt: new Date()
        };
        
        set((state) => ({
          users: state.users.map(u => 
            u.id === userId 
              ? { 
                  ...u, 
                  bonusBalance: u.bonusBalance - amount,
                  updatedAt: new Date()
                }
              : u
          ),
          transactions: [transaction, ...state.transactions]
        }));
      },
      
      setBonusBalance: (userId, newBalance, description) => {
        const user = get().getUserById(userId);
        if (!user) return;
        
        const difference = newBalance - user.bonusBalance;
        const transaction: BonusTransaction = {
          id: crypto.randomUUID(),
          userId,
          type: 'ADMIN_ADJUST',
          amount: difference,
          description,
          createdAt: new Date()
        };
        
        set((state) => ({
          users: state.users.map(u => 
            u.id === userId 
              ? { 
                  ...u, 
                  bonusBalance: newBalance,
                  updatedAt: new Date()
                }
              : u
          ),
          transactions: [transaction, ...state.transactions]
        }));
      },

      // Массовые операции
      bulkAddBonus: (userIds, amount, description, expirationDays) => {
        const transactions: BonusTransaction[] = userIds.map(userId => ({
          id: crypto.randomUUID(),
          userId,
          type: 'EARN' as const,
          amount,
          description,
          expiresAt: expirationDays ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000) : undefined,
          createdAt: new Date()
        }));
        
        set((state) => ({
          users: state.users.map(user => 
            userIds.includes(user.id)
              ? { 
                  ...user, 
                  bonusBalance: user.bonusBalance + amount,
                  totalEarned: user.totalEarned + amount,
                  updatedAt: new Date()
                }
              : user
          ),
          transactions: [...transactions, ...state.transactions]
        }));
      },
      
      bulkDeductBonus: (userIds, amount, description) => {
        const transactions: BonusTransaction[] = [];
        
        set((state) => {
          const updatedUsers = state.users.map(user => {
            if (userIds.includes(user.id) && user.bonusBalance >= amount) {
              transactions.push({
                id: crypto.randomUUID(),
                userId: user.id,
                type: 'SPEND',
                amount: -amount,
                description,
                createdAt: new Date()
              });
              
              return {
                ...user,
                bonusBalance: user.bonusBalance - amount,
                updatedAt: new Date()
              };
            }
            return user;
          });
          
          return {
            users: updatedUsers,
            transactions: [...transactions, ...state.transactions]
          };
        });
      },
      
      bulkSetBalance: (userIds, newBalance, description) => {
        const transactions: BonusTransaction[] = [];
        
        set((state) => {
          const updatedUsers = state.users.map(user => {
            if (userIds.includes(user.id)) {
              const difference = newBalance - user.bonusBalance;
              transactions.push({
                id: crypto.randomUUID(),
                userId: user.id,
                type: 'ADMIN_ADJUST',
                amount: difference,
                description,
                createdAt: new Date()
              });
              
              return {
                ...user,
                bonusBalance: newBalance,
                updatedAt: new Date()
              };
            }
            return user;
          });
          
          return {
            users: updatedUsers,
            transactions: [...transactions, ...state.transactions]
          };
        });
      },

      // Транзакции
      setTransactions: (transactions) => set({ transactions }),
      
      addTransaction: (transaction) => set((state) => ({
        transactions: [transaction, ...state.transactions]
      })),

      // Статистика
      setStats: (stats) => set({ stats }),

      // Утилиты
      setLoading: (isLoading) => set({ isLoading }),
      
      getUserById: (userId) => get().users.find(user => user.id === userId),
      
      getUserTransactions: (userId) => get().transactions.filter(t => t.userId === userId)
    }),
    {
      name: 'bonus-store',
      partialize: (state) => ({
        users: state.users,
        transactions: state.transactions,
        stats: state.stats
      })
    }
  )
);