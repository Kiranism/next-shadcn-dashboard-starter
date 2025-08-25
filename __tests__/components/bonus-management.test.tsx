/**
 * @file: bonus-management.test.tsx
 * @description: Тесты для компонентов управления бонусами
 * @project: SaaS Bonus System
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BonusManagementPage } from '@/features/bonuses/components/bonus-management-page';
import { UserCreateDialog } from '@/features/bonuses/components/user-create-dialog';
import { BonusAwardDialog } from '@/features/projects/components/bonus-award-dialog';

// Mock fetch
global.fetch = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/dashboard/projects/test-id',
}));

describe('BonusManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        users: [
          {
            id: 'user-1',
            email: 'user1@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+79001234567',
            currentBalance: 100,
            totalEarned: 500,
            totalSpent: 400,
            registeredAt: '2025-01-01T00:00:00Z',
          },
          {
            id: 'user-2',
            email: 'user2@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            phone: '+79001234568',
            currentBalance: 200,
            totalEarned: 300,
            totalSpent: 100,
            registeredAt: '2025-01-02T00:00:00Z',
          },
        ],
      }),
    });
  });

  it('should render bonus management page', async () => {
    render(<BonusManagementPage projectId="test-project-id" />);

    await waitFor(() => {
      expect(screen.getByText('Управление бонусами')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/поиск/i)).toBeInTheDocument();
    expect(screen.getByText(/добавить пользователя/i)).toBeInTheDocument();
  });

  it('should display users list', async () => {
    render(<BonusManagementPage projectId="test-project-id" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    });
  });

  it('should filter users by search query', async () => {
    render(<BonusManagementPage projectId="test-project-id" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/поиск/i);
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should handle error when loading users', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Failed to load users',
      }),
    });

    render(<BonusManagementPage projectId="test-project-id" />);

    await waitFor(() => {
      expect(screen.getByText(/ошибка загрузки/i)).toBeInTheDocument();
    });
  });
});

describe('UserCreateDialog', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render user creation form', () => {
    render(
      <UserCreateDialog
        projectId="test-project-id"
        open={true}
        onOpenChange={() => {}}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/телефон/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/имя/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/фамилия/i)).toBeInTheDocument();
    expect(screen.getByText(/создать пользователя/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(
      <UserCreateDialog
        projectId="test-project-id"
        open={true}
        onOpenChange={() => {}}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByText(/создать пользователя/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/укажите email или телефон/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: {
          id: 'new-user-id',
          email: 'new@example.com',
          firstName: 'New',
          lastName: 'User',
        },
      }),
    });

    render(
      <UserCreateDialog
        projectId="test-project-id"
        open={true}
        onOpenChange={() => {}}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/имя/i), {
      target: { value: 'New' },
    });
    fireEvent.change(screen.getByLabelText(/фамилия/i), {
      target: { value: 'User' },
    });

    const submitButton = screen.getByText(/создать пользователя/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/webhook/test-webhook-secret',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('new@example.com'),
      })
    );
  });
});

describe('BonusAwardDialog', () => {
  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    currentBalance: 100,
  };

  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render bonus award form', () => {
    render(
      <BonusAwardDialog
        user={mockUser}
        projectId="test-project-id"
        open={true}
        onOpenChange={() => {}}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText(/начислить бонусы/i)).toBeInTheDocument();
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/сумма/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/описание/i)).toBeInTheDocument();
  });

  it('should validate amount field', async () => {
    render(
      <BonusAwardDialog
        user={mockUser}
        projectId="test-project-id"
        open={true}
        onOpenChange={() => {}}
        onSuccess={mockOnSuccess}
      />
    );

    const amountInput = screen.getByLabelText(/сумма/i);
    fireEvent.change(amountInput, { target: { value: '-100' } });

    const submitButton = screen.getByText(/начислить/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/должна быть положительной/i)).toBeInTheDocument();
    });
  });

  it('should submit bonus award', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        bonus: {
          id: 'bonus-id',
          amount: 50,
          expiresAt: '2026-01-28T00:00:00Z',
        },
      }),
    });

    render(
      <BonusAwardDialog
        user={mockUser}
        projectId="test-project-id"
        open={true}
        onOpenChange={() => {}}
        onSuccess={mockOnSuccess}
      />
    );

    const amountInput = screen.getByLabelText(/сумма/i);
    fireEvent.change(amountInput, { target: { value: '50' } });

    const descriptionInput = screen.getByLabelText(/описание/i);
    fireEvent.change(descriptionInput, { target: { value: 'Test bonus' } });

    const submitButton = screen.getByText(/начислить/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/projects/'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('50'),
      })
    );
  });

  it('should handle API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Ошибка начисления бонусов',
      }),
    });

    render(
      <BonusAwardDialog
        user={mockUser}
        projectId="test-project-id"
        open={true}
        onOpenChange={() => {}}
        onSuccess={mockOnSuccess}
      />
    );

    const amountInput = screen.getByLabelText(/сумма/i);
    fireEvent.change(amountInput, { target: { value: '50' } });

    const submitButton = screen.getByText(/начислить/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/ошибка начисления/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});