import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { Webhook } from '../types'

interface WebhooksProps {
  tenantId: string
}

const EVENT_TYPES = [
  'login_success',
  'login_failure',
  'register',
  'password_reset',
  'token_revoked',
  'mfa_enrolled',
  'mfa_verified',
  'session_revoked',
  'tenant_updated',
  'client_created',
  'client_deleted',
  'role_assigned',
  'role_revoked',
]

export default function Webhooks({ tenantId }: WebhooksProps) {
  const { client } = useAuth()
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  // Newly created webhook (to show secret)
  const [newWebhook, setNewWebhook] = useState<Webhook | null>(null)
  const [copied, setCopied] = useState(false)

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadWebhooks = () => {
    if (!client) return
    setLoading(true)
    client
      .listWebhooks(tenantId)
      .then((res) => setWebhooks(res.webhooks || []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load webhooks'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadWebhooks()
  }, [client, tenantId])

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  const handleCreate = async () => {
    if (!client || !url) return
    setCreating(true)
    setError('')
    try {
      const wh = await client.createWebhook(tenantId, { url, events: selectedEvents })
      setNewWebhook(wh)
      setUrl('')
      setSelectedEvents([])
      setShowCreate(false)
      loadWebhooks()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create webhook')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!client) return
    setError('')
    try {
      await client.deleteWebhook(tenantId, id)
      setDeleteId(null)
      loadWebhooks()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete webhook')
    }
  }

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="loading">Loading webhooks...</div>

  return (
    <div>
      {error && <div className="error-msg">{error}</div>}

      {newWebhook && (
        <div className="success-msg" style={{ marginBottom: '1rem' }}>
          <strong>Webhook created!</strong> Copy the signing secret now -- it won't be shown again.
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <code style={{ background: '#f5f5f5', padding: '0.25rem 0.5rem', borderRadius: '4px', wordBreak: 'break-all' }}>
              {newWebhook.Secret}
            </code>
            <button className="btn btn-sm" onClick={() => copySecret(newWebhook.Secret)}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button className="btn-link" style={{ marginTop: '0.5rem' }} onClick={() => setNewWebhook(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Webhooks ({webhooks.length})</h3>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'Add Webhook'}
        </button>
      </div>

      {showCreate && (
        <div className="settings-section" style={{ marginBottom: '1rem' }}>
          <div className="form-group">
            <label>Endpoint URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhook"
            />
          </div>
          <div className="form-group">
            <label>Events</label>
            <div className="checkbox-group">
              {EVENT_TYPES.map((event) => (
                <label key={event} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event)}
                    onChange={() => toggleEvent(event)}
                  />
                  {event}
                </label>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !url}>
            {creating ? 'Creating...' : 'Create Webhook'}
          </button>
        </div>
      )}

      {webhooks.length === 0 && !showCreate ? (
        <p>No webhooks configured for this tenant.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>URL</th>
              <th>Events</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {webhooks.map((wh) => (
              <tr key={wh.ID}>
                <td style={{ wordBreak: 'break-all', maxWidth: '300px' }}>{wh.URL}</td>
                <td>
                  {(wh.Events || []).map((e) => (
                    <span key={e} className="badge" style={{ marginRight: '0.25rem', marginBottom: '0.25rem' }}>
                      {e}
                    </span>
                  ))}
                </td>
                <td>
                  <span className={`badge ${wh.Enabled ? 'badge-info' : ''}`}>
                    {wh.Enabled ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td>{new Date(wh.CreatedAt).toLocaleDateString()}</td>
                <td>
                  {deleteId === wh.ID ? (
                    <span>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(wh.ID)}>
                        Confirm
                      </button>{' '}
                      <button className="btn btn-sm" onClick={() => setDeleteId(null)}>
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(wh.ID)}>
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
  )
}
