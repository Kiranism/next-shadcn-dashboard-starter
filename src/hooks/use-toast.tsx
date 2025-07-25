/**
 * @file: src/hooks/use-toast.tsx
 * @description: Toast уведомления для пользовательского интерфейса
 * @project: SaaS Bonus System
 * @dependencies: React, state management
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

'use client';

import React, { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
}

const initialState: ToastState = {
  toasts: [],
};

let memoryState = initialState;
const listeners: Set<React.Dispatch<React.SetStateAction<ToastState>>> = new Set();

function dispatch(action: { type: string; toast?: Toast; toastId?: string }) {
  switch (action.type) {
    case 'ADD_TOAST':
      if (action.toast) {
        memoryState = {
          ...memoryState,
          toasts: [...memoryState.toasts, action.toast],
        };
      }
      break;
    case 'UPDATE_TOAST':
      if (action.toast) {
        memoryState = {
          ...memoryState,
          toasts: memoryState.toasts.map((t) =>
            t.id === action.toast!.id ? { ...t, ...action.toast } : t
          ),
        };
      }
      break;
    case 'DISMISS_TOAST':
      if (action.toastId) {
        memoryState = {
          ...memoryState,
          toasts: memoryState.toasts.filter((t) => t.id !== action.toastId),
        };
      }
      break;
  }

  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function genId() {
  return Math.random().toString(36).substr(2, 9);
}

export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const toast = useCallback(
    ({
      title,
      description,
      variant = 'default',
      duration = 5000,
      ...props
    }: Omit<Toast, 'id'>) => {
      const id = genId();

      const newToast: Toast = {
        id,
        title,
        description,
        variant,
        duration,
        ...props,
      };

      dispatch({
        type: 'ADD_TOAST',
        toast: newToast,
      });

      // Auto dismiss
      if (duration > 0) {
        setTimeout(() => {
          dispatch({
            type: 'DISMISS_TOAST',
            toastId: id,
          });
        }, duration);
      }

      return {
        id,
        dismiss: () => {
          dispatch({
            type: 'DISMISS_TOAST',
            toastId: id,
          });
        },
        update: (toast: Partial<Toast>) => {
          dispatch({
            type: 'UPDATE_TOAST',
            toast: { ...newToast, ...toast },
          });
        },
      };
    },
    []
  );

  return {
    ...state,
    toast,
    dismiss: (toastId: string) => {
      dispatch({
        type: 'DISMISS_TOAST',
        toastId,
      });
    },
  };
} 