import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Products from './components/Products'
import Locations from './components/Locations'
import Inventory from './components/Inventory'
import Dashboard from './components/Dashboard'
import './App.css'

function Navigation() {
  const location = useLocation()
  
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
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/inventory" element={<Inventory />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
