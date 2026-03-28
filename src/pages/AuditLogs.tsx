import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import DataTable from '../components/DataTable'
import type { AuditEvent } from '../types'

export default function AuditLogs({ tenantId }: { tenantId: string }) {
  const { client } = useAuth()
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ action: '', actor_id: '', resource_type: '' })
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const limit = 25

  useEffect(() => { loadEvents() }, [client, tenantId, offset, filters])

  async function loadEvents() {
    if (!client) return
    setLoading(true)
    try {
      const res = await client.queryAudit(tenantId, { ...filters, limit, offset })
      setEvents(res.events || [])
      setTotal(res.count || 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  function handleFilter() {
    setOffset(0)
    loadEvents()
  }

  const columns = [
    {
      key: 'timestamp', header: 'Time',
      render: (e: AuditEvent) => new Date(e.timestamp).toLocaleString(),
    },
    { key: 'action', header: 'Action', render: (e: AuditEvent) => <span className="badge">{e.action}</span> },
    { key: 'actor_id', header: 'Actor' },
    { key: 'actor_type', header: 'Actor Type' },
    { key: 'resource_type', header: 'Resource' },
    { key: 'resource_id', header: 'Resource ID' },
    { key: 'ip_address', header: 'IP' },
  ]

  return (
    <div>
      <div className="section-header">
        <h2>Audit Logs</h2>
      </div>

      <div className="filter-bar">
        <input
          placeholder="Action (e.g. login_success)"
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
        />
        <input
          placeholder="Actor ID"
          value={filters.actor_id}
          onChange={(e) => setFilters({ ...filters, actor_id: e.target.value })}
        />
        <select
          value={filters.resource_type}
          onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })}
        >
          <option value="">All resources</option>
          <option value="user">User</option>
          <option value="client">Client</option>
          <option value="tenant">Tenant</option>
          <option value="role">Role</option>
          <option value="session">Session</option>
          <option value="token">Token</option>
        </select>
        <button className="btn btn-sm" onClick={handleFilter}>Filter</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading ? (
        <div className="loading">Loading audit logs...</div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={events}
            emptyMessage="No audit events found."
          />

          {total > limit && (
            <div className="pagination">
              <button
                className="btn btn-sm"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                Previous
              </button>
              <span>
                {offset + 1}–{Math.min(offset + limit, total)} of {total}
              </span>
              <button
                className="btn btn-sm"
                disabled={offset + limit >= total}
                onClick={() => setOffset(offset + limit)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
