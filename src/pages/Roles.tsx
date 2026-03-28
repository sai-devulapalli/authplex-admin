import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import type { Role } from '../types'

export default function Roles({ tenantId }: { tenantId: string }) {
  const { client } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', description: '', permissions: '' })

  useEffect(() => { loadRoles() }, [client, tenantId])

  async function loadRoles() {
    if (!client) return
    setLoading(true)
    try {
      const res = await client.listRoles(tenantId)
      setRoles(Array.isArray(res) ? res : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!client) return
    setError('')
    try {
      await client.createRole(tenantId, {
        name: form.name,
        description: form.description,
        permissions: form.permissions.split('\n').map((s) => s.trim()).filter(Boolean),
      })
      setShowCreate(false)
      setForm({ name: '', description: '', permissions: '' })
      await loadRoles()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create role')
    }
  }

  async function handleDelete(roleId: string) {
    if (!client || !confirm(`Delete this role?`)) return
    try {
      await client.deleteRole(tenantId, roleId)
      await loadRoles()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete role')
    }
  }

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'description', header: 'Description' },
    {
      key: 'permissions', header: 'Permissions',
      render: (r: Role) => (
        <div className="tag-list">
          {(r.permissions || []).map((p, i) => <span key={i} className="tag">{p}</span>)}
        </div>
      ),
    },
    {
      key: 'actions', header: '',
      render: (r: Role) => (
        <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(r.id) }}>
          Delete
        </button>
      ),
    },
  ]

  if (loading) return <div className="loading">Loading roles...</div>

  return (
    <div>
      <div className="section-header">
        <h2>Roles &amp; Permissions</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>Create Role</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <DataTable columns={columns} data={roles} emptyMessage="No roles defined." />

      <Modal title="Create Role" isOpen={showCreate} onClose={() => setShowCreate(false)}>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Role Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="admin" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Administrator role" />
          </div>
          <div className="form-group">
            <label>Permissions (one per line)</label>
            <textarea value={form.permissions} onChange={(e) => setForm({ ...form, permissions: e.target.value })} rows={4} placeholder={"posts:read\nposts:write\nusers:*"} />
          </div>
          <button type="submit" className="btn btn-primary">Create</button>
        </form>
      </Modal>
    </div>
  )
}
