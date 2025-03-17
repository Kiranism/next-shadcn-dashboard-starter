//@ts-nocheck
'use server';

import { auth } from '@/lib/auth';

interface RequestAPIProps extends RequestInit {
  method:
    | 'GET'
    | 'POST'
    | 'PATCH'
    | 'PUT'
    | 'DELETE'
    | 'HEAD'
    | 'TRACE'
    | 'CONNECT'
    | 'OPTIONS';
  endpoint: string;
  authenticate?: boolean;
  query?: string[][];
  asFormData?: boolean;
}

export default async function requestAPI<T>({
  method,
  endpoint,
  body,
  authenticate = false,
  query = [],
  headers,
  asFormData = false
}: RequestAPIProps): Promise<
  { data: T; ok: true } | { ok: false; error: Error | unknown }
> {
  const reqTime = new Date();
  try {
    console.info(
      `[Request ${reqTime} | ${method}] > Actions > Begin Request API >`,
      {
        method,
        url: [process.env.API_BASE_URL, process.env.API_VERSION, endpoint].join(
          '/'
        ),
        query,
        authenticate,
        body
      }
    );

    if (!process.env.API_BASE_URL || !process.env.API_VERSION) {
      throw new Error('API URL Environment not set.', {
        cause: 'Missing API_BASE_URL or API_VERSION in environment.'
      });
    }

    let token = '';
    if (authenticate) {
      const session = await auth();
      console.log('Session:', session);
      if (!session || !session.accessToken) {
        throw new Error('Token not found or has expired.', {
          cause: 'Session not found or token expired. Please login again.'
        });
      }

      if (session.error === 'RefreshAccessTokenError') {
        throw new Error('Unable to refresh token. Please login again.');
      }

      token = session.accessToken;
    }

    const mHeaders = asFormData
      ? { Authorization: `Bearer ${token}`, ...headers }
      : {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...headers
        };

    const response = await fetch(
      [process.env.API_BASE_URL, process.env.API_VERSION, endpoint]
        .join('/')
        .concat(`?${query.map((item) => item.join('=')).join('&')}`),
      {
        method,
        headers: mHeaders,
        body
      }
    );

    const contentType = response.headers.get('Content-Type');
    let result;
    if (contentType?.includes('json')) {
      result = await response.json();
    } else {
      result = await response.text();
    }

    console.log(
      `[Request ${reqTime} | ${method}] > Actions > Request API > Response >`,
      result
    );
    console.log(
      `[Request ${reqTime} | ${method}] > Actions > Request API > Status >`,
      response.status
    );

    if (!response.ok) {
      console.warn(
        `[Request ${reqTime} | ${method}] > Actions > Request API > API Responded with an error.`
      );
      return { error: result, ok: false };
    }

    console.log(
      `[Request ${reqTime} | ${method}] > Actions > Request API > API Responded with a success.`
    );
    console.info(
      `[Request ${reqTime} | ${method}] > Actions > End Request API`
    );

    return { data: result as T, ok: true };
  } catch (error) {
    console.error(
      `[Request ${reqTime} | ${method}] > Actions > Request API > Failed to make a request >`,
      error
    );
    return { error, ok: false };
  }
}
