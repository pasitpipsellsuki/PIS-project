import React, { useState, useEffect } from 'react'
import { getLocations, deleteLocation, createLocation, updateLocation } from '../api'

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
  const [formData, setFormData] = useState({
    name: '',
    type: 'store' as 'store' | 'warehouse',
    address: '',
  })

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
    } catch (err) {
      setError('Failed to fetch locations')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return
    
    try {
      await deleteLocation(id)
      setLocations(locations.filter(l => l.id !== id))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete location')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, formData)
      } else {
        await createLocation(formData)
      }
      
      setShowModal(false)
      setEditingLocation(null)
      setFormData({ name: '', type: 'store', address: '' })
      fetchLocations()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save location')
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
          <button className="btn btn-primary" onClick={handleAdd}>+ Add Location</button>
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
              {locations.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>
                    No locations found
                  </td>
                </tr>
              ) : (
                locations.map(location => (
                  <tr key={location.id}>
                    <td>{location.name}</td>
                    <td>{getTypeBadge(location.type)}</td>
                    <td>{location.address || '-'}</td>
                    <td>
                      <button 
                        className="btn btn-secondary" 
                        style={{ marginRight: '8px' }}
                        onClick={() => handleEdit(location)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDelete(location.id)}
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
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as 'store' | 'warehouse'})}
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
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  rows={2}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingLocation ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
