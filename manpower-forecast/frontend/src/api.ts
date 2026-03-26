/**
 * API client for making HTTP requests to the backend.
 */
import axios from 'axios';
import type {
  Project,
  ProjectCreate,
  ProjectUpdate,
  CrewType,
  CrewTypeCreate,
  ManpowerForecast,
  ForecastFilters,
  SyncLog,
  SyncStatus,
} from './types';
import { API_BASE_URL, STORAGE_KEYS } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================
// Projects
// ============================================

export const projectsApi = {
  list: (status?: string) =>
    api.get<Project[]>('/api/projects/', { params: { status } }),

  get: (id: number) =>
    api.get<Project>(`/api/projects/${id}`),

  create: (data: ProjectCreate) =>
    api.post<Project>('/api/projects/', data),
  
  update: (id: number, data: ProjectUpdate) => 
    api.put<Project>(`/api/projects/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/api/projects/${id}`),
  
};

// ============================================
// Crew Types
// ============================================

export const crewTypesApi = {
  list: () =>
    api.get<CrewType[]>('/api/crew-types/'),

  get: (id: number) =>
    api.get<CrewType>(`/api/crew-types/${id}`),

  create: (data: CrewTypeCreate) =>
    api.post<CrewType>('/api/crew-types/', data),
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

    if (filters.subcontractor_names && filters.subcontractor_names.length > 0) {
      params.subcontractor_names = filters.subcontractor_names.join(',');
    }

    return api.get('/api/forecasts/company-wide/export', {
      params,
      responseType: 'blob'
    });
  }
};

// ============================================
// PDF Export
// ============================================

export const manpowerNeedsApi = {
  exportPdf: (projectIds?: number[], statusFilter?: string) => {
    const params: any = {};
    if (projectIds && projectIds.length > 0) params.project_ids = projectIds.join(',');
    if (statusFilter && statusFilter !== 'all') params.status_filter = statusFilter;
    return api.get('/api/export/pdf/manpower-needs', { params, responseType: 'blob' });
  },
  exportDocx: (projectIds?: number[], statusFilter?: string) => {
    const params: any = {};
    if (projectIds && projectIds.length > 0) params.project_ids = projectIds.join(',');
    if (statusFilter && statusFilter !== 'all') params.status_filter = statusFilter;
    return api.get('/api/export/docx/manpower-needs', { params, responseType: 'blob' });
  },
  exportExcel: (projectIds?: number[], statusFilter?: string) => {
    const params: any = {};
    if (projectIds && projectIds.length > 0) params.project_ids = projectIds.join(',');
    if (statusFilter && statusFilter !== 'all') params.status_filter = statusFilter;
    return api.get('/api/export/excel/manpower-needs', { params, responseType: 'blob' });
  },
};

export const exportApi = {
  pdf: (filters?: ForecastFilters) => {
    const params: any = {};

    if (filters) {
      if (filters.project_ids && filters.project_ids.length > 0) {
        params.project_ids = filters.project_ids.join(',');
      }
      if (filters.subcontractor_names && filters.subcontractor_names.length > 0) {
        params.subcontractor_names = filters.subcontractor_names.join(',');
      }
    }

    return api.get('/api/export/pdf', { params, responseType: 'blob' });
  }
};

// ============================================
// Subcontractor Reports
// ============================================

export interface SubcontractorPhaseInfo {
  phase_name: string;
  start_date: string;
  end_date: string;
  man_hours: number;
}

export interface SubcontractorProjectInfo {
  project_id: number;
  project_name: string;
  project_number: string | null;
  labor_type: string;
  phases: SubcontractorPhaseInfo[];
  total_project_hours: number;
}

export interface SubcontractorReport {
  subcontractor_name: string;
  total_man_hours: number;
  projects: SubcontractorProjectInfo[];
}

export const subcontractorReportsApi = {
  listSubcontractors: () =>
    api.get<{ subcontractors: string[] }>('/api/reports/subcontractors'),

  getReport: (name: string, startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return api.get<SubcontractorReport>(`/api/reports/subcontractor/${encodeURIComponent(name)}`, { params });
  },

  exportPdf: (name: string, startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return api.get(`/api/export/pdf/subcontractor/${encodeURIComponent(name)}`, {
      params,
      responseType: 'blob'
    });
  }
};

// ============================================
// SharePoint Sync
// ============================================

export const sharepointSyncApi = {
  getStatus: () => api.get<SyncStatus>('/api/sharepoint-sync/status'),
  triggerSync: () => api.post<{ message: string; sync_log_id: number }>('/api/sharepoint-sync/trigger'),
  getLogs: () => api.get<SyncLog[]>('/api/sharepoint-sync/logs'),
};

export default api;
