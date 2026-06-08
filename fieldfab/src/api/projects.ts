import { apiFetch } from './client';

export interface ApiProject {
  id: number;
  user_id: number;
  name: string;
  company_name: string | null;
  street_number: string | null;
  street_name: string | null;
  city: string | null;
  zipcode: string | null;
  created_at: string;
}

export interface CreateProjectData {
  name: string;
  company_name?: string;
  street_number?: string;
  street_name?: string;
  city?: string;
  zipcode?: string;
}

export function fetchProjects(): Promise<ApiProject[]> {
  return apiFetch('/projects');
}

export function createProject(data: CreateProjectData): Promise<ApiProject> {
  return apiFetch('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteProject(id: number): Promise<void> {
  return apiFetch(`/projects/${id}`, { method: 'DELETE' });
}
