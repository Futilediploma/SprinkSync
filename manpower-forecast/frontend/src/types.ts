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

// API format - flat structure from backend
export interface ProjectSubcontractorApi {
  id?: number;
  project_id?: number;
  subcontractor_name: string;
  labor_type: "sprinkler" | "vesda" | "electrical";
  headcount: number;
}

// UI format - grouped by subcontractor name with headcount per trade
export interface ProjectSubcontractor {
  name: string;
  sprinkler: { enabled: boolean; headcount: number };
  vesda: { enabled: boolean; headcount: number };
  electrical: { enabled: boolean; headcount: number };
}

// Helper to convert API format to UI format
export function apiSubsToUiSubs(apiSubs: ProjectSubcontractorApi[]): ProjectSubcontractor[] {
  const grouped: Record<string, ProjectSubcontractor> = {};
  for (const sub of apiSubs) {
    if (!grouped[sub.subcontractor_name]) {
      grouped[sub.subcontractor_name] = {
        name: sub.subcontractor_name,
        sprinkler: { enabled: false, headcount: 0 },
        vesda: { enabled: false, headcount: 0 },
        electrical: { enabled: false, headcount: 0 }
      };
    }
    if (sub.labor_type === 'sprinkler') {
      grouped[sub.subcontractor_name].sprinkler = { enabled: true, headcount: sub.headcount || 0 };
    } else if (sub.labor_type === 'vesda') {
      grouped[sub.subcontractor_name].vesda = { enabled: true, headcount: sub.headcount || 0 };
    } else if (sub.labor_type === 'electrical') {
      grouped[sub.subcontractor_name].electrical = { enabled: true, headcount: sub.headcount || 0 };
    }
  }
  return Object.values(grouped);
}

// Helper to convert UI format to API format
export function uiSubsToApiSubs(uiSubs: ProjectSubcontractor[]): ProjectSubcontractorApi[] {
  const result: ProjectSubcontractorApi[] = [];
  for (const sub of uiSubs) {
    if (sub.sprinkler.enabled) {
      result.push({ subcontractor_name: sub.name, labor_type: 'sprinkler', headcount: sub.sprinkler.headcount });
    }
    if (sub.vesda.enabled) {
      result.push({ subcontractor_name: sub.name, labor_type: 'vesda', headcount: sub.vesda.headcount });
    }
    if (sub.electrical.enabled) {
      result.push({ subcontractor_name: sub.name, labor_type: 'electrical', headcount: sub.electrical.headcount });
    }
  }
  return result;
}

export interface Project {
  id: number;
  name: string;
  customer_name: string | null;
  project_number: string | null;
  status: 'active' | 'prospective' | 'completed' | 'archived';
  notes: string | null;
  budgeted_hours: number | null;
  required_manpower: number;
  start_date: string | null;
  end_date: string | null;
  is_mechanical: boolean;
  is_electrical: boolean;
  is_vesda: boolean;
  is_aws: boolean;
  is_out_of_town: boolean;
  sub_headcount: number;
  // BFPE labor headcounts
  bfpe_sprinkler_headcount: number;
  bfpe_vesda_headcount: number;
  bfpe_electrical_headcount: number;
  total_scheduled_hours: number;
  subcontractors?: ProjectSubcontractorApi[];
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
  required_manpower?: number;
  start_date?: string;
  end_date?: string;
  is_mechanical?: boolean;
  is_electrical?: boolean;
  is_vesda?: boolean;
  is_aws?: boolean;
  is_out_of_town?: boolean;
  sub_headcount?: number;
  bfpe_sprinkler_headcount?: number;
  bfpe_vesda_headcount?: number;
  bfpe_electrical_headcount?: number;
  subcontractors?: ProjectSubcontractorApi[];
}

export interface ProjectUpdate {
  name?: string;
  customer_name?: string;
  project_number?: string;
  status?: string;
  notes?: string;
  budgeted_hours?: number;
  required_manpower?: number;
  start_date?: string;
  end_date?: string;
  is_mechanical?: boolean;
  is_electrical?: boolean;
  is_vesda?: boolean;
  is_aws?: boolean;
  is_out_of_town?: boolean;
  sub_headcount?: number;
  bfpe_sprinkler_headcount?: number;
  bfpe_vesda_headcount?: number;
  bfpe_electrical_headcount?: number;
  subcontractors?: ProjectSubcontractorApi[];
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
  subcontractor_names?: string[];
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
