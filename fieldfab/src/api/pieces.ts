import { apiFetch } from './client';
import type { Outlet } from '../types';

export interface ApiPiece {
  id: number;
  project_id: number;
  order_index: number;
  qty: number;
  feet: string;
  inches: string;
  pipe_type: string;
  pipe_tag: string;
  diameter: string;
  fittings_end1: string;
  fittings_end2: string;
  outlets: Outlet[];
}

export interface PiecePayload {
  order_index: number;
  qty: number;
  feet: string;
  inches: string;
  pipe_type: string;
  pipe_tag: string;
  diameter: string;
  fittings_end1: string;
  fittings_end2: string;
  outlets: Outlet[];
}

export function fetchPieces(projectId: number): Promise<ApiPiece[]> {
  return apiFetch(`/projects/${projectId}/pieces`);
}

export function createPiece(projectId: number, piece: PiecePayload): Promise<ApiPiece> {
  return apiFetch(`/projects/${projectId}/pieces`, {
    method: 'POST',
    body: JSON.stringify(piece),
  });
}

export function updatePiece(projectId: number, pieceId: number, piece: PiecePayload): Promise<ApiPiece> {
  return apiFetch(`/projects/${projectId}/pieces/${pieceId}`, {
    method: 'PUT',
    body: JSON.stringify(piece),
  });
}

export function deletePiece(projectId: number, pieceId: number): Promise<void> {
  return apiFetch(`/projects/${projectId}/pieces/${pieceId}`, { method: 'DELETE' });
}
