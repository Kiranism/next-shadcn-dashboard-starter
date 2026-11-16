// ============================================================
// User Data: server-only data access
// ============================================================
// This is the ONLY file you modify when connecting to your backend.
// Route handlers (src/app/api/users/) and the server prefetch call these
// functions. The browser reaches them through the route handlers (service.ts),
// so tokens, secrets, and database clients never leave the server.
// Same split as TanStack's Next.js example (app/api/todos/data.ts).
//
// Replace the function bodies below:
//
// ORM (Prisma / Drizzle / Supabase)
//    → return db.query.users.findMany({ ... })
//
// External backend (Laravel, Go, etc.) with a token
//    → const { getToken } = await auth(); // Clerk's server auth(), or read your own token cookie
//    → const res = await fetch(`${process.env.BACKEND_URL}/users?...`, {
//        headers: { Authorization: `Bearer ${await getToken()}` }
//      })
//    → return res.json()
//
// Current: Mock (in-memory fake data for demo/prototyping)
// ============================================================

import 'server-only';
import { fakeUsers } from '@/constants/mock-api-users';
import type { UserFilters, UsersResponse, UserMutationPayload } from './types';

export async function getUsers(filters: UserFilters): Promise<UsersResponse> {
  return fakeUsers.getUsers(filters);
}

export async function createUser(data: UserMutationPayload) {
  return fakeUsers.createUser(data);
}

export async function updateUser(id: number, data: UserMutationPayload) {
  return fakeUsers.updateUser(id, data);
}

export async function deleteUser(id: number) {
  return fakeUsers.deleteUser(id);
}
