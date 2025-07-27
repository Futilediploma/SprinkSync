import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here later
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// API endpoints
export const constructionApi = {
  // Dashboard
  getDashboardStats: () => api.get('/api/dashboard/stats'),
  getDashboardAlerts: () => api.get('/api/dashboard/alerts'),
  
  // Projects
  getProjects: () => api.get('/api/projects'),
  getProject: (id: number) => api.get(`/api/projects/${id}`),
  createProject: (data: any) => api.post('/api/projects', data),
  updateProject: (id: number, data: any) => api.put(`/api/projects/${id}`, data),
  deleteProject: (id: number) => api.delete(`/api/projects/${id}`),

  // Schedule/Tasks
  getTasks: (projectId?: number) => {
    const params = projectId ? { project_id: projectId } : {}
    return api.get('/api/schedule', { params })
  },
  getTask: (id: number) => api.get(`/api/schedule/${id}`),
  createTask: (data: any) => api.post('/api/schedule', data),
  updateTask: (id: number, data: any) => api.put(`/api/schedule/${id}`, data),
  deleteTask: (id: number) => api.delete(`/api/schedule/${id}`),

  // Financials
  getFinancials: () => api.get('/api/financials'),
  getSOV: () => api.get('/api/financials/sov'),

  // Documents
  getDocuments: () => api.get('/api/documents'),
  getDrawings: () => api.get('/api/documents/drawings'),

  // Field
  getFieldOverview: () => api.get('/api/field'),
  getLaborTracking: () => api.get('/api/field/labor'),

  // Inspections
  getInspections: (projectId?: number) => {
    const params = projectId ? { project_id: projectId } : {}
    return api.get('/api/inspections', { params })
  },
  getInspection: (id: number) => api.get(`/api/inspections/${id}`),
  createInspection: (data: any) => api.post('/api/inspections', data),
  updateInspection: (id: number, data: any) => api.put(`/api/inspections/${id}`, data),
  getUpcomingInspections: () => api.get('/api/inspections/upcoming'),

  // Reports
  getReports: () => api.get('/api/reports'),
  getDashboardData: () => api.get('/api/reports/dashboard'),
}

export default api
