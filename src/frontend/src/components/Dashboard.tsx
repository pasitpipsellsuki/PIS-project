import React, { useState, useEffect } from 'react'
import { getInventorySummary, getLowStockAlerts, getProducts, getLocations } from '../api'

interface ProductSummary {
  id: string
  sku: string
  name: string
  category: string
  location_count: number
  total_stock: number
  low_stock_locations: number
}

interface LocationSummary {
  id: string
  location_name: string
  location_type: string
  product_count: number
  total_units: number
  low_stock_items: number
}

interface LowStockAlert {
  product_id: string
  sku: string
  name: string
  location_name: string
  quantity: number
  min_stock_level: number
  shortage: number
}

export default function Dashboard() {
  const [productSummary, setProductSummary] = useState<ProductSummary[]>([])
  const [locationSummary, setLocationSummary] = useState<LocationSummary[]>([])
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalLocations, setTotalLocations] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [summaryRes, alertsRes, productsRes, locationsRes] = await Promise.all([
        getInventorySummary('product'),
        getLowStockAlerts(),
        getProducts(),
        getLocations(),
      ])

      setProductSummary(summaryRes.data.product_summary || [])
      
      const locationRes = await getInventorySummary('location')
      setLocationSummary(locationRes.data.location_summary || [])
      
      setLowStockAlerts(alertsRes.data.alerts || [])
      setTotalProducts(productsRes.data.products?.length || 0)
      setTotalLocations(locationsRes.data.locations?.length || 0)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalInventory = productSummary.reduce((sum, p) => sum + p.total_stock, 0)
  const totalLowStock = lowStockAlerts.length

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Dashboard Overview</h2>

      {loading ? (
        <div className="loading">Loading dashboard...</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Products</h3>
              <div className="value">{totalProducts}</div>
            </div>
            <div className="stat-card">
              <h3>Total Locations</h3>
              <div className="value">{totalLocations}</div>
            </div>
            <div className="stat-card">
              <h3>Total Inventory Units</h3>
              <div className="value">{totalInventory.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <h3>Low Stock Alerts</h3>
              <div className="value" style={{ color: totalLowStock > 0 ? '#dc3545' : '#28a745' }}>
                {totalLowStock}
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {totalLowStock > 0 && (
            <div className="card" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
              <h3 style={{ marginBottom: '15px', color: '#856404' }}>
                ⚠️ Low Stock Alerts ({totalLowStock})
              </h3>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Location</th>
                    <th>Current Stock</th>
                    <th>Min Required</th>
                    <th>Shortage</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockAlerts.slice(0, 10).map((alert, index) => (
                    <tr key={index}>
                      <td><strong>{alert.name}</strong><br/><small>{alert.sku}</small></td>
                      <td>{alert.location_name}</td>
                      <td style={{ fontWeight: 'bold', color: '#dc3545' }}>{alert.quantity}</td>
                      <td>{alert.min_stock_level}</td>
                      <td style={{ color: '#dc3545', fontWeight: 'bold' }}>+{alert.shortage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalLowStock > 10 && (
                <p style={{ marginTop: '15px', textAlign: 'center' }}>
                  <em>And {totalLowStock - 10} more items need attention...</em>
                </p>
              )}
            </div>
          )}

          {/* Inventory by Location */}
          <div className="card">
            <h3 style={{ marginBottom: '15px' }}>Inventory by Location</h3>
            <table>
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Products</th>
                  <th>Total Units</th>
                  <th>Low Stock Items</th>
                </tr>
              </thead>
              <tbody>
                {locationSummary.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  locationSummary.map(location => (
                    <tr key={location.id}>
                      <td>{location.location_name}</td>
                      <td>
                        <span className={`badge badge-${location.location_type === 'store' ? 'info' : 'success'}`}>
                          {location.location_type}
                        </span>
                      </td>
                      <td>{location.product_count}</td>
                      <td>{location.total_units.toLocaleString()}</td>
                      <td>
                        {location.low_stock_items > 0 ? (
                          <span className="badge badge-danger">{location.low_stock_items}</span>
                        ) : (
                          <span className="badge badge-success">0</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Top Products by Stock */}
          <div className="card">
            <h3 style={{ marginBottom: '15px' }}>Product Stock Overview</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Locations</th>
                  <th>Total Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {productSummary.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  productSummary.slice(0, 10).map(product => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        <br />
                        <small style={{ color: '#666' }}>{product.sku}</small>
                      </td>
                      <td>
                        {product.category && (
                          <span className="badge badge-info">{product.category}</span>
                        )}
                      </td>
                      <td>{product.location_count}</td>
                      <td>{product.total_stock.toLocaleString()}</td>
                      <td>
                        {product.low_stock_locations > 0 ? (
                          <span className="badge badge-danger">
                            {product.low_stock_locations} low
                          </span>
                        ) : (
                          <span className="badge badge-success">Good</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
