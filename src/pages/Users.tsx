import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { User } from '../types'

export default function Users({ tenantId }: { tenantId: string }) {
  const { client } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
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
  }, [client, tenantId])

  return (
    <div>
      <div className="section-header">
        <h2>Users ({total})</h2>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
