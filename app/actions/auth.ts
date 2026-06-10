'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { validateCredentials } from '@/lib/auth';
import { encryptSession, SESSION_COOKIE_NAME, SESSION_DURATION_MS } from '@/lib/session';

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!validateCredentials(username, password)) {
    return { error: 'Usuário ou senha inválidos.' };
  }

  const token = await encryptSession(username);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(Date.now() + SESSION_DURATION_MS),
    path: '/',
  });

  redirect('/');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect('/login');
}
