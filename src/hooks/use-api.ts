/**
 * @file: use-api.ts
 * @description: Универсальный хук для API запросов с типизацией
 * @project: SaaS Bonus System
 * @dependencies: react, logger, types
 * @created: 2025-01-27
 * @author: AI Assistant + User
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import type { ApiResponse, ApiError } from '@/types/api';

// ===== ТИПЫ =====

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (url: string, options?: RequestInit) => Promise<T>;
  reset: () => void;
  refresh: () => Promise<T | null>;
}

interface UseMutationReturn<T, V = any> {
  mutate: (variables: V) => Promise<T>;
  data: T | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

// ===== ОСНОВНОЙ ХУК =====

export function useApi<T = any>(options: UseApiOptions = {}): UseApiReturn<T> {
  const {
    onSuccess,
    onError,
    retryCount = 3,
    retryDelay = 1000,
    timeout = 30000
  } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetched: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUrlRef = useRef<string | null>(null);
  const lastOptionsRef = useRef<RequestInit | null>(null);

  // Функция выполнения запроса
  const execute = useCallback(
    async (url: string, requestOptions: RequestInit = {}): Promise<T> => {
      const requestId = crypto.randomUUID();
      const requestLogger = logger.withContext(requestId);

      // Отменяем предыдущий запрос
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Создаем новый AbortController
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Сохраняем параметры для возможного повтора
      lastUrlRef.current = url;
      lastOptionsRef.current = requestOptions;

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null
      }));

      const performRequest = async (attempt: number = 1): Promise<T> => {
        try {
          requestLogger.info(
            'API request started',
            {
              url,
              method: requestOptions.method || 'GET',
              attempt,
              retryCount
            },
            'use-api'
          );

          const timeoutController = new AbortController();
          const timeoutId = setTimeout(
            () => timeoutController.abort(),
            timeout
          );

          // Объединяем abort signals
          const combinedSignal = combineAbortSignals([
            abortController.signal,
            timeoutController.signal
          ]);

          const response = await fetch(url, {
            ...requestOptions,
            signal: combinedSignal,
            headers: {
              'Content-Type': 'application/json',
              'X-Request-ID': requestId,
              ...requestOptions.headers
            }
          });

          clearTimeout(timeoutId);

          // Проверяем статус ответа
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const apiError: ApiError = {
              code: errorData.error?.code || `HTTP_${response.status}`,
              message:
                errorData.error?.message ||
                errorData.message ||
                `HTTP Error ${response.status}`,
              details: errorData.error?.details,
              statusCode: response.status
            };

            throw apiError;
          }

          const data = await response.json();

          // Обрабатываем успешный ответ
          if (data.success === false) {
            const apiError: ApiError = {
              code: data.error?.code || 'API_ERROR',
              message:
                data.error?.message || data.message || 'API returned error',
              details: data.error?.details,
              statusCode: response.status
            };
            throw apiError;
          }

          const result = data.data || data;

          setState({
            data: result,
            loading: false,
            error: null,
            lastFetched: new Date()
          });

          requestLogger.info(
            'API request completed successfully',
            {
              url,
              method: requestOptions.method || 'GET',
              status: response.status
            },
            'use-api'
          );

          onSuccess?.(result);
          return result;
        } catch (error) {
          // Игнорируем отмененные запросы
          if (error instanceof Error && error.name === 'AbortError') {
            requestLogger.debug('API request aborted', { url }, 'use-api');
            throw error;
          }

          const apiError = error as ApiError;

          // Повторяем запрос при временных ошибках
          if (attempt < retryCount && isRetryableError(apiError)) {
            requestLogger.warn(
              'API request failed, retrying',
              {
                url,
                attempt,
                error: apiError.message,
                nextAttemptIn: retryDelay * attempt
              },
              'use-api'
            );

            await sleep(retryDelay * attempt);
            return performRequest(attempt + 1);
          }

          // Финальная ошибка
          const errorMessage = apiError.message || 'Неизвестная ошибка API';

          setState((prev) => ({
            ...prev,
            loading: false,
            error: errorMessage
          }));

          requestLogger.error(
            'API request failed',
            {
              url,
              method: requestOptions.method || 'GET',
              error: errorMessage,
              code: apiError.code,
              attempts: attempt
            },
            'use-api'
          );

          onError?.(apiError);
          throw apiError;
        }
      };

      return performRequest();
    },
    [onSuccess, onError, retryCount, retryDelay, timeout]
  );

  // Сброс состояния
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      data: null,
      loading: false,
      error: null,
      lastFetched: null
    });

    lastUrlRef.current = null;
    lastOptionsRef.current = null;
  }, []);

  // Повторный запрос
  const refresh = useCallback(async (): Promise<T | null> => {
    if (!lastUrlRef.current) {
      logger.warn('Cannot refresh: no previous request', {}, 'use-api');
      return null;
    }

    try {
      return await execute(lastUrlRef.current, lastOptionsRef.current || {});
    } catch (error) {
      return null;
    }
  }, [execute]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    execute,
    reset,
    refresh
  };
}

// ===== ХУК ДЛЯ МУТАЦИЙ =====

export function useMutation<T = any, V = any>(
  mutationFn: (variables: V) => Promise<T>,
  options: UseApiOptions = {}
): UseMutationReturn<T, V> {
  const { onSuccess, onError } = options;

  const [state, setState] = useState({
    data: null as T | null,
    loading: false,
    error: null as string | null
  });

  const mutate = useCallback(
    async (variables: V): Promise<T> => {
      const requestId = crypto.randomUUID();
      const requestLogger = logger.withContext(requestId);

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null
      }));

      try {
        requestLogger.info('Mutation started', { variables }, 'use-mutation');

        const result = await mutationFn(variables);

        setState({
          data: result,
          loading: false,
          error: null
        });

        requestLogger.info(
          'Mutation completed successfully',
          {},
          'use-mutation'
        );

        onSuccess?.(result);
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Неизвестная ошибка';

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));

        requestLogger.error(
          'Mutation failed',
          { error: errorMessage },
          'use-mutation'
        );

        onError?.(error as ApiError);
        throw error;
      }
    },
    [mutationFn, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
  }, []);

  return {
    mutate,
    ...state,
    reset
  };
}

// ===== СПЕЦИАЛИЗИРОВАННЫЕ ХУКИ =====

export function useGet<T = any>(url: string, options: UseApiOptions = {}) {
  const api = useApi<T>(options);

  const fetch = useCallback(() => {
    return api.execute(url, { method: 'GET' });
  }, [api, url]);

  return {
    ...api,
    fetch
  };
}

export function usePost<T = any, V = any>(
  url: string,
  options: UseApiOptions = {}
) {
  return useMutation<T, V>((variables: V) => {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variables)
    }).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    });
  }, options);
}

export function usePut<T = any, V = any>(
  url: string,
  options: UseApiOptions = {}
) {
  return useMutation<T, V>((variables: V) => {
    return fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variables)
    }).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    });
  }, options);
}

export function useDelete<T = any>(url: string, options: UseApiOptions = {}) {
  return useMutation<T, void>(() => {
    return fetch(url, {
      method: 'DELETE'
    }).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    });
  }, options);
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

function isRetryableError(error: ApiError): boolean {
  // Повторяем запрос для временных ошибок
  return (
    error.statusCode >= 500 || // Серверные ошибки
    error.statusCode === 429 || // Rate limiting
    error.statusCode === 408 || // Request timeout
    error.code === 'NETWORK_ERROR' ||
    error.code === 'TIMEOUT_ERROR'
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function combineAbortSignals(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener('abort', () => controller.abort());
  }

  return controller.signal;
}

// ===== ЭКСПОРТ =====

export default useApi;
