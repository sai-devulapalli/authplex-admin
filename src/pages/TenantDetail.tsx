import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Tenant } from '../types'
import Clients from './Clients'
import Providers from './Providers'
import Roles from './Roles'
import AuditLogs from './AuditLogs'

type Tab = 'clients' | 'providers' | 'roles' | 'audit'

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>()
  const { client } = useAuth()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('clients')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!client || !id) return
    client.getTenant(id).then(setTenant).catch((e) => {
      setError(e instanceof Error ? e.message : 'Tenant not found')
    })
  }, [client, id])

  if (error) {
    return (
      <div>
        <div className="error-msg">{error}</div>
        <button className="btn" onClick={() => navigate('/tenants')}>Back to Tenants</button>
      </div>
    )
  }

  if (!tenant) return <div className="loading">Loading tenant...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn-link" onClick={() => navigate('/tenants')}>&larr; Tenants</button>
          <h1>{tenant.id}</h1>
          <div className="tenant-meta">
            <span>{tenant.domain}</span>
            <span className="badge">{tenant.signing_config?.algorithm}</span>
            {tenant.mfa?.required !== 'none' && (
              <span className="badge badge-info">MFA: {tenant.mfa.required}</span>
            )}
          </div>
        </div>
      </div>

      <div className="tabs">
        {(['clients', 'providers', 'roles', 'audit'] as Tab[]).map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'clients' && <Clients tenantId={tenant.id} />}
        {activeTab === 'providers' && <Providers tenantId={tenant.id} />}
        {activeTab === 'roles' && <Roles tenantId={tenant.id} />}
        {activeTab === 'audit' && <AuditLogs tenantId={tenant.id} />}
      </div>
    </div>
  )
}
