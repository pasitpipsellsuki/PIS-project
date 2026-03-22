import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../api'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'pis_auth_token'
const USER_KEY = 'pis_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const savedUser = localStorage.getItem(USER_KEY)
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      // Set default auth header for all requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await api.post('/api/auth/login', { email, password })
      const { token, user } = response.data
      
      // Save to localStorage
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      
      // Set default auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser(user)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        error,
      }}
    >
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
