import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../api'

export type UserRole = 'admin' | 'manager' | 'staff' | 'viewer'

interface User {
  id: string
  email: string
  name: string
  role: UserRole
  team_id?: number | null
  team_name?: string | null
}

// Permission matrix per role
const PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'view:products', 'create:products', 'edit:products', 'delete:products',
    'view:locations', 'create:locations', 'edit:locations', 'delete:locations',
    'view:inventory', 'create:inventory', 'edit:inventory', 'delete:inventory',
    'view:users', 'create:users', 'edit:users', 'delete:users', 'manage:roles',
    'view:teams', 'create:teams', 'edit:teams', 'delete:teams', 'manage:members',
  ],
  manager: [
    'view:products', 'create:products', 'edit:products',
    'view:locations', 'create:locations', 'edit:locations',
    'view:inventory', 'create:inventory', 'edit:inventory',
    'view:teams', 'create:teams', 'edit:teams', 'manage:members',
  ],
  staff: [
    'view:products',
    'view:locations',
    'view:inventory', 'create:inventory', 'edit:inventory',
    'view:teams',
  ],
  viewer: [
    'view:products',
    'view:locations',
    'view:inventory',
    'view:teams',
  ],
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  error: string | null
  clearError: () => void
  hasPermission: (permission: string) => boolean
  isAdmin: boolean
  isManagerOrAbove: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'pis_auth_token'
const USER_KEY = 'pis_user'

// Axios request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Axios response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const savedUser = localStorage.getItem(USER_KEY)

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        // Invalid user data - clear storage
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
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

      setUser(user)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed. Please try again.'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
    window.location.href = '/login'
  }

  const clearError = () => setError(null)

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    const role = user.role as UserRole
    const perms = PERMISSIONS[role] || []
    return perms.includes(permission)
  }

  const isAdmin = user?.role === 'admin'
  const isManagerOrAbove = user?.role === 'admin' || user?.role === 'manager'

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        error,
        clearError,
        hasPermission,
        isAdmin,
        isManagerOrAbove,
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
