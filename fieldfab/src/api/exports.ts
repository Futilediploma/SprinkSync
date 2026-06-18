import { apiFetch } from './client';

export type ExportType = 'fabrication_pdf' | 'loose_csv' | 'loose_excel' | 'loose_pdf';

export interface ExportAuthorization {
  authorized: boolean;
  trial_started_at: string | null;
  trial_expires_at: string | null;
  access_state: 'pre_trial' | 'trial_active' | 'trial_expired' | 'pro';
  trial_days_remaining: number | null;
}

export function authorizeExport(projectId: number, exportType: ExportType): Promise<ExportAuthorization> {
  return apiFetch('/exports/authorize', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId, export_type: exportType }),
  });
}
