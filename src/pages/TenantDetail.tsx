import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Tenant } from '../types'
import Clients from './Clients'
import Providers from './Providers'
import Roles from './Roles'
import AuditLogs from './AuditLogs'
import Users from './Users'
import TenantSettings from './TenantSettings'

type Tab = 'users' | 'clients' | 'providers' | 'roles' | 'audit' | 'settings'

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>()
  const { client } = useAuth()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('users')
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
          <h1>{tenant.ID}</h1>
          <div className="tenant-meta">
            <span>{tenant.Domain}</span>
            <span className="badge">{tenant.SigningConfig?.Algorithm}</span>
            {tenant.MFA?.required !== 'none' && tenant.MFA?.required && (
              <span className="badge badge-info">MFA: {tenant.MFA.required}</span>
            )}
          </div>
        </div>
      </div>

      <div className="tabs">
        {(['users', 'clients', 'providers', 'roles', 'audit', 'settings'] as Tab[]).map((tab) => (
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
        {activeTab === 'users' && <Users tenantId={tenant.ID} />}
        {activeTab === 'clients' && <Clients tenantId={tenant.ID} />}
        {activeTab === 'providers' && <Providers tenantId={tenant.ID} />}
        {activeTab === 'roles' && <Roles tenantId={tenant.ID} />}
        {activeTab === 'audit' && <AuditLogs tenantId={tenant.ID} />}
        {activeTab === 'settings' && <TenantSettings tenantId={tenant.ID} />}
      </div>
    </div>
  )
}
