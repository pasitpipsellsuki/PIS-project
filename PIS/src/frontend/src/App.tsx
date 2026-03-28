import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Products from './components/Products'
import Locations from './components/Locations'
import Inventory from './components/Inventory'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import Users from './components/Users'
import Teams from './components/Teams'
import Plans from './components/Plans'
import { useAuth } from './context/AuthContext'
import { getLowStockAlerts } from './api'
import './App.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Overview of your inventory and alerts' },
  '/products': { title: 'Products', subtitle: 'Manage your product catalog' },
  '/locations': { title: 'Locations', subtitle: 'Stores and warehouses' },
  '/inventory': { title: 'Inventory', subtitle: 'Stock levels and adjustments' },
  '/teams': { title: 'Teams', subtitle: 'Manage team members' },
  '/plans': { title: 'QMS Plans', subtitle: 'Quality management service plans' },
  '/users': { title: 'Users', subtitle: 'Manage user accounts and roles' },
}

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAdmin, isManagerOrAbove } = useAuth()
  const [lowStockCount, setLowStockCount] = useState(0)

  useEffect(() => {
    getLowStockAlerts()
      .then((res: any) => setLowStockCount(res.data?.count || 0))
      .catch(() => {/* non-critical */})
  }, [])

  const isActive = (path: string) => location.pathname === path
  const go = (path: string) => navigate(path)

  const avatarInitial = user?.email ? user.email[0].toUpperCase() : '?'
  const displayName = user?.name || user?.email || 'User'

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">📦</div>
        <div>
          <div className="sidebar-logo-text">PIS</div>
          <div className="sidebar-logo-sub">Product Information</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-nav-item ${isActive('/') ? 'active' : ''}`}
          onClick={() => go('/')}
        >
          <span className="sidebar-nav-icon">📊</span>
          Dashboard
        </button>
        <button
          className={`sidebar-nav-item ${isActive('/products') ? 'active' : ''}`}
          onClick={() => go('/products')}
        >
          <span className="sidebar-nav-icon">📦</span>
          Products
        </button>
        <button
          className={`sidebar-nav-item ${isActive('/locations') ? 'active' : ''}`}
          onClick={() => go('/locations')}
        >
          <span className="sidebar-nav-icon">📍</span>
          Locations
        </button>
        <button
          className={`sidebar-nav-item ${isActive('/inventory') ? 'active' : ''}`}
          onClick={() => go('/inventory')}
        >
          <span className="sidebar-nav-icon">🗃️</span>
          Inventory
          {lowStockCount > 0 && (
            <span className="sidebar-badge">{lowStockCount}</span>
          )}
        </button>

        {isManagerOrAbove && (
          <>
            <div className="sidebar-section-label">Management</div>
            <button
              className={`sidebar-nav-item ${isActive('/teams') ? 'active' : ''}`}
              onClick={() => go('/teams')}
            >
              <span className="sidebar-nav-icon">👥</span>
              Teams
            </button>
            <button
              className={`sidebar-nav-item ${isActive('/plans') ? 'active' : ''}`}
              onClick={() => go('/plans')}
            >
              <span className="sidebar-nav-icon">💎</span>
              QMS Plans
            </button>
          </>
        )}
        {isAdmin && (
          <button
            className={`sidebar-nav-item ${isActive('/users') ? 'active' : ''}`}
            onClick={() => go('/users')}
          >
            <span className="sidebar-nav-icon">🧑‍💼</span>
            Users
          </button>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{avatarInitial}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{displayName}</div>
            {user?.role && <div className="sidebar-user-role">{user.role}</div>}
          </div>
          <button className="sidebar-logout" onClick={logout} title="Sign out">→</button>
        </div>
      </div>
    </aside>
  )
}

function PageHeader() {
  const location = useLocation()
  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'PIS', subtitle: '' }

  return (
    <div className="page-header">
      <div className="page-header-left">
        <h1>{pageInfo.title}</h1>
        {pageInfo.subtitle && <p>{pageInfo.subtitle}</p>}
      </div>
    </div>
  )
}

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <PageHeader />
        <div className="page-body">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/users" element={<Users />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/plans" element={<Plans />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
