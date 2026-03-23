import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Products from './components/Products'
import Locations from './components/Locations'
import Inventory from './components/Inventory'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import './App.css'

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function Navigation() {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()
  
  // Don't show navigation on login page
  if (location.pathname === '/login') {
    return null
  }
  
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <h1>📦 Product Information System</h1>
        <div className="nav-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Dashboard</Link>
          <Link to="/products" className={location.pathname === '/products' ? 'active' : ''}>Products</Link>
          <Link to="/locations" className={location.pathname === '/locations' ? 'active' : ''}>Locations</Link>
          <Link to="/inventory" className={location.pathname === '/inventory' ? 'active' : ''}>Inventory</Link>
        </div>
        {isAuthenticated && user && (
          <div className="user-menu">
            <span className="user-name">👤 {user.name}</span>
            <button onClick={logout} className="btn btn-logout">Logout</button>
          </div>
        )}
      </div>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <div className="container">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
