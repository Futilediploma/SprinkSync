import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi } from '../services/authApi'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  company_id?: string
  company_name?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  // Check for existing token on app start
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      refreshUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password)
      
      // Store token
      localStorage.setItem('auth_token', response.access_token)
      
      // Set user
      setUser(response.user)
      
    } catch (error: any) {
      // Clear any existing token
      localStorage.removeItem('auth_token')
      throw error
    }
  }

  const logout = async () => {
    try {
      // Call logout endpoint to revoke session
      await authApi.logout()
    } catch (error) {
      // Even if logout call fails, clear local state
      console.error('Logout error:', error)
    } finally {
      // Always clear local state
      localStorage.removeItem('auth_token')
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const userResponse = await authApi.getCurrentUser()
      setUser(userResponse)
    } catch (error) {
      // Token is invalid, clear it
      localStorage.removeItem('auth_token')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
