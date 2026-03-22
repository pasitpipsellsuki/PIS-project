import axios, { AxiosError, AxiosRequestConfig } from 'axios'

// API base URL - adjust based on your deployment
const API_URL = (import.meta.env.VITE_API_URL as string) || 'https://pis-project.pasitpipsellsuki.workers.dev'

// Maximum number of retries
const MAX_RETRIES = 3
// Initial retry delay in ms
const INITIAL_RETRY_DELAY = 1000
// Request timeout in ms (30 seconds)
const REQUEST_TIMEOUT = 30000

// Create axios instance with timeout
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT,
})

// Helper to get user-friendly error message
function getErrorMessage(error: AxiosError): string {
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Please check your connection and try again.'
  }
  
  if (error.response) {
    const status = error.response.status
    const data = error.response.data as { error?: string; message?: string }
    
    // Use server's error message if available
    if (data?.error) {
      return data.error
    }
    if (data?.message) {
      return data.message
    }
    
    // HTTP status based messages
    switch (status) {
      case 400:
        return 'Invalid request. Please check your data and try again.'
      case 401:
        return 'Session expired. Please log in again.'
      case 403:
        return 'You do not have permission to perform this action.'
      case 404:
        return 'The requested item was not found.'
      case 409:
        return 'This operation conflicts with existing data. Please refresh and try again.'
      case 422:
        return 'Validation failed. Please check your input.'
      case 429:
        return 'Too many requests. Please wait a moment and try again.'
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Server error. Our team has been notified. Please try again later.'
      default:
        return `Request failed (${status}). Please try again.`
    }
  }
  
  if (error.request) {
    return 'Network error. Please check your internet connection and try again.'
  }
  
  return error.message || 'An unexpected error occurred. Please try again.'
}

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || '')
    return config
  },
  (error) => {
    console.error('[API] Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response: ${response.status}`, response.config.url)
    return response
  },
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { retryCount?: number; retryDelay?: number }
    
    // Set up retry count
    if (!config.retryCount) {
      config.retryCount = 0
    }
    
    // Check if we should retry
    const shouldRetry = (
      config.retryCount < MAX_RETRIES &&
      (!error.response || error.response.status >= 500 || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK')
    )
    
    if (shouldRetry) {
      config.retryCount += 1
      const delay = config.retryDelay || INITIAL_RETRY_DELAY * Math.pow(2, config.retryCount - 1)
      
      console.log(`[API] Retrying request (${config.retryCount}/${MAX_RETRIES}) after ${delay}ms: ${config.url}`)
      
      await new Promise(resolve => setTimeout(resolve, delay))
      return api(config)
    }
    
    // Log final error
    console.error('[API] Final error:', {
      url: config.url,
      method: config.method,
      status: error.response?.status,
      message: getErrorMessage(error),
      retryCount: config.retryCount,
    })
    
    // Enhance error with user-friendly message
    ;(error as any).userMessage = getErrorMessage(error)
    
    return Promise.reject(error)
  }
)

// Helper function for making API calls with retry logic
async function apiCallWithRetry<T>(
  call: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await call()
  } catch (error) {
    const axiosError = error as AxiosError
    const message = (axiosError as any).userMessage || getErrorMessage(axiosError)
    console.error(`[API] ${operationName} failed:`, message)
    throw new Error(message)
  }
}

// Product API
export const getProducts = (params?: { category?: string; search?: string }) =>
  apiCallWithRetry(() => api.get('/api/products', { params }), 'Fetch products')

export const getProduct = (id: string) =>
  apiCallWithRetry(() => api.get(`/api/products/${id}`), `Fetch product ${id}`)

export const createProduct = (data: {
  sku: string
  name: string
  description?: string
  category?: string
  price?: number
}) => apiCallWithRetry(() => api.post('/api/products', data), 'Create product')

export const updateProduct = (id: string, data: Partial<{
  name: string
  description: string
  category: string
  price: number
}>) => apiCallWithRetry(() => api.put(`/api/products/${id}`, data), `Update product ${id}`)

export const deleteProduct = (id: string) =>
  apiCallWithRetry(() => api.delete(`/api/products/${id}`), `Delete product ${id}`)

// Location API
export const getLocations = (params?: { type?: string }) =>
  apiCallWithRetry(() => api.get('/api/locations', { params }), 'Fetch locations')

export const getLocation = (id: string) =>
  apiCallWithRetry(() => api.get(`/api/locations/${id}`), `Fetch location ${id}`)

export const createLocation = (data: {
  name: string
  type: 'store' | 'warehouse'
  address?: string
}) => apiCallWithRetry(() => api.post('/api/locations', data), 'Create location')

export const updateLocation = (id: string, data: Partial<{
  name: string
  address: string
}>) => apiCallWithRetry(() => api.put(`/api/locations/${id}`, data), `Update location ${id}`)

export const deleteLocation = (id: string) =>
  apiCallWithRetry(() => api.delete(`/api/locations/${id}`), `Delete location ${id}`)

// Inventory API
export const getInventory = (params?: {
  product_id?: string
  location_id?: string
  low_stock?: boolean
}) => apiCallWithRetry(() => api.get('/api/inventory', { params }), 'Fetch inventory')

export const getLowStockAlerts = () =>
  apiCallWithRetry(() => api.get('/api/inventory/low-stock'), 'Fetch low stock alerts')

export const getInventorySummary = (type?: 'product' | 'location') =>
  apiCallWithRetry(() => api.get('/api/inventory/summary', { params: { type } }), 'Fetch inventory summary')

export const createInventory = (data: {
  product_id: string
  location_id: string
  quantity?: number
  min_stock_level?: number
}) => apiCallWithRetry(() => api.post('/api/inventory', data), 'Create inventory record')

export const updateInventory = (id: string, data: {
  quantity?: number
  min_stock_level?: number
  adjustment?: number
}) => apiCallWithRetry(() => api.put(`/api/inventory/${id}`, data), `Update inventory ${id}`)

export const deleteInventory = (id: string) =>
  apiCallWithRetry(() => api.delete(`/api/inventory/${id}`), `Delete inventory ${id}`)

// Health check
export const checkHealth = () =>
  apiCallWithRetry(() => api.get('/api/health'), 'Health check')

// Export helper for direct use
export { getErrorMessage }
