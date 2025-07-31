import axios from 'axios'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface LoginRequest {
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  company_id?: string
  company_name?: string
  is_active?: boolean
  created_at?: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface CompanyCreateRequest {
  name: string
  admin_email: string
  admin_first_name: string
  admin_last_name: string
  admin_password: string
}

export interface Company {
  id: string
  name: string
  slug: string
  email?: string
}

export interface InviteUserRequest {
  email: string
  role: string
}

export interface AcceptInvitationRequest {
  token: string
  first_name: string
  last_name: string
  password: string
}

export const authApi = {
  // Authentication
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/login', { email, password })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed')
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/logout')
    } catch (error: any) {
      // Don't throw on logout errors
      console.error('Logout error:', error)
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<User>('/me')
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to get user info')
    }
  },

  // Company Management
  async createCompany(data: CompanyCreateRequest): Promise<Company> {
    try {
      const response = await api.post<Company>('/companies', data)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to create company')
    }
  },

  // User Invitations
  async inviteUser(data: InviteUserRequest): Promise<{ message: string; invitation_token: string; expires_at: string }> {
    try {
      const response = await api.post('/invite', data)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to send invitation')
    }
  },

  async acceptInvitation(data: AcceptInvitationRequest): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/accept-invitation', data)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to accept invitation')
    }
  },

  async getCompanyUsers(): Promise<{ data: User[] }> {
    try {
      const response = await api.get<User[]>('/company/users')
      return { data: response.data }
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to get company users')
    }
  },

  async getInvitations(): Promise<{ data: any[] }> {
    try {
      const response = await api.get('/invitations')
      return { data: response.data }
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to get invitations')
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      await api.delete(`/users/${userId}`)
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to delete user')
    }
  },

  async updateUser(userId: string, data: any): Promise<User> {
    try {
      const response = await api.patch<User>(`/users/${userId}`, data)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to update user')
    }
  },

  async deleteInvitation(invitationId: string): Promise<void> {
    try {
      await api.delete(`/invitations/${invitationId}`)
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to delete invitation')
    }
  },
}

export default authApi
