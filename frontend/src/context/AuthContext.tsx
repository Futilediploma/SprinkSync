import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, User } from '../services/authApi'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  const refreshUser = async () => {
    try {
      const userData = await authApi.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
      localStorage.removeItem('auth_token')
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password)
      localStorage.setItem('auth_token', response.access_token)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('auth_token')
      setUser(null)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token')
      if (token) {
        try {
          const userData = await authApi.getCurrentUser()
          setUser(userData)
        } catch (error) {
          console.error('Failed to get current user:', error)
          localStorage.removeItem('auth_token')
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

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

export default AuthContext
