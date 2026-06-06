import { apiFetch } from './client';

export interface ApiLooseMaterial {
  id: number;
  project_id: number;
  order_index: number;
  qty: number;
  part: string;
  size: string;
  description: string;
  mat_type: string;
  options: string[];
  sizes: string[];
}

export interface LooseMaterialPayload {
  order_index: number;
  qty: number;
  part: string;
  size: string;
  description: string;
  mat_type: string;
  options: string[];
  sizes: string[];
}

export function fetchLooseMaterials(projectId: number): Promise<ApiLooseMaterial[]> {
  return apiFetch(`/projects/${projectId}/loose-materials`);
}

export function createLooseMaterial(projectId: number, mat: LooseMaterialPayload): Promise<ApiLooseMaterial> {
  return apiFetch(`/projects/${projectId}/loose-materials`, {
    method: 'POST',
    body: JSON.stringify(mat),
  });
}

export function updateLooseMaterial(
  projectId: number,
  matId: number,
  mat: LooseMaterialPayload,
): Promise<ApiLooseMaterial> {
  return apiFetch(`/projects/${projectId}/loose-materials/${matId}`, {
    method: 'PUT',
    body: JSON.stringify(mat),
  });
}

export function deleteLooseMaterial(projectId: number, matId: number): Promise<void> {
  return apiFetch(`/projects/${projectId}/loose-materials/${matId}`, { method: 'DELETE' });
}
