import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import type { Tenant } from '../types'

export default function Tenants() {
  const { client } = useAuth()
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ id: '', domain: '', issuer: '', algorithm: 'RS256' })
  const [error, setError] = useState('')
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const limit = 20

  useEffect(() => { loadTenants() }, [client, offset])

  async function loadTenants() {
    if (!client) return
    setLoading(true)
    try {
      const res = await client.listTenants(offset, limit)
      setTenants(res.tenants || [])
      setTotal(res.total || 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!client) return
    setError('')
    try {
      await client.createTenant(form)
      setShowCreate(false)
      setForm({ id: '', domain: '', issuer: '', algorithm: 'RS256' })
      await loadTenants()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create tenant')
    }
  }

  async function handleDelete(id: string) {
    if (!client || !confirm(`Delete tenant "${id}"?`)) return
    try {
      await client.deleteTenant(id)
      await loadTenants()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete tenant')
    }
  }

  const columns = [
    { key: 'ID', header: 'ID' },
    { key: 'Domain', header: 'Domain' },
    { key: 'Issuer', header: 'Issuer' },
    {
      key: 'Algorithm',
      header: 'Algorithm',
      render: (t: Tenant) => t.SigningConfig?.Algorithm || '-',
    },
    {
      key: 'CreatedAt',
      header: 'Created',
      render: (t: Tenant) => new Date(t.CreatedAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: '',
      render: (t: Tenant) => (
        <button
          className="btn btn-sm btn-danger"
          onClick={(e) => { e.stopPropagation(); handleDelete(t.ID) }}
        >
          Delete
        </button>
      ),
    },
  ]

  if (loading) return <div className="loading">Loading tenants...</div>

  return (
    <div>
      <div className="page-header">
        <h1>Tenants</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          Create Tenant
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <DataTable
        columns={columns}
        data={tenants}
        onRowClick={(t) => navigate(`/tenants/${t.ID}`)}
        emptyMessage="No tenants yet. Create one to get started."
        total={total}
        offset={offset}
        limit={limit}
        onPageChange={setOffset}
      />

      <Modal title="Create Tenant" isOpen={showCreate} onClose={() => setShowCreate(false)}>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Tenant ID</label>
            <input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Domain</label>
            <input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Issuer URL</label>
            <input value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Algorithm</label>
            <select value={form.algorithm} onChange={(e) => setForm({ ...form, algorithm: e.target.value })}>
              <option value="RS256">RS256</option>
              <option value="ES256">ES256</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Create</button>
        </form>
      </Modal>
    </div>
  )
}
