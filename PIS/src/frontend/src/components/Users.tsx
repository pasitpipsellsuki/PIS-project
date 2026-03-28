import { useState, useEffect } from 'react'
import { getUsers, createUser, updateUserRole, updateUserStatus } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Navigate } from 'react-router-dom'

interface UserRecord {
  id: string
  email: string
  name: string
  role: string
  is_active: number
  last_login: string | null
  created_at: string
  team_name: string | null
  team_id: number | null
}

const ROLE_OPTIONS = ['admin', 'manager', 'staff', 'viewer']

const ROLE_BADGE_COLORS: Record<string, string> = {
  admin: '#dc3545',
  manager: '#fd7e14',
  staff: '#198754',
  viewer: '#6c757d',
}

export default function Users() {
  const { isAdmin, user: currentUser } = useAuth()
  const { showSuccess, showError } = useToast()

  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'staff',
  })

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await getUsers()
      setUsers(response.data.users)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole)
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
      showSuccess('Role updated successfully.')
    } catch (err: any) {
      showError(err.message || 'Failed to update role')
    }
  }

  const handleStatusToggle = async (userId: string, currentStatus: number) => {
    if (userId === currentUser?.id) {
      showError('You cannot change your own account status.')
      return
    }
    try {
      const newStatus = currentStatus === 1 ? false : true
      await updateUserStatus(userId, newStatus)
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: newStatus ? 1 : 0 } : u))
      showSuccess(`User ${newStatus ? 'activated' : 'deactivated'} successfully.`)
    } catch (err: any) {
      showError(err.message || 'Failed to update status')
    }
  }

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createUser(formData)
      showSuccess(`User "${formData.name}" created successfully.`)
      setShowModal(false)
      setFormData({ email: '', password: '', name: '', role: 'staff' })
      fetchUsers()
    } catch (err: any) {
      showError(err.message || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>User Management</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Invite User</button>
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="loading">Loading users...</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6c757d' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
            <h3 style={{ marginBottom: '8px', color: '#343a40' }}>No users found</h3>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Team</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.6 }}>
                  <td><strong>{u.name}</strong>{u.id === currentUser?.id && <span style={{ marginLeft: 6, fontSize: 11, color: '#6c757d' }}>(you)</span>}</td>
                  <td>{u.email}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: ROLE_BADGE_COLORS[u.role] || '#6c757d',
                        color: '#fff',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>{u.team_name || <span style={{ color: '#adb5bd' }}>—</span>}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: u.is_active ? '#d4edda' : '#f8d7da',
                        color: u.is_active ? '#155724' : '#721c24',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(u.last_login)}</td>
                  <td>{formatDate(u.created_at)}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      style={{ marginRight: '8px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '13px' }}
                      disabled={u.id === currentUser?.id}
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <button
                      className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={() => handleStatusToggle(u.id, u.is_active)}
                      disabled={u.id === currentUser?.id}
                      title={u.id === currentUser?.id ? 'Cannot change your own status' : ''}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
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
              <h2>Invite New User</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleInviteSubmit}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. Jane Smith"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="jane@example.com"
                />
              </div>
              <div className="form-group">
                <label>Temporary Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div style={{ background: '#e8f4fd', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', color: '#0c5460' }}>
                The user will be able to log in immediately with these credentials.
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
