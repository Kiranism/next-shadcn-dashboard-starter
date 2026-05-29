const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function statusMessage(status: number): string {
  if (status === 401) return 'Sessão inválida — faça login novamente.';
  if (status === 403) return 'Você não tem permissão para realizar esta ação.';
  if (status === 404) return 'Recurso não encontrado.';
  if (status === 409) return 'Este registro já existe.';
  if (status >= 500) return 'Erro interno do servidor. Tente novamente mais tarde.';
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

export function toUserMessage(err: Error): string {
  if (err.name === 'NetworkError')
    return 'Não foi possível conectar ao servidor. Tente novamente mais tarde.';
  if (err instanceof ApiError) {
    if (err.status >= 500) return 'Erro interno do servidor. Tente novamente mais tarde.';
    return err.message;
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
    this.name = 'NetworkError';
    if (process.env.NODE_ENV === 'development') {
      console.error('[NetworkError]', cause);
    }
  }
}

async function request<T>(
  method: string,
  path: string,
  token: string | null | undefined,
  body?: unknown
): Promise<T> {
  if (!token) throw new ApiError(401, 'Sessão inválida — faça login novamente.');

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      ...(body !== undefined && { body: JSON.stringify(body) })
    });
  } catch (cause) {
    throw new NetworkError(cause);
  }

  if (!res.ok) {
    let message = statusMessage(res.status);
    if (res.status < 500) {
      try {
        const json = await res.json();
        if (typeof json.message === 'string') {
          message = json.message;
        } else if (Array.isArray(json.message)) {
          message = json.message.join(', ');
        }
      } catch {}
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const apiGet = <T>(path: string, token: string | null | undefined) =>
  request<T>('GET', path, token);

export const apiPost = <T>(path: string, token: string | null | undefined, body?: unknown) =>
  request<T>('POST', path, token, body);

export const apiPatch = <T>(path: string, token: string | null | undefined, body?: unknown) =>
  request<T>('PATCH', path, token, body);

export const apiDelete = <T>(path: string, token: string | null | undefined) =>
  request<T>('DELETE', path, token);
