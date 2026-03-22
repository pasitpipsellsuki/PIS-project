import { useState, useEffect } from 'react'
import { getInventory, getLowStockAlerts, updateInventory, deleteInventory } from '../api'

interface InventoryItem {
  id: string
  product_id: string
  location_id: string
  quantity: number
  min_stock_level: number
  product_sku: string
  product_name: string
  category: string
  location_name: string
  location_type: string
  is_low_stock: boolean
}

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)
  const [adjustmentAmount, setAdjustmentAmount] = useState('')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showAdjustModal, setShowAdjustModal] = useState(false)

  useEffect(() => {
    fetchInventory()
    fetchLowStock()
  }, [showLowStock])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const params: { low_stock?: boolean } = {}
      if (showLowStock) params.low_stock = true
      
      const response = await getInventory(params)
      setInventory(response.data.inventory)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory')
      console.error('Fetch inventory error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLowStock = async () => {
    try {
      const response = await getLowStockAlerts()
      setLowStockItems(response.data.alerts)
    } catch (err) {
      console.error('Failed to fetch low stock alerts:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory record?')) return
    
    try {
      await deleteInventory(id)
      setInventory(inventory.filter(i => i.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete inventory record')
      console.error('Delete inventory error:', err)
    }
  }

  const handleAdjust = (item: InventoryItem) => {
    setSelectedItem(item)
    setAdjustmentAmount('')
    setShowAdjustModal(true)
  }

  const submitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    try {
      const amount = parseInt(adjustmentAmount)
      if (isNaN(amount)) {
        setError('Please enter a valid number')
        return
      }

      await updateInventory(selectedItem.id, { adjustment: amount })
      setShowAdjustModal(false)
      setAdjustmentAmount('')
      fetchInventory()
      fetchLowStock()
    } catch (err: any) {
      setError(err.message || 'Failed to adjust inventory')
      console.error('Adjust inventory error:', err)
    }
  }

  const getStockBadge = (quantity: number, minLevel: number) => {
    if (quantity <= minLevel) {
      return <span className="badge badge-danger">Low Stock</span>
    } else if (quantity <= minLevel * 1.5) {
      return <span className="badge badge-warning">Medium</span>
    } else {
      return <span className="badge badge-success">Good</span>
    }
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Inventory Management</h2>
          <div>
            <button 
              className={`btn ${showLowStock ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowLowStock(!showLowStock)}
              style={{ marginRight: '10px' }}
            >
              {showLowStock ? 'Show All' : 'Show Low Stock Only'}
            </button>
            {lowStockItems.length > 0 && (
              <span className="badge badge-danger">
                {lowStockItems.length} Low Stock Alerts
              </span>
            )}
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {lowStockItems.length > 0 && !showLowStock && (
          <div className="card" style={{ backgroundColor: '#fff3cd', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '10px' }}>⚠️ Low Stock Alerts</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Location</th>
                  <th>Current</th>
                  <th>Min Level</th>
                  <th>Shortage</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.slice(0, 5).map((item: any) => (
                  <tr key={item.product_id + item.location_id}>
                    <td>{item.name} ({item.sku})</td>
                    <td>{item.location_name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.min_stock_level}</td>
                    <td style={{ color: 'red', fontWeight: 'bold' }}>{item.shortage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lowStockItems.length > 5 && (
              <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
                And {lowStockItems.length - 5} more items...
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="loading">Loading inventory...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Location</th>
                <th>Quantity</th>
                <th>Min Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    No inventory records found
                  </td>
                </tr>
              ) : (
                inventory.map(item => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td>{item.product_sku}</td>
                    <td>
                      {item.location_name}
                      <br />
                      <small style={{ color: '#666' }}>{item.location_type}</small>
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{item.quantity}</td>
                    <td>{item.min_stock_level}</td>
                    <td>{getStockBadge(item.quantity, item.min_stock_level)}</td>
                    <td>
                      <button 
                        className="btn btn-secondary" 
                        style={{ marginRight: '8px' }}
                        onClick={() => handleAdjust(item)}
                      >
                        Adjust
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showAdjustModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Adjust Inventory</h2>
              <button className="close-btn" onClick={() => setShowAdjustModal(false)}>&times;</button>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Product:</strong> {selectedItem.product_name}</p>
              <p><strong>Location:</strong> {selectedItem.location_name}</p>
              <p><strong>Current Quantity:</strong> {selectedItem.quantity}</p>
            </div>
            <form onSubmit={submitAdjustment}>
              <div className="form-group">
                <label>Adjustment Amount *</label>
                <input
                  type="number"
                  value={adjustmentAmount}
                  onChange={e => setAdjustmentAmount(e.target.value)}
                  placeholder="Positive for stock in, negative for stock out"
                  required
                />
                <small style={{ color: '#666' }}>
                  Positive number = add stock, Negative number = remove stock
                </small>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
