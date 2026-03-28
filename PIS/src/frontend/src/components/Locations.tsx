import { useState, useEffect } from 'react'
import { getLocations, deleteLocation, createLocation, updateLocation } from '../api'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

interface Location {
  id: string
  name: string
  type: 'store' | 'warehouse'
  address: string
  created_at: string
}

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'store' as 'store' | 'warehouse',
    address: '',
  })

  const { showSuccess, showError } = useToast()
  const { hasPermission } = useAuth()

  useEffect(() => {
    fetchLocations()
  }, [filter])

  const fetchLocations = async () => {
    try {
      setLoading(true)
      const params: { type?: string } = {}
      if (filter) params.type = filter

      const response = await getLocations(params)
      setLocations(response.data.locations)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch locations')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      await deleteLocation(id)
      setLocations(locations.filter(l => l.id !== id))
      showSuccess(`Location "${name}" deleted.`)
    } catch (err: any) {
      showError(err.message || 'Failed to delete location')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, formData)
        showSuccess(`Location "${formData.name}" updated.`)
      } else {
        await createLocation(formData)
        showSuccess(`Location "${formData.name}" created.`)
      }

      setShowModal(false)
      setEditingLocation(null)
      setFormData({ name: '', type: 'store', address: '' })
      fetchLocations()
    } catch (err: any) {
      showError(err.message || 'Failed to save location')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      type: location.type,
      address: location.address || '',
    })
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingLocation(null)
    setFormData({ name: '', type: 'store', address: '' })
    setShowModal(true)
  }

  const getTypeBadge = (type: string) => {
    return type === 'store'
      ? <span className="badge badge-info">Store</span>
      : <span className="badge badge-success">Warehouse</span>
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Locations</h2>
          {hasPermission('create:locations') && (
            <button className="btn btn-primary" onClick={handleAdd}>+ Add Location</button>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        <div className="filter-bar">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="store">Stores</option>
            <option value="warehouse">Warehouses</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading locations...</div>
        ) : locations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6c757d' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
            <h3 style={{ marginBottom: '8px', color: '#343a40' }}>No locations yet</h3>
            <p style={{ marginBottom: '20px' }}>
              {filter
                ? `No ${filter}s found. Try a different filter.`
                : 'Add your first store or warehouse to start tracking inventory.'}
            </p>
            {!filter && hasPermission('create:locations') && (
              <button className="btn btn-primary" onClick={handleAdd}>
                + Add First Location
              </button>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map(location => (
                <tr key={location.id}>
                  <td><strong>{location.name}</strong></td>
                  <td>{getTypeBadge(location.type)}</td>
                  <td>{location.address || <span style={{ color: '#adb5bd' }}>—</span>}</td>
                  <td>
                    {hasPermission('edit:locations') && (
                      <button
                        className="btn btn-secondary"
                        style={{ marginRight: '8px' }}
                        onClick={() => handleEdit(location)}
                      >
                        Edit
                      </button>
                    )}
                    {hasPermission('delete:locations') && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(location.id, location.name)}
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
              <h2>{editingLocation ? 'Edit Location' : 'Add Location'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. Main Warehouse, Downtown Store"
                />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as 'store' | 'warehouse' })}
                  required
                >
                  <option value="store">Store</option>
                  <option value="warehouse">Warehouse</option>
                </select>
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  placeholder="Optional address"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingLocation ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
