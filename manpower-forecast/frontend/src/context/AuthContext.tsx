import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { API_BASE_URL, STORAGE_KEYS } from '../config'

interface User {
  id: number
  email: string
  full_name: string | null
  is_active: boolean
  role: 'admin' | 'editor' | 'viewer'
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  })
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user info when token exists
  useEffect(() => {
    async function fetchUser() {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          // Token invalid, clear it
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
          setToken(null)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        setToken(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [token])

  const login = async (email: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const response = await fetch(`${API_BASE_URL}/api/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Login failed')
    }

    const data = await response.json()
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.access_token)
    // Setting token triggers useEffect which fetches user info
    setToken(data.access_token)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
