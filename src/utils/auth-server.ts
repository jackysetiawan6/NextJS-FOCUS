import { cookies } from 'next/headers';

export interface UserSession {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export async function getServerUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get('focus_session');
  if (!cookie) return null;
  try {
    return JSON.parse(cookie.value);
  } catch (e) {
    return null;
  }
}

export async function loginUser(email: string): Promise<void> {
  const cookieStore = await cookies();
  const user: UserSession = {
    id: 'offline-user-id',
    email,
    full_name: email.split('@')[0].toUpperCase(),
    role: 'Operator'
  };
  cookieStore.set('focus_session', JSON.stringify(user), {
    path: '/',
    maxAge: 86400,
    sameSite: 'lax',
  });
}

export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('focus_session');
}

export async function signUpUser(email: string): Promise<void> {
  await loginUser(email);
}
