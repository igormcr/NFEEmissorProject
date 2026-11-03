import axios from 'axios';
import { authStorage } from '@/lib/auth-storage';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BFF_URL ?? 'http://localhost:3000',
  timeout: 30000,
});

export type AuthUser = { id: string; name: string; email: string };
export type AuthResponse = { token: string; user: AuthUser };

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/v1/auth/login', { email, password });
  return response.data;
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/v1/auth/register', { name, email, password });
  return response.data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const token = await authStorage.getToken();
  if (!token) throw new Error('No token');
  const response = await api.get<{ user: AuthUser }>('/api/v1/auth/me', {
    headers: { Authorization: 'Bearer ' + token },
  });
  return response.data.user;
}
