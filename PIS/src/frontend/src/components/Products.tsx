import { useState, useEffect } from 'react'
import { getProducts, deleteProduct, createProduct, updateProduct } from '../api'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

interface Product {
  id: string
  sku: string
  name: string
  description: string
  category: string
  price: number
  product_type: string
  is_active: boolean
  total_stock: number
  location_count: number
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    price: '',
    product_type: 'physical',
  })

  const { showSuccess, showError } = useToast()
  const { hasPermission } = useAuth()

  useEffect(() => {
    fetchProducts()
  }, [category])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params: { search?: string; category?: string } = {}
      if (search) params.search = search
      if (category) params.category = category

      const response = await getProducts(params)
      setProducts(response.data.products)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProducts()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      await deleteProduct(id)
      setProducts(products.filter(p => p.id !== id))
      showSuccess(`Product "${name}" deleted.`)
    } catch (err: any) {
      showError(err.message || 'Failed to delete product')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const data = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : undefined,
        product_type: formData.product_type || 'physical',
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, data)
        showSuccess(`Product "${formData.name}" updated successfully.`)
      } else {
        await createProduct(data as any)
        showSuccess(`Product "${formData.name}" created. Go to Inventory to assign it to a location.`)
      }

      setShowModal(false)
      setEditingProduct(null)
      setFormData({ sku: '', name: '', description: '', category: '', price: '', product_type: 'physical' })
      fetchProducts()
    } catch (err: any) {
      showError(err.message || 'Failed to save product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      price: product.price?.toString() || '',
      product_type: product.product_type || 'physical',
    })
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingProduct(null)
    setFormData({ sku: '', name: '', description: '', category: '', price: '', product_type: 'physical' })
    setShowModal(true)
  }

  const getProductTypeBadge = (type: string) => {
    switch (type) {
      case 'digital':
        return <span className="badge" style={{ background: '#7c3aed', color: '#fff' }}>Digital</span>
      case 'service':
        return <span className="badge" style={{ background: '#16a34a', color: '#fff' }}>Service</span>
      default:
        return <span className="badge" style={{ background: '#2563eb', color: '#fff' }}>Physical</span>
    }
  }

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Products</h2>
          {hasPermission('create:products') && (
            <button className="btn btn-primary" onClick={handleAdd}>+ Add Product</button>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            placeholder="Search by name, SKU, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        <div className="filter-bar">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6c757d' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏷️</div>
            <h3 style={{ marginBottom: '8px', color: '#343a40' }}>No products yet</h3>
            <p style={{ marginBottom: '20px' }}>
              {search || category
                ? 'No products match your search. Try different keywords or clear the filter.'
                : 'Get started by adding your first product.'}
            </p>
            {!search && !category && hasPermission('create:products') && (
              <button className="btn btn-primary" onClick={handleAdd}>
                + Add First Product
              </button>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Type</th>
                <th>Category</th>
                <th>Price</th>
                <th>Total Stock</th>
                <th>Locations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>
                    <span className="badge badge-info">{product.sku}</span>
                  </td>
                  <td><strong>{product.name}</strong></td>
                  <td>{getProductTypeBadge(product.product_type || 'physical')}</td>
                  <td>
                    {product.category && (
                      <span className="badge badge-success">{product.category}</span>
                    )}
                  </td>
                  <td>${product.price?.toFixed(2) || '0.00'}</td>
                  <td>
                    {product.product_type === 'service'
                      ? <span style={{ color: '#6c757d', fontStyle: 'italic' }}>N/A</span>
                      : product.total_stock || 0}
                  </td>
                  <td>
                    {product.product_type === 'service'
                      ? <span style={{ color: '#6c757d', fontStyle: 'italic' }}>N/A</span>
                      : product.location_count || 0}
                  </td>
                  <td>
                    {hasPermission('edit:products') && (
                      <button
                        className="btn btn-secondary"
                        style={{ marginRight: '8px' }}
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </button>
                    )}
                    {hasPermission('delete:products') && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(product.id, product.name)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>SKU *</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  required
                  disabled={!!editingProduct}
                  placeholder="e.g. PROD-001"
                />
              </div>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Product name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Electronics, Clothing"
                />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Product Type</label>
                <select
                  value={formData.product_type}
                  onChange={e => setFormData({ ...formData, product_type: e.target.value })}
                >
                  <option value="physical">Physical</option>
                  <option value="digital">Digital</option>
                  <option value="service">Service</option>
                </select>
                <small style={{ color: '#666' }}>
                  Physical = trackable inventory. Digital = ebooks, codes. Service = haircut, massage, etc.
                </small>
              </div>
              {!editingProduct && (
                <div style={{ background: '#e8f4fd', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', color: '#0c5460' }}>
                  After creating the product, go to <strong>Inventory</strong> to assign it to a location and set stock levels.
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
