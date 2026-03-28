import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import type { Provider } from '../types'

const PROVIDER_TYPES = ['google', 'github', 'microsoft', 'apple', 'oidc', 'oauth2']

export default function Providers({ tenantId }: { tenantId: string }) {
  const { client } = useAuth()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    provider_type: 'google',
    client_id: '',
    client_secret: '',
    scopes: 'openid profile email',
    discovery_url: '',
  })

  useEffect(() => { loadProviders() }, [client, tenantId])

  async function loadProviders() {
    if (!client) return
    setLoading(true)
    try {
      const res = await client.listProviders(tenantId)
      setProviders(Array.isArray(res) ? res : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load providers')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!client) return
    setError('')
    try {
      await client.createProvider(tenantId, {
        provider_type: form.provider_type,
        client_id: form.client_id,
        client_secret: form.client_secret,
        scopes: form.scopes.split(' ').filter(Boolean),
        discovery_url: form.discovery_url || undefined,
      })
      setShowCreate(false)
      setForm({ provider_type: 'google', client_id: '', client_secret: '', scopes: 'openid profile email', discovery_url: '' })
      await loadProviders()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create provider')
    }
  }

  async function handleDelete(providerId: string) {
    if (!client || !confirm(`Delete provider "${providerId}"?`)) return
    try {
      await client.deleteProvider(tenantId, providerId)
      await loadProviders()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete provider')
    }
  }

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'provider_type', header: 'Type', render: (p: Provider) => <span className="badge">{p.provider_type}</span> },
    { key: 'client_id', header: 'Client ID' },
    { key: 'enabled', header: 'Status', render: (p: Provider) => p.enabled ? 'Enabled' : 'Disabled' },
    {
      key: 'actions', header: '',
      render: (p: Provider) => (
        <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }}>
          Delete
        </button>
      ),
    },
  ]

  if (loading) return <div className="loading">Loading providers...</div>

  return (
    <div>
      <div className="section-header">
        <h2>Identity Providers</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>Add Provider</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <DataTable columns={columns} data={providers} emptyMessage="No identity providers configured." />

      <Modal title="Add Identity Provider" isOpen={showCreate} onClose={() => setShowCreate(false)}>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Provider Type</label>
            <select value={form.provider_type} onChange={(e) => setForm({ ...form, provider_type: e.target.value })}>
              {PROVIDER_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Client ID</label>
            <input value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Client Secret</label>
            <input type="password" value={form.client_secret} onChange={(e) => setForm({ ...form, client_secret: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Scopes (space-separated)</label>
            <input value={form.scopes} onChange={(e) => setForm({ ...form, scopes: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Discovery URL (optional for known providers)</label>
            <input value={form.discovery_url} onChange={(e) => setForm({ ...form, discovery_url: e.target.value })} placeholder="https://accounts.google.com/.well-known/openid-configuration" />
          </div>
          <button type="submit" className="btn btn-primary">Create</button>
        </form>
      </Modal>
    </div>
  )
}
