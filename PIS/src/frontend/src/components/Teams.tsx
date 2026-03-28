import { useState, useEffect } from 'react'
import { getTeams, getTeam, createTeam, updateTeam, deleteTeam, addTeamMember, removeTeamMember, getUsers } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Navigate } from 'react-router-dom'

interface TeamRecord {
  id: number
  name: string
  description: string | null
  lead_user_id: string | null
  lead_name: string | null
  lead_email: string | null
  member_count: number
  created_at: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
}

interface UserOption {
  id: string
  name: string
  email: string
}

export default function Teams() {
  const { isManagerOrAbove, isAdmin } = useAuth()
  const { showSuccess, showError } = useToast()

  const [teams, setTeams] = useState<TeamRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<TeamRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [allUsers, setAllUsers] = useState<UserOption[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    lead_user_id: '',
  })

  const [selectedTeam, setSelectedTeam] = useState<(TeamRecord & { members?: TeamMember[] }) | null>(null)
  const [showMembersDrawer, setShowMembersDrawer] = useState(false)
  const [addMemberId, setAddMemberId] = useState('')
  const [membersLoading, setMembersLoading] = useState(false)

  if (!isManagerOrAbove) {
    return <Navigate to="/" replace />
  }

  useEffect(() => {
    fetchTeams()
    fetchAllUsers()
  }, [])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const response = await getTeams()
      setTeams(response.data.teams)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch teams')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const response = await getUsers()
      setAllUsers(response.data.users.map((u: any) => ({ id: u.id, name: u.name, email: u.email })))
    } catch {
      // Non-admin users cannot call GET /api/users, ignore silently
    }
  }

  const handleAdd = () => {
    setEditingTeam(null)
    setFormData({ name: '', description: '', lead_user_id: '' })
    setShowModal(true)
  }

  const handleEdit = (team: TeamRecord) => {
    setEditingTeam(team)
    setFormData({
      name: team.name,
      description: team.description || '',
      lead_user_id: team.lead_user_id || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        lead_user_id: formData.lead_user_id || undefined,
      }
      if (editingTeam) {
        await updateTeam(editingTeam.id, payload)
        showSuccess(`Team "${formData.name}" updated successfully.`)
      } else {
        await createTeam(payload)
        showSuccess(`Team "${formData.name}" created successfully.`)
      }
      setShowModal(false)
      fetchTeams()
    } catch (err: any) {
      showError(err.message || 'Failed to save team')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (team: TeamRecord) => {
    if (!isAdmin) {
      showError('Only admins can delete teams.')
      return
    }
    if (!confirm(`Delete team "${team.name}"? All members will be unassigned.`)) return
    try {
      await deleteTeam(team.id)
      setTeams(teams.filter(t => t.id !== team.id))
      showSuccess(`Team "${team.name}" deleted.`)
    } catch (err: any) {
      showError(err.message || 'Failed to delete team')
    }
  }

  const openMembersDrawer = async (team: TeamRecord) => {
    setSelectedTeam(team)
    setShowMembersDrawer(true)
    setMembersLoading(true)
    setAddMemberId('')
    try {
      const response = await getTeam(team.id)
      setSelectedTeam(response.data.team)
    } catch (err: any) {
      showError('Failed to load team members')
    } finally {
      setMembersLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedTeam || !addMemberId) return
    try {
      await addTeamMember(selectedTeam.id, addMemberId)
      showSuccess('Member added to team.')
      setAddMemberId('')
      const response = await getTeam(selectedTeam.id)
      setSelectedTeam(response.data.team)
      fetchTeams()
    } catch (err: any) {
      showError(err.message || 'Failed to add member')
    }
  }

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!selectedTeam) return
    if (!confirm(`Remove "${userName}" from "${selectedTeam.name}"?`)) return
    try {
      await removeTeamMember(selectedTeam.id, userId)
      showSuccess(`${userName} removed from team.`)
      const response = await getTeam(selectedTeam.id)
      setSelectedTeam(response.data.team)
      fetchTeams()
    } catch (err: any) {
      showError(err.message || 'Failed to remove member')
    }
  }

  const currentMembers = (selectedTeam as any)?.members || []
  const currentMemberIds = currentMembers.map((m: TeamMember) => m.id)
  const availableToAdd = allUsers.filter(u => !currentMemberIds.includes(u.id))

  return (
    <div>
      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading teams...</div>
      ) : teams.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <h3>No teams yet</h3>
            <p>Get started by creating your first team.</p>
            <button className="btn btn-primary" onClick={handleAdd}>+ Create First Team</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button className="btn btn-primary btn-sm" onClick={handleAdd}>+ New Team</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {teams.map(team => (
              <div key={team.id} className="card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                    {team.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(team)}>Edit</button>
                    {isAdmin && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(team)}>Delete</button>
                    )}
                  </div>
                </div>

                {team.description && (
                  <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    {team.description}
                  </p>
                )}

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  {team.lead_name ? (
                    <div><strong>Lead:</strong> {team.lead_name}</div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No team lead assigned</div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                  <span className="badge badge-gray">
                    {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => openMembersDrawer(team)}
                  >
                    Manage Members
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create/Edit Team Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTeam ? 'Edit Team' : 'New Team'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Team Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. Warehouse Team"
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
                {allUsers.length > 0 && (
                  <div className="form-group">
                    <label>Team Lead</label>
                    <select
                      value={formData.lead_user_id}
                      onChange={e => setFormData({ ...formData, lead_user_id: e.target.value })}
                    >
                      <option value="">— No lead assigned —</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="modal-footer" style={{ padding: '0', marginTop: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersDrawer && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowMembersDrawer(false)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Members — {selectedTeam.name}</h2>
              <button className="close-btn" onClick={() => setShowMembersDrawer(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {membersLoading ? (
                <div className="loading">Loading members...</div>
              ) : (
                <>
                  {currentMembers.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', fontSize: '13.5px' }}>No members in this team yet.</p>
                  ) : (
                    <table style={{ marginBottom: '20px' }}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentMembers.map((m: TeamMember) => (
                          <tr key={m.id}>
                            <td><strong>{m.name}</strong></td>
                            <td className="td-muted">{m.email}</td>
                            <td>
                              <span className="badge badge-info" style={{ fontSize: '11px' }}>{m.role}</span>
                            </td>
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleRemoveMember(m.id, m.name)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {availableToAdd.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                      <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>Add Member</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                          value={addMemberId}
                          onChange={e => setAddMemberId(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1.5px solid var(--border)',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            color: 'var(--text-primary)',
                            background: 'var(--surface)',
                            outline: 'none',
                          }}
                        >
                          <option value="">— Select a user —</option>
                          {availableToAdd.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                          ))}
                        </select>
                        <button
                          className="btn btn-primary"
                          onClick={handleAddMember}
                          disabled={!addMemberId}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button className="btn btn-secondary" onClick={() => setShowMembersDrawer(false)}>Close</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
