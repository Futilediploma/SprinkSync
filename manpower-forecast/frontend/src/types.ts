/**
 * TypeScript type definitions for the Manpower Forecast application.
 */

// ============================================
// Crew Types
// ============================================

export interface CrewType {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface CrewTypeCreate {
  name: string;
  description?: string;
}

// ============================================
// Projects
// ============================================

export interface Project {
  id: number;
  name: string;
  customer_name: string | null;
  project_number: string | null;
  status: 'active' | 'prospective' | 'completed' | 'archived';
  notes: string | null;
  budgeted_hours: number | null;
  start_date: string | null;
  end_date: string | null;
  is_mechanical: boolean;
  is_electrical: boolean;
  is_vesda: boolean;
  is_aws: boolean;
  total_scheduled_hours: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  customer_name?: string;
  project_number?: string;
  status?: string;
  notes?: string;
  budgeted_hours?: number;
  start_date?: string;
  end_date?: string;
  is_mechanical?: boolean;
  is_electrical?: boolean;
  is_vesda?: boolean;
  is_aws?: boolean;
}

export interface ProjectUpdate {
  name?: string;
  customer_name?: string;
  project_number?: string;
  status?: string;
  notes?: string;
  budgeted_hours?: number;
  start_date?: string;
  end_date?: string;
  is_mechanical?: boolean;
  is_electrical?: boolean;
  is_vesda?: boolean;
  is_aws?: boolean;
}

// ============================================
// Schedule Phases
// ============================================

export interface SchedulePhase {
  id: number;
  schedule_id: number;
  phase_name: string;
  start_date: string;
  end_date: string;
  estimated_man_hours: number | null;
  crew_size: number | null;
  crew_type_id: number | null;
  crew_type: CrewType | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SchedulePhaseCreate {
  phase_name: string;
  start_date: string;
  end_date: string;
  estimated_man_hours?: number;
  crew_size?: number;
  crew_type_id?: number;
  notes?: string;
  sort_order?: number;
}

export interface SchedulePhaseUpdate {
  phase_name?: string;
  start_date?: string;
  end_date?: string;
  estimated_man_hours?: number;
  crew_size?: number;
  crew_type_id?: number;
  notes?: string;
  sort_order?: number;
}

// ============================================
// Project Schedules
// ============================================

export interface ProjectSchedule {
  id: number;
  project_id: number;
  schedule_name: string;
  start_date: string;
  end_date: string;
  total_estimated_hours: number | null;
  is_active: boolean;
  phases: SchedulePhase[];
  created_at: string;
  updated_at: string;
}

export interface ProjectScheduleCreate {
  schedule_name?: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
  phases?: SchedulePhaseCreate[];
}

export interface ProjectScheduleUpdate {
  schedule_name?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

// ============================================
// Forecasts
// ============================================

export interface WeeklyForecast {
  week: string;
  week_start: string;
  man_hours: number;
  crew_breakdown: Record<number, number>;
}

export interface MonthlyForecast {
  month: string;
  month_name: string;
  man_hours: number;
  crew_breakdown: Record<number, number>;
}

export interface ProjectContribution {
  id: number;
  name: string;
  man_hours: number;
}

export interface ManpowerForecast {
  start_date: string;
  end_date: string;
  total_man_hours: number;
  project_count: number;
  weekly_forecast: WeeklyForecast[];
  monthly_forecast: MonthlyForecast[];
  projects_included: ProjectContribution[];
}

export interface ForecastFilters {
  start_date: string;
  end_date: string;
  project_ids?: number[];
  crew_type_ids?: number[];
  granularity?: 'weekly' | 'monthly' | 'daily';
}

// ============================================
// API Error Types
// ============================================

/**
 * Standard API error response from FastAPI
 */
export interface ApiError {
  status: number;
  detail: string;
}

/**
 * Validation error detail from FastAPI/Pydantic
 */
export interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/**
 * Validation error response (422 Unprocessable Entity)
 */
export interface ValidationErrorResponse {
  detail: ValidationErrorDetail[];
}

/**
 * Check if an error response is a validation error
 */
export function isValidationError(error: unknown): error is { response: { data: ValidationErrorResponse } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as any).response?.data?.detail === 'object' &&
    Array.isArray((error as any).response?.data?.detail)
  );
}

/**
 * Check if an error response is a standard API error
 */
export function isApiError(error: unknown): error is { response: { data: ApiError; status: number } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as any).response?.data?.detail === 'string'
  );
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (isValidationError(error)) {
    const details = error.response.data.detail;
    return details.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ');
  }

  if (isApiError(error)) {
    return error.response.data.detail;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}
