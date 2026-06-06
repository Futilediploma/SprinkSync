import { apiFetch, setToken, clearToken } from './client';

export interface AuthUser {
  id: number;
  email: string;
  company_name: string | null;
  plan_type: string;
}

export async function login(email: string, password: string): Promise<void> {
  const data = await apiFetch<{ access_token: string }>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
}

export async function register(
  email: string,
  password: string,
  companyName?: string,
): Promise<void> {
  await apiFetch<{ id: number }>('/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, company_name: companyName }),
  });
  // Register returns the user — auto-login to get the token
  await login(email, password);
}

export function fetchMe(): Promise<AuthUser> {
  return apiFetch('/me');
}

export function logout(): void {
  clearToken();
}
