import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import type { Client } from '../types'

const GRANT_TYPE_OPTIONS = [
  'authorization_code',
  'client_credentials',
  'refresh_token',
  'urn:ietf:params:oauth:grant-type:device_code',
  'password',
]

export default function Clients({ tenantId }: { tenantId: string }) {
  const { client } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createdSecret, setCreatedSecret] = useState('')
  const [error, setError] = useState('')
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const limit = 20
  const [generatedApiKey, setGeneratedApiKey] = useState('')
  const [form, setForm] = useState({
    client_name: '',
    client_type: 'confidential',
    redirect_uris: '',
    allowed_scopes: 'openid profile email',
    grant_types: ['authorization_code', 'refresh_token'] as string[],
    is_agent: false,
    description: '',
    allowed_endpoints: '',
  })

  useEffect(() => { loadClients() }, [client, tenantId, offset])

  async function loadClients() {
    if (!client) return
    setLoading(true)
    try {
      const res = await client.listClients(tenantId, offset, limit)
      setClients(res.clients || [])
      setTotal(res.total || 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!client) return
    setError('')
    try {
      const payload: Parameters<typeof client.createClient>[1] = {
        client_name: form.client_name,
        client_type: form.client_type,
        redirect_uris: form.redirect_uris.split('\n').map((s) => s.trim()).filter(Boolean),
        allowed_scopes: form.allowed_scopes.split(' ').filter(Boolean),
        grant_types: form.grant_types,
      }
      if (form.is_agent) {
        payload.is_agent = true
        if (form.description) payload.description = form.description
        const endpoints = form.allowed_endpoints.split('\n').map((s) => s.trim()).filter(Boolean)
        if (endpoints.length > 0) payload.allowed_endpoints = endpoints
      }
      const result = await client.createClient(tenantId, payload)
      if (result.client_secret) {
        setCreatedSecret(result.client_secret)
      }
      setShowCreate(false)
      setForm({ client_name: '', client_type: 'confidential', redirect_uris: '', allowed_scopes: 'openid profile email', grant_types: ['authorization_code', 'refresh_token'], is_agent: false, description: '', allowed_endpoints: '' })
      await loadClients()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create client')
    }
  }

  async function handleDelete(clientId: string) {
    if (!client || !confirm(`Delete client "${clientId}"?`)) return
    try {
      await client.deleteClient(tenantId, clientId)
      await loadClients()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete client')
    }
  }

  function toggleGrant(grant: string) {
    setForm((prev) => ({
      ...prev,
      grant_types: prev.grant_types.includes(grant)
        ? prev.grant_types.filter((g) => g !== grant)
        : [...prev.grant_types, grant],
    }))
  }

  function toggleAgent(checked: boolean) {
    setForm((prev) => ({
      ...prev,
      is_agent: checked,
      ...(checked
        ? { client_type: 'confidential', grant_types: ['client_credentials'] }
        : { grant_types: ['authorization_code', 'refresh_token'] }),
    }))
  }

  async function handleGenerateApiKey(clientId: string) {
    if (!client) return
    try {
      const res = await client.generateAPIKey(tenantId, clientId)
      setGeneratedApiKey(res.api_key)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate API key')
    }
  }

  const columns = [
    { key: 'client_id', header: 'Client ID' },
    { key: 'client_name', header: 'Name' },
    {
      key: 'type', header: 'Type',
      render: (c: Client) => c.is_agent
        ? <span className="badge" style={{ background: '#7c3aed', color: '#fff' }}>Agent</span>
        : <span className="badge">App</span>,
    },
    { key: 'client_type', header: 'Client Type', render: (c: Client) => <span className="badge">{c.client_type}</span> },
    { key: 'grant_types', header: 'Grant Types', render: (c: Client) => c.grant_types?.join(', ') || '-' },
    {
      key: 'actions', header: '',
      render: (c: Client) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handleGenerateApiKey(c.client_id) }}>
            Generate API Key
          </button>
          <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(c.client_id) }}>
            Delete
          </button>
        </div>
      ),
    },
  ]

  if (loading) return <div className="loading">Loading clients...</div>

  return (
    <div>
      <div className="section-header">
        <h2>OAuth Clients</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>Create Client</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {createdSecret && (
        <div className="alert alert-warning">
          <strong>Client Secret (save now — shown only once):</strong>
          <code>{createdSecret}</code>
          <button className="btn btn-sm" onClick={() => setCreatedSecret('')}>Dismiss</button>
        </div>
      )}

      {generatedApiKey && (
        <div className="alert alert-warning">
          <strong>API Key (save this key — it's shown only once):</strong>
          <code>{generatedApiKey}</code>
          <button className="btn btn-sm" onClick={() => { navigator.clipboard.writeText(generatedApiKey) }}>Copy</button>
          <button className="btn btn-sm" onClick={() => setGeneratedApiKey('')}>Dismiss</button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={clients}
        emptyMessage="No clients configured."
        total={total}
        offset={offset}
        limit={limit}
        onPageChange={setOffset}
      />

      <Modal title="Create OAuth Client" isOpen={showCreate} onClose={() => setShowCreate(false)}>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Client Name</label>
            <input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={form.is_agent} onChange={(e) => toggleAgent(e.target.checked)} />
              This is an AI agent / service account
            </label>
          </div>
          {form.is_agent && (
            <div className="form-group">
              <label>Description (what this agent does)</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Automated billing reconciliation agent" />
            </div>
          )}
          <div className="form-group">
            <label>Client Type</label>
            <select value={form.client_type} onChange={(e) => setForm({ ...form, client_type: e.target.value })} disabled={form.is_agent}>
              <option value="confidential">Confidential (server-side)</option>
              <option value="public">Public (SPA/mobile)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Redirect URIs (one per line)</label>
            <textarea value={form.redirect_uris} onChange={(e) => setForm({ ...form, redirect_uris: e.target.value })} rows={3} placeholder="https://app.example.com/callback" />
          </div>
          <div className="form-group">
            <label>Allowed Scopes (space-separated)</label>
            <input value={form.allowed_scopes} onChange={(e) => setForm({ ...form, allowed_scopes: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Grant Types</label>
            <div className="checkbox-group">
              {GRANT_TYPE_OPTIONS.map((grant) => (
                <label key={grant} className="checkbox-label">
                  <input type="checkbox" checked={form.grant_types.includes(grant)} onChange={() => toggleGrant(grant)} />
                  {grant}
                </label>
              ))}
            </div>
          </div>
          {form.is_agent && (
            <div className="form-group">
              <label>Allowed Endpoints (one per line)</label>
              <textarea value={form.allowed_endpoints} onChange={(e) => setForm({ ...form, allowed_endpoints: e.target.value })} rows={3} placeholder={"/api/billing\n/api/reports"} />
            </div>
          )}
          <button type="submit" className="btn btn-primary">Create</button>
        </form>
      </Modal>
    </div>
  )
}
