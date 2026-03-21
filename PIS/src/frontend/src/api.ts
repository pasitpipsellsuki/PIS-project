import axios from 'axios'

// API base URL - adjust based on your deployment
const API_URL = import.meta.env.VITE_API_URL || 'https://pis-project.pasitpipsellsuki.workers.dev'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Product API
export const getProducts = (params?: { category?: string; search?: string }) =>
  api.get('/api/products', { params })

export const getProduct = (id: string) =>
  api.get(`/api/products/${id}`)

export const createProduct = (data: {
  sku: string
  name: string
  description?: string
  category?: string
  price?: number
}) => api.post('/api/products', data)

export const updateProduct = (id: string, data: Partial<{
  name: string
  description: string
  category: string
  price: number
}>) => api.put(`/api/products/${id}`, data)

export const deleteProduct = (id: string) =>
  api.delete(`/api/products/${id}`)

// Location API
export const getLocations = (params?: { type?: string }) =>
  api.get('/api/locations', { params })

export const getLocation = (id: string) =>
  api.get(`/api/locations/${id}`)

export const createLocation = (data: {
  name: string
  type: 'store' | 'warehouse'
  address?: string
}) => api.post('/api/locations', data)

export const updateLocation = (id: string, data: Partial<{
  name: string
  address: string
}>) => api.put(`/api/locations/${id}`, data)

export const deleteLocation = (id: string) =>
  api.delete(`/api/locations/${id}`)

// Inventory API
export const getInventory = (params?: {
  product_id?: string
  location_id?: string
  low_stock?: boolean
}) => api.get('/api/inventory', { params })

export const getLowStockAlerts = () =>
  api.get('/api/inventory/low-stock')

export const getInventorySummary = (type?: 'product' | 'location') =>
  api.get('/api/inventory/summary', { params: { type } })

export const createInventory = (data: {
  product_id: string
  location_id: string
  quantity?: number
  min_stock_level?: number
}) => api.post('/api/inventory', data)

export const updateInventory = (id: string, data: {
  quantity?: number
  min_stock_level?: number
  adjustment?: number
}) => api.put(`/api/inventory/${id}`, data)

export const deleteInventory = (id: string) =>
  api.delete(`/api/inventory/${id}`)

// Health check
export const checkHealth = () =>
  api.get('/api/health')
