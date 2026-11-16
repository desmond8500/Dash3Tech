import axios, { AxiosError } from 'axios';
import { clearSession, getToken } from './auth';
import type { ApiResponse } from './types';

export const API_URL: string = import.meta.env.VITE_API_URL || 'https://dash3.yonkou.info/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token absent, expiré ou révoqué (accès retiré par l'administrateur) : retour à la connexion
let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearSession();
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

/** Renvoie `data` d'une réponse { success, message, data } de Dash3. */
export async function get<T>(url: string, params?: Record<string, any>): Promise<T> {
  const { data } = await api.get<ApiResponse<T>>(url, { params });
  return data.data;
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.post<ApiResponse<T>>(url, body);
  return data.data;
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.patch<ApiResponse<T>>(url, body);
  return data.data;
}

/** Erreur réseau (pas de réponse du serveur) : l'action reste en file d'attente. */
export function isNetworkError(error: unknown): boolean {
  const e = error as AxiosError;
  return !!e?.isAxiosError && !e.response;
}

/** Message lisible pour l'utilisateur. */
export function errorMessage(error: unknown): string {
  const e = error as AxiosError<any>;
  if (isNetworkError(e)) return 'Pas de connexion au serveur.';
  const data = e?.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first.length) return String(first[0]);
  }
  return data?.message || e?.message || 'Erreur inattendue.';
}

export default api;
