import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
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

function Navigation() {
  const location = useLocation()
  const { user, logout, isAdmin, isManagerOrAbove } = useAuth()
  const [lowStockCount, setLowStockCount] = useState(0)

  useEffect(() => {
    getLowStockAlerts()
      .then((res: any) => setLowStockCount(res.data?.count || 0))
      .catch(() => {/* non-critical */})
  }, [])

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <h1>📦 Product Information System</h1>
        <div className="nav-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Dashboard</Link>
          <Link to="/products" className={location.pathname === '/products' ? 'active' : ''}>Products</Link>
          <Link to="/locations" className={location.pathname === '/locations' ? 'active' : ''}>Locations</Link>
          <Link to="/inventory" className={location.pathname === '/inventory' ? 'active' : ''}>
            Inventory
            {lowStockCount > 0 && (
              <span style={{
                display: 'inline-block',
                marginLeft: '6px',
                background: '#dc3545',
                color: '#fff',
                borderRadius: '10px',
                fontSize: '11px',
                padding: '1px 7px',
                fontWeight: 'bold',
                verticalAlign: 'middle',
              }}>
                {lowStockCount}
              </span>
            )}
          </Link>
          {isManagerOrAbove && (
            <Link to="/teams" className={location.pathname === '/teams' ? 'active' : ''}>Teams</Link>
          )}
          {isManagerOrAbove && (
            <Link to="/plans" className={location.pathname === '/plans' ? 'active' : ''}>
              QMS Plans
            </Link>
          )}
          {isAdmin && (
            <Link to="/users" className={location.pathname === '/users' ? 'active' : ''}>Users</Link>
          )}
        </div>
        <div className="nav-user">
          <span className="user-name">{user?.name}</span>
          {user?.role && (
            <span
              style={{
                fontSize: '11px',
                background: '#e9ecef',
                color: '#495057',
                padding: '2px 8px',
                borderRadius: '10px',
                marginRight: '8px',
              }}
            >
              {user.role}
            </span>
          )}
          <button className="btn btn-secondary btn-sm" onClick={logout}>Logout</button>
        </div>
      </div>
    </nav>
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
              <div className="App">
                <Navigation />
                <div className="container">
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
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
