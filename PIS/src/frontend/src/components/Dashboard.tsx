import { useState, useEffect } from 'react'
import { getInventorySummary, getLowStockAlerts, getProducts, getLocations } from '../api'

interface ProductSummary {
  id: string
  sku: string
  name: string
  category: string
  product_type: string
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
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalInventory = productSummary.reduce((sum, p) => sum + p.total_stock, 0)
  const totalLowStock = lowStockAlerts.length

  return (
    <div>
      {loading ? (
        <div className="loading">Loading dashboard...</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon">📦</div>
              <div className="stat-card-value">{totalProducts}</div>
              <div className="stat-card-label">Total Products</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">📍</div>
              <div className="stat-card-value">{totalLocations}</div>
              <div className="stat-card-label">Total Locations</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">🗃️</div>
              <div className="stat-card-value">{totalInventory.toLocaleString()}</div>
              <div className="stat-card-label">Total Inventory Units</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">⚠️</div>
              <div className="stat-card-value" style={{ color: totalLowStock > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {totalLowStock}
              </div>
              <div className="stat-card-label">Low Stock Alerts</div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {totalLowStock > 0 && (
            <div className="table-container" style={{ marginBottom: '20px' }}>
              <div className="table-toolbar">
                <div className="table-title" style={{ color: 'var(--warning-text)' }}>
                  ⚠️ Low Stock Alerts ({totalLowStock})
                </div>
              </div>
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
                    <tr key={index} className="row-warning">
                      <td>
                        <strong>{alert.name}</strong>
                        <br/>
                        <span className="td-muted">{alert.sku}</span>
                      </td>
                      <td>{alert.location_name}</td>
                      <td style={{ fontWeight: '700', color: 'var(--danger)' }}>{alert.quantity}</td>
                      <td>{alert.min_stock_level}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: '700' }}>+{alert.shortage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalLowStock > 10 && (
                <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)' }}>
                  And {totalLowStock - 10} more items need attention...
                </div>
              )}
            </div>
          )}

          {/* Inventory by Location */}
          <div className="table-container">
            <div className="table-toolbar">
              <div className="table-title">Inventory by Location</div>
            </div>
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
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  locationSummary.map(location => (
                    <tr key={location.id}>
                      <td><strong>{location.location_name}</strong></td>
                      <td>
                        <span className={`badge ${location.location_type === 'store' ? 'badge-info' : 'badge-success'}`}>
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
          <div className="table-container">
            <div className="table-toolbar">
              <div className="table-title">Product Stock Overview</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Locations</th>
                  <th>Total Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {productSummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  productSummary.slice(0, 10).map(product => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        <br />
                        <span className="td-muted">{product.sku}</span>
                      </td>
                      <td>
                        {product.product_type === 'service' && (
                          <span className="badge badge-service">Service</span>
                        )}
                        {product.product_type === 'digital' && (
                          <span className="badge badge-digital">Digital</span>
                        )}
                        {(!product.product_type || product.product_type === 'physical') && (
                          <span className="badge badge-physical">Physical</span>
                        )}
                      </td>
                      <td>
                        {product.category && (
                          <span className="badge badge-info">{product.category}</span>
                        )}
                      </td>
                      <td>
                        {product.product_type === 'service'
                          ? <span className="td-muted">N/A</span>
                          : product.location_count}
                      </td>
                      <td>
                        {product.product_type === 'service'
                          ? <span className="td-muted">Service</span>
                          : product.total_stock.toLocaleString()}
                      </td>
                      <td>
                        {product.product_type === 'service'
                          ? <span className="td-muted">—</span>
                          : product.low_stock_locations > 0
                            ? <span className="badge badge-danger">{product.low_stock_locations} low</span>
                            : <span className="badge badge-success">Good</span>
                        }
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
