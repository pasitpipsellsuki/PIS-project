import { useState, useEffect, useCallback } from 'react'
import { checkHealth } from '../api'

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error'

interface HealthState {
  status: ConnectionStatus
  lastChecked: Date | null
  responseTime: number | null
  message: string
}

export function useApiHealth() {
  const [health, setHealth] = useState<HealthState>({
    status: 'connecting',
    lastChecked: null,
    responseTime: null,
    message: 'Checking connection...',
  })

  const checkConnection = useCallback(async () => {
    const startTime = Date.now()
    
    try {
      setHealth(prev => ({ ...prev, status: 'connecting', message: 'Checking...' }))
      
      await checkHealth()
      
      const responseTime = Date.now() - startTime
      
      setHealth({
        status: 'connected',
        lastChecked: new Date(),
        responseTime,
        message: `Connected (${responseTime}ms)`,
      })
    } catch (error) {
      setHealth({
        status: 'error',
        lastChecked: new Date(),
        responseTime: null,
        message: 'Connection failed',
      })
    }
  }, [])

  useEffect(() => {
    // Check immediately on mount
    checkConnection()
    
    // Then check every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    
    // Check when window regains focus
    const handleFocus = () => checkConnection()
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [checkConnection])

  return { ...health, checkConnection }
}

export function getStatusColor(status: ConnectionStatus): string {
  switch (status) {
    case 'connected':
      return '#10b981' // green
    case 'connecting':
      return '#f59e0b' // amber
    case 'disconnected':
    case 'error':
      return '#ef4444' // red
    default:
      return '#6b7280' // gray
  }
}

export function getStatusIcon(status: ConnectionStatus): string {
  switch (status) {
    case 'connected':
      return '🟢'
    case 'connecting':
      return '🟡'
    case 'disconnected':
    case 'error':
      return '🔴'
    default:
      return '⚪'
  }
}
