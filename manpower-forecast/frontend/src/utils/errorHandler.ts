/**
 * Centralized error handling utilities
 */
import { getErrorMessage, isApiError } from '../types';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

/**
 * Handle API errors consistently across the application
 * Returns a user-friendly error message
 */
export function handleApiError(error: unknown, fallbackMessage = 'An error occurred'): string {
  console.error('API Error:', error);

  // Check for network errors
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Unable to connect to the server. Please check your connection.';
  }

  // Check for timeout
  if (error instanceof Error && error.name === 'AbortError') {
    return 'Request timed out. Please try again.';
  }

  // Check for 401 Unauthorized
  if (isApiError(error) && error.response.status === 401) {
    return 'Your session has expired. Please log in again.';
  }

  // Check for 403 Forbidden
  if (isApiError(error) && error.response.status === 403) {
    return 'You do not have permission to perform this action.';
  }

  // Check for 404 Not Found
  if (isApiError(error) && error.response.status === 404) {
    return 'The requested resource was not found.';
  }

  // Check for 500 Server Error
  if (isApiError(error) && error.response.status >= 500) {
    return 'A server error occurred. Please try again later.';
  }

  // Use the extracted error message or fallback
  const message = getErrorMessage(error);
  return message !== 'An unexpected error occurred' ? message : fallbackMessage;
}

/**
 * Log error with context for debugging
 */
export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, {
    error,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: Array<{ field: string; message: string }>): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].message;
  return errors.map(e => `• ${e.message}`).join('\n');
}

/**
 * Check if error is an authentication error (401)
 */
export function isAuthError(error: unknown): boolean {
  return isApiError(error) && error.response.status === 401;
}

/**
 * Check if error is a permission error (403)
 */
export function isPermissionError(error: unknown): boolean {
  return isApiError(error) && error.response.status === 403;
}
