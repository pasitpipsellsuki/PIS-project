import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import Products from './components/Products'
import Locations from './components/Locations'
import Inventory from './components/Inventory'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import { useAuth } from './context/AuthContext'
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
  const { user, logout } = useAuth()

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
        <div className="nav-user">
          <span className="user-name">{user?.name}</span>
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
