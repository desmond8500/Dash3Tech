import { ref } from 'vue';
import type { TechUser } from './types';

/**
 * Session : token Sanctum + utilisateur.
 * localStorage fonctionne dans la WebView Capacitor.
 */
const TOKEN_KEY = 'dash3tech.token';
const USER_KEY = 'dash3tech.user';

export const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));

export function getToken(): string | null {
  return token.value;
}

export function setSession(newToken: string, user: TechUser) {
  token.value = newToken;
  localStorage.setItem(TOKEN_KEY, newToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  token.value = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function storedUser(): TechUser | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!token.value;
}
