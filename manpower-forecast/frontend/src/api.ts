/**
 * API client for making HTTP requests to the backend.
 */
import axios from 'axios';
import type {
  Project,
  ProjectCreate,
  ProjectUpdate,
  ProjectSchedule,
  ProjectScheduleCreate,
  ProjectScheduleUpdate,
  SchedulePhase,
  SchedulePhaseCreate,
  SchedulePhaseUpdate,
  CrewType,
  CrewTypeCreate,
  ManpowerForecast,
  ForecastFilters
} from './types';

// Use /manpower for production, localhost for dev
const API_BASE_URL = import.meta.env.PROD ? '/manpower' : 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// Projects
// ============================================

export const projectsApi = {
  list: (status?: string) => 
    api.get<Project[]>('/api/projects', { params: { status } }),
  
  get: (id: number) => 
    api.get<Project>(`/api/projects/${id}`),
  
  create: (data: ProjectCreate) => 
    api.post<Project>('/api/projects', data),
  
  update: (id: number, data: ProjectUpdate) => 
    api.put<Project>(`/api/projects/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/api/projects/${id}`),
  
  getSchedule: (id: number) => 
    api.get<ProjectSchedule>(`/api/projects/${id}/schedule`),
  
  createSchedule: (id: number, data: ProjectScheduleCreate) => 
    api.post<ProjectSchedule>(`/api/projects/${id}/schedule`, data),
  
  deleteSchedule: (id: number) => 
    api.delete(`/api/projects/${id}/schedule`),
};

// ============================================
// Schedules
// ============================================

export const schedulesApi = {
  update: (id: number, data: ProjectScheduleUpdate) => 
    api.put<ProjectSchedule>(`/api/schedules/${id}`, data),
  
  listPhases: (scheduleId: number) => 
    api.get<SchedulePhase[]>(`/api/schedules/${scheduleId}/phases`),
  
  createPhase: (scheduleId: number, data: SchedulePhaseCreate) => 
    api.post<SchedulePhase>(`/api/schedules/${scheduleId}/phases`, data),
};

// ============================================
// Phases
// ============================================

export const phasesApi = {
  get: (id: number) => 
    api.get<SchedulePhase>(`/api/phases/${id}`),
  
  update: (id: number, data: SchedulePhaseUpdate) => 
    api.put<SchedulePhase>(`/api/phases/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/api/phases/${id}`),
};

// ============================================
// Crew Types
// ============================================

export const crewTypesApi = {
  list: () => 
    api.get<CrewType[]>('/api/crew-types'),
  
  get: (id: number) => 
    api.get<CrewType>(`/api/crew-types/${id}`),
  
  create: (data: CrewTypeCreate) => 
    api.post<CrewType>('/api/crew-types', data),
};

// ============================================
// Forecasts
// ============================================

export const forecastsApi = {
  companyWide: (filters: ForecastFilters) => {
    const params: any = {
      start_date: filters.start_date,
      end_date: filters.end_date,
      granularity: filters.granularity || 'weekly',
    };
    
    if (filters.project_ids && filters.project_ids.length > 0) {
      params.project_ids = filters.project_ids.join(',');
    }
    
    if (filters.crew_type_ids && filters.crew_type_ids.length > 0) {
      params.crew_type_ids = filters.crew_type_ids.join(',');
    }
    
    return api.get<ManpowerForecast>('/api/forecasts/company-wide', { params });
  },
  
  project: (projectId: number, granularity: 'weekly' | 'monthly' = 'weekly') => 
    api.get<ManpowerForecast>(`/api/forecasts/project/${projectId}`, {
      params: { granularity }
    }),
  
  exportCsv: (filters: ForecastFilters, exportType: 'forecast' | 'projects' = 'forecast') => {
    const params: any = {
      start_date: filters.start_date,
      end_date: filters.end_date,
      granularity: filters.granularity || 'weekly',
      export_type: exportType,
    };
    
    if (filters.project_ids && filters.project_ids.length > 0) {
      params.project_ids = filters.project_ids.join(',');
    }
    
    if (filters.crew_type_ids && filters.crew_type_ids.length > 0) {
      params.crew_type_ids = filters.crew_type_ids.join(',');
    }
    
    return api.get('/api/forecasts/company-wide/export', {
      params,
      responseType: 'blob'
    });
  }
};

export default api;
