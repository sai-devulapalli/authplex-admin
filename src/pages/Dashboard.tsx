import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { client, apiUrl } = useAuth()
  const navigate = useNavigate()
  const [tenantCount, setTenantCount] = useState(0)
  const [serverStatus, setServerStatus] = useState('checking...')

  useEffect(() => {
    if (!client) return

    client.listTenants(0, 1).then((res) => {
      setTenantCount(res.total)
    }).catch(() => {
      setTenantCount(0)
    })

    client.health().then((res) => {
      setServerStatus(res.status === 'up' || res.status === 'UP' ? 'Healthy' : res.status)
    }).catch(() => {
      setServerStatus('Unreachable')
    })
  }, [client])

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/tenants')}>
          <div className="stat-value">{tenantCount}</div>
          <div className="stat-label">Tenants</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{serverStatus}</div>
          <div className="stat-label">Server Status</div>
        </div>
        <div className="stat-card">
          <div className="stat-value truncate">{apiUrl || 'localhost'}</div>
          <div className="stat-label">Server URL</div>
        </div>
      </div>

      <div className="section">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <button className="btn" onClick={() => navigate('/tenants')}>
            Manage Tenants
          </button>
        </div>
      </div>
    </div>
  )
}
