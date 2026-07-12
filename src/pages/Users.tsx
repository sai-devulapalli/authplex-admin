import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { User } from '../types'

interface EditState {
  user: User
  name: string
  phone: string
  enabled: boolean
}

interface CreateState {
  name: string
  email: string
  phone: string
  password: string
}

const emptyCreate = (): CreateState => ({ name: '', email: '', phone: '', password: '' })

export default function Users({ tenantId }: { tenantId: string }) {
  const { client } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [purging, setPurging] = useState<string | null>(null)
  const [edit, setEdit] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [create, setCreate] = useState<CreateState | null>(null)
  const [creating, setCreating] = useState(false)

  const loadUsers = () => {
    if (!client || !tenantId) return
    setLoading(true)
    client
      .listUsers(tenantId)
      .then((data) => {
        setUsers(data.users || [])
        setTotal(data.count || 0)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(loadUsers, [client, tenantId])

  const handlePurge = (u: User) => {
    if (!client) return
    if (!window.confirm(`Permanently delete ${u.email}? This cannot be undone.`)) return
    setPurging(u.id)
    client
      .purgeUser(tenantId, u.id)
      .then(() => {
        setUsers((prev) => prev.filter((x) => x.id !== u.id))
        setTotal((prev) => prev - 1)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to purge user'))
      .finally(() => setPurging(null))
  }

  const handleEditSave = () => {
    if (!client || !edit) return
    setSaving(true)
    client
      .updateUser(tenantId, edit.user.id, { name: edit.name, phone: edit.phone, enabled: edit.enabled })
      .then((updated) => {
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
        setEdit(null)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to update user'))
      .finally(() => setSaving(false))
  }

  const handleCreate = () => {
    if (!client || !create) return
    setCreating(true)
    client
      .createUser(tenantId, { ...create, phone: create.phone || undefined })
      .then(() => {
        setCreate(null)
        loadUsers()
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to create user'))
      .finally(() => setCreating(false))
  }

  return (
    <div>
      <div className="section-header">
        <h2>Users ({total})</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setCreate(emptyCreate())}>
          + Add User
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <p>No users registered in this tenant yet.</p>
          <p style={{ marginTop: '8px', color: '#666' }}>
            Users are created when they register via the Web App or API.
          </p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Verified</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phone || '—'}</td>
                <td>
                  <span className={`tag ${u.email_verified ? 'tag-green' : 'tag-yellow'}`}>
                    {u.email_verified ? 'verified' : 'unverified'}
                  </span>
                </td>
                <td>
                  <span className={`tag ${u.enabled ? 'tag-green' : 'tag-red'}`}>
                    {u.enabled ? 'active' : 'disabled'}
                  </span>
                </td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-sm"
                    onClick={() => setEdit({ user: u, name: u.name, phone: u.phone || '', enabled: u.enabled })}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handlePurge(u)}
                    disabled={purging === u.id}
                  >
                    {purging === u.id ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Create User Modal */}
      {create && (
        <div className="modal-overlay" onClick={() => setCreate(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add User</h3>
              <button className="btn-link" onClick={() => setCreate(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input
                  className="form-control"
                  placeholder="Full name"
                  value={create.name}
                  onChange={(e) => setCreate({ ...create, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="user@example.com"
                  value={create.email}
                  onChange={(e) => setCreate({ ...create, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone <span style={{ fontWeight: 400, color: '#999' }}>(optional)</span></label>
                <input
                  className="form-control"
                  type="tel"
                  placeholder="+1 555 000 0000"
                  value={create.phone}
                  onChange={(e) => setCreate({ ...create, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  className="form-control"
                  type="password"
                  placeholder="Temporary password"
                  value={create.password}
                  onChange={(e) => setCreate({ ...create, password: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setCreate(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={creating || !create.name || !create.email || !create.password}
              >
                {creating ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {edit && (
        <div className="modal-overlay" onClick={() => setEdit(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User</h3>
              <button className="btn-link" onClick={() => setEdit(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#666', marginBottom: '16px', fontSize: '13px' }}>{edit.user.email}</p>
              <div className="form-group">
                <label>Name</label>
                <input
                  className="form-control"
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone <span style={{ fontWeight: 400, color: '#999' }}>(optional)</span></label>
                <input
                  className="form-control"
                  type="tel"
                  placeholder="+1 555 000 0000"
                  value={edit.phone}
                  onChange={(e) => setEdit({ ...edit, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={edit.enabled}
                    onChange={(e) => setEdit({ ...edit, enabled: e.target.checked })}
                  />
                  Enabled
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setEdit(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEditSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
