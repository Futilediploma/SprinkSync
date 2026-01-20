/**
 * Application configuration and constants
 */

// API Base URL - use /manpower for both prod and dev (Vite proxy handles dev)
export const API_BASE_URL = '/manpower';

// Time constants
export const HOURS_PER_DAY = 8;
export const WORKING_DAYS_PER_WEEK = 5;

// Project statuses
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  PROSPECTIVE: 'prospective',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

export const PROJECT_STATUS_OPTIONS = [
  { value: PROJECT_STATUS.ACTIVE, label: 'Active' },
  { value: PROJECT_STATUS.PROSPECTIVE, label: 'Prospective' },
  { value: PROJECT_STATUS.COMPLETED, label: 'Completed' },
  { value: PROJECT_STATUS.ARCHIVED, label: 'Archived' },
];

// User roles
export const USER_ROLE = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

// Forecast granularity
export const FORECAST_GRANULARITY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const;

export const FORECAST_GRANULARITY_OPTIONS = [
  { value: FORECAST_GRANULARITY.WEEKLY, label: 'Weekly' },
  { value: FORECAST_GRANULARITY.MONTHLY, label: 'Monthly' },
];

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'sprinksync_token',
} as const;
