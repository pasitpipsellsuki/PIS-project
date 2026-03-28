import { useState, useEffect } from 'react'
import { getInventory, getLowStockAlerts, updateInventory, deleteInventory, createInventory, getProducts, getLocations } from '../api'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

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

interface Product {
  id: string
  sku: string
  name: string
  product_type: string
}

interface Location {
  id: string
  name: string
  type: string
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

  // Add to Inventory modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [addForm, setAddForm] = useState({
    product_id: '',
    location_id: '',
    quantity: '0',
    min_stock_level: '0',
  })
  const [addLoading, setAddLoading] = useState(false)

  const { showSuccess, showError } = useToast()
  const { hasPermission } = useAuth()

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
    } finally {
      setLoading(false)
    }
  }

  const fetchLowStock = async () => {
    try {
      const response = await getLowStockAlerts()
      setLowStockItems(response.data.alerts)
    } catch {
      // Low stock alerts are non-critical — silently ignore
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory record?')) return

    try {
      await deleteInventory(id)
      setInventory(inventory.filter(i => i.id !== id))
      showSuccess('Inventory record deleted.')
    } catch (err: any) {
      showError(err.message || 'Failed to delete inventory record')
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

    const amount = parseInt(adjustmentAmount)
    if (isNaN(amount)) {
      showError('Please enter a valid number')
      return
    }

    try {
      await updateInventory(selectedItem.id, { adjustment: amount })
      setShowAdjustModal(false)
      setAdjustmentAmount('')
      showSuccess(`Stock adjusted by ${amount > 0 ? '+' : ''}${amount} for ${selectedItem.product_name}.`)
      fetchInventory()
      fetchLowStock()
    } catch (err: any) {
      showError(err.message || 'Failed to adjust inventory')
    }
  }

  const openAddModal = async () => {
    setAddForm({ product_id: '', location_id: '', quantity: '0', min_stock_level: '0' })
    setShowAddModal(true)
    try {
      const [prodRes, locRes] = await Promise.all([getProducts(), getLocations()])
      // Only physical products can have inventory
      const allProducts: Product[] = prodRes.data.products || []
      setProducts(allProducts.filter((p: Product) => p.product_type === 'physical' || !p.product_type))
      setLocations(locRes.data.locations || [])
    } catch {
      showError('Failed to load products or locations.')
      setShowAddModal(false)
    }
  }

  const submitAddInventory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.product_id || !addForm.location_id) {
      showError('Please select both a product and a location.')
      return
    }

    setAddLoading(true)
    try {
      await createInventory({
        product_id: addForm.product_id,
        location_id: addForm.location_id,
        quantity: parseInt(addForm.quantity) || 0,
        min_stock_level: parseInt(addForm.min_stock_level) || 0,
      })
      setShowAddModal(false)
      showSuccess('Product added to inventory successfully.')
      fetchInventory()
      fetchLowStock()
    } catch (err: any) {
      showError(err.message || 'Failed to add to inventory')
    } finally {
      setAddLoading(false)
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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className={`btn ${showLowStock ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowLowStock(!showLowStock)}
            >
              {showLowStock ? 'Show All' : 'Show Low Stock Only'}
            </button>
            {lowStockItems.length > 0 && (
              <span className="badge badge-danger">
                {lowStockItems.length} Low Stock Alert{lowStockItems.length !== 1 ? 's' : ''}
              </span>
            )}
            {hasPermission('create:inventory') && (
              <button className="btn btn-primary" onClick={openAddModal}>
                + Add to Inventory
              </button>
            )}
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {lowStockItems.length > 0 && !showLowStock && (
          <div className="card" style={{ backgroundColor: '#fff3cd', marginBottom: '20px', border: '1px solid #ffc107' }}>
            <h3 style={{ marginBottom: '10px', color: '#856404' }}>Low Stock Alerts</h3>
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
              <p style={{ marginTop: '10px', fontStyle: 'italic', color: '#856404' }}>
                And {lowStockItems.length - 5} more items need restocking...
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="loading">Loading inventory...</div>
        ) : inventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6c757d' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <h3 style={{ marginBottom: '8px', color: '#343a40' }}>No inventory records yet</h3>
            <p style={{ marginBottom: '20px' }}>
              {showLowStock
                ? 'No low-stock items found — your inventory looks healthy!'
                : 'Create products and add them to inventory to get started.'}
            </p>
            {!showLowStock && hasPermission('create:inventory') && (
              <button className="btn btn-primary" onClick={openAddModal}>
                + Add to Inventory
              </button>
            )}
          </div>
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
              {inventory.map(item => {
                const isLow = item.min_stock_level > 0 && item.quantity <= item.min_stock_level
                return (
                <tr key={item.id} style={isLow ? { backgroundColor: '#fff3cd' } : undefined}>
                  <td>
                    {item.product_name}
                    {isLow && (
                      <span className="badge badge-warning" style={{ marginLeft: '8px' }}>Low Stock</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-info">{item.product_sku}</span>
                  </td>
                  <td>
                    {item.location_name}
                    <br />
                    <small style={{ color: '#666' }}>{item.location_type}</small>
                  </td>
                  <td style={{ fontWeight: 'bold', color: isLow ? '#856404' : undefined }}>{item.quantity}</td>
                  <td>{item.min_stock_level}</td>
                  <td>{getStockBadge(item.quantity, item.min_stock_level)}</td>
                  <td>
                    {hasPermission('edit:inventory') && (
                      <button
                        className="btn btn-secondary"
                        style={{ marginRight: '8px' }}
                        onClick={() => handleAdjust(item)}
                      >
                        Adjust Stock
                      </button>
                    )}
                    {hasPermission('delete:inventory') && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Adjust Stock</h2>
              <button className="close-btn" onClick={() => setShowAdjustModal(false)}>&times;</button>
            </div>
            <div style={{ marginBottom: '20px', background: '#f8f9fa', padding: '12px', borderRadius: '6px' }}>
              <p><strong>Product:</strong> {selectedItem.product_name}</p>
              <p><strong>SKU:</strong> {selectedItem.product_sku}</p>
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
                  placeholder="e.g. +10 to add stock, -5 to remove"
                  required
                  autoFocus
                />
                <small style={{ color: '#666' }}>
                  Positive = add stock &nbsp;|&nbsp; Negative = remove stock
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

      {/* Add to Inventory Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Product to Inventory</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                <p>No products found. Please create products first.</p>
                <button className="btn btn-secondary" style={{ marginTop: '12px' }} onClick={() => setShowAddModal(false)}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submitAddInventory}>
                <div className="form-group">
                  <label>Product *</label>
                  <select
                    value={addForm.product_id}
                    onChange={e => setAddForm({ ...addForm, product_id: e.target.value })}
                    required
                  >
                    <option value="">-- Select a product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <select
                    value={addForm.location_id}
                    onChange={e => setAddForm({ ...addForm, location_id: e.target.value })}
                    required
                  >
                    <option value="">-- Select a location --</option>
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Initial Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={addForm.quantity}
                    onChange={e => setAddForm({ ...addForm, quantity: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Minimum Stock Level</label>
                  <input
                    type="number"
                    min="0"
                    value={addForm.min_stock_level}
                    onChange={e => setAddForm({ ...addForm, min_stock_level: e.target.value })}
                  />
                  <small style={{ color: '#666' }}>Alert threshold for low stock warnings</small>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={addLoading}>
                    {addLoading ? 'Adding...' : 'Add to Inventory'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
