import { apiFetch, setToken, clearToken } from './client';

export interface AuthUser {
  id: number;
  email: string;
  company_name: string | null;
  plan_type: string;
  marketing_emails_opt_in: boolean;
  marketing_opt_in_at: string | null;
  marketing_opt_in_source: string | null;
  marketing_unsubscribed_at: string | null;
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
  marketingEmailsOptIn = false,
): Promise<void> {
  await apiFetch<{ id: number }>('/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      company_name: companyName,
      marketing_emails_opt_in: marketingEmailsOptIn,
    }),
  });
  // Register returns the user — auto-login to get the token
  await login(email, password);
}

export function fetchMe(): Promise<AuthUser> {
  return apiFetch('/me');
}

export function updateMarketingPreferences(marketingEmailsOptIn: boolean): Promise<AuthUser> {
  return apiFetch('/me/marketing-preferences', {
    method: 'PATCH',
    body: JSON.stringify({ marketing_emails_opt_in: marketingEmailsOptIn }),
  });
}

export function logout(): void {
  clearToken();
}
