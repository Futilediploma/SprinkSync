import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
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
  const userFetchedRef = useRef(false)

  // Fetch user info on initial load if token exists
  useEffect(() => {
    async function fetchUser() {
      if (!token) {
        setIsLoading(false)
        return
      }

      // Skip if user already fetched (prevents double fetch from StrictMode or login)
      if (userFetchedRef.current) {
        setIsLoading(false)
        return
      }
      userFetchedRef.current = true

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
          userFetchedRef.current = false
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        setToken(null)
        userFetchedRef.current = false
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

    // Fetch user immediately instead of waiting for useEffect
    const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    if (userResponse.ok) {
      const userData = await userResponse.json()
      setUser(userData)
      userFetchedRef.current = true  // Mark as fetched so useEffect skips
    }
    setToken(data.access_token)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    setToken(null)
    setUser(null)
    userFetchedRef.current = false  // Reset so next login works
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
