export interface UserSession {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export function getBrowserUser(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const match = document.cookie.match(/(^|;)\s*focus_session\s*=\s*([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[2]));
  } catch (e) {
    return null;
  }
}
