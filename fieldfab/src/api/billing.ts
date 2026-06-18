import { apiFetch } from './client';

interface BillingSession {
  url: string;
}

export async function startProCheckout(): Promise<void> {
  const session = await apiFetch<BillingSession>('/billing/checkout-session', {
    method: 'POST',
  });
  window.location.assign(session.url);
}

export async function openBillingPortal(): Promise<void> {
  const session = await apiFetch<BillingSession>('/billing/portal-session', {
    method: 'POST',
  });
  window.location.assign(session.url);
}
