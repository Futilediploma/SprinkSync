/**
 * Application configuration and constants
 */

const env = import.meta.env;

// Deployment identity and branding. Defaults preserve the current app behavior.
export const APP_BRAND = env.VITE_APP_BRAND || 'SprinkSync';
export const APP_INSTANCE = env.VITE_APP_INSTANCE || 'sprinksync';

// API root. New deployments should prefer /api and route with nginx/Caddy.
// The default preserves the current /manpower hosted setup.
export const API_BASE_URL = env.VITE_API_BASE_URL || '/manpower/api';

export const FEATURE_FLAGS = {
  MANPOWER: env.VITE_ENABLE_MANPOWER !== 'false',
  FIELD_FAB: env.VITE_ENABLE_FIELD_FAB === 'true',
  SCHEDULE_EXTRACTOR: env.VITE_ENABLE_SCHEDULE_EXTRACTOR === 'true',
} as const;

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
  AUTH_TOKEN: env.VITE_AUTH_STORAGE_KEY || 'sprinksync_token',
} as const;
