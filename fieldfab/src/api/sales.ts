import { apiFetch } from './client';

export interface SalesLeadPayload {
  full_name: string;
  email: string;
  company_name: string;
  phone?: string;
  company_size?: string;
  message: string;
}

export async function submitSalesLead(payload: SalesLeadPayload): Promise<void> {
  await apiFetch('/sales-leads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
