import type { Tenant, Client, Provider, Role, AuditEvent, User, Webhook, ApiError } from '../types'

export class AuthCoreClient {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.apiKey = apiKey
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
    })

    if (res.status === 204) {
      return undefined as T
    }

    const body = await res.json()

    if (body.error) {
      const err = body.error as ApiError
      throw new Error(err.message || err.code || 'Unknown error')
    }

    return body.data as T
  }

  // Tenants
  async listTenants(offset = 0, limit = 50): Promise<{ tenants: Tenant[]; total: number }> {
    return this.request(`/tenants?offset=${offset}&limit=${limit}`)
  }

  async getTenant(id: string): Promise<Tenant> {
    return this.request(`/tenants/${id}`)
  }

  async createTenant(data: { id: string; domain: string; issuer: string; algorithm: string }): Promise<Tenant> {
    return this.request('/tenants', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateTenant(id: string, data: Record<string, unknown>): Promise<Tenant> {
    return this.request(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  }

  async deleteTenant(id: string): Promise<void> {
    return this.request(`/tenants/${id}`, { method: 'DELETE' })
  }

  // Clients
  async listClients(tenantId: string, offset = 0, limit = 50): Promise<{ clients: Client[]; total: number }> {
    return this.request(`/tenants/${tenantId}/clients?offset=${offset}&limit=${limit}`)
  }

  async createClient(tenantId: string, data: {
    client_name: string
    client_type: string
    redirect_uris: string[]
    allowed_scopes: string[]
    grant_types: string[]
    is_agent?: boolean
    description?: string
    allowed_endpoints?: string[]
  }): Promise<Client> {
    return this.request(`/tenants/${tenantId}/clients`, { method: 'POST', body: JSON.stringify(data) })
  }

  async updateClient(tenantId: string, clientId: string, data: Partial<{
    client_name: string
    redirect_uris: string[]
    allowed_scopes: string[]
  }>): Promise<Client> {
    return this.request(`/tenants/${tenantId}/clients/${clientId}`, { method: 'PUT', body: JSON.stringify(data) })
  }

  async deleteClient(tenantId: string, clientId: string): Promise<void> {
    return this.request(`/tenants/${tenantId}/clients/${clientId}`, { method: 'DELETE' })
  }

  async generateAPIKey(tenantId: string, clientId: string): Promise<{ api_key: string }> {
    return this.request(`/tenants/${tenantId}/clients/${clientId}/api-key`, { method: 'POST' })
  }

  // Providers
  async listProviders(tenantId: string): Promise<Provider[]> {
    return this.request(`/tenants/${tenantId}/providers`)
  }

  async createProvider(tenantId: string, data: {
    provider_type: string
    client_id: string
    client_secret: string
    scopes?: string[]
    discovery_url?: string
    auth_url?: string
    token_url?: string
    userinfo_url?: string
    extra_config?: Record<string, string>
  }): Promise<Provider> {
    return this.request(`/tenants/${tenantId}/providers`, { method: 'POST', body: JSON.stringify(data) })
  }

  async deleteProvider(tenantId: string, providerId: string): Promise<void> {
    return this.request(`/tenants/${tenantId}/providers/${providerId}`, { method: 'DELETE' })
  }

  // Roles
  async listRoles(tenantId: string): Promise<Role[]> {
    return this.request(`/tenants/${tenantId}/roles`)
  }

  async createRole(tenantId: string, data: {
    name: string
    description?: string
    permissions?: string[]
  }): Promise<Role> {
    return this.request(`/tenants/${tenantId}/roles`, { method: 'POST', body: JSON.stringify(data) })
  }

  async updateRole(tenantId: string, roleId: string, data: Partial<{
    description: string
    permissions: string[]
  }>): Promise<Role> {
    return this.request(`/tenants/${tenantId}/roles/${roleId}`, { method: 'PUT', body: JSON.stringify(data) })
  }

  async deleteRole(tenantId: string, roleId: string): Promise<void> {
    return this.request(`/tenants/${tenantId}/roles/${roleId}`, { method: 'DELETE' })
  }

  // User Roles
  async getUserRoles(tenantId: string, userId: string): Promise<Role[]> {
    return this.request(`/tenants/${tenantId}/users/${userId}/roles`)
  }

  async assignRole(tenantId: string, userId: string, roleId: string): Promise<void> {
    return this.request(`/tenants/${tenantId}/users/${userId}/roles/${roleId}`, { method: 'POST' })
  }

  async removeRole(tenantId: string, userId: string, roleId: string): Promise<void> {
    return this.request(`/tenants/${tenantId}/users/${userId}/roles/${roleId}`, { method: 'DELETE' })
  }

  // Users
  async listUsers(_tenantId: string, _offset = 0, _limit = 50): Promise<{ users: User[]; total: number }> {
    // AuthCore doesn't have a list users endpoint yet (GET /tenants/{tid}/users).
    // This is a UI placeholder ready for the backend.
    return { users: [], total: 0 }
  }

  // Audit
  async queryAudit(tenantId: string, params: {
    action?: string
    actor_id?: string
    resource_type?: string
    limit?: number
    offset?: number
  } = {}): Promise<{ events: AuditEvent[]; count: number }> {
    const qs = new URLSearchParams()
    if (params.action) qs.set('action', params.action)
    if (params.actor_id) qs.set('actor_id', params.actor_id)
    if (params.resource_type) qs.set('resource_type', params.resource_type)
    qs.set('limit', String(params.limit ?? 50))
    qs.set('offset', String(params.offset ?? 0))
    return this.request(`/tenants/${tenantId}/audit?${qs}`)
  }

  // Webhooks
  async listWebhooks(tenantId: string): Promise<{ webhooks: Webhook[]; count: number }> {
    return this.request(`/tenants/${tenantId}/webhooks`)
  }

  async createWebhook(tenantId: string, data: { url: string; events: string[] }): Promise<Webhook> {
    return this.request(`/tenants/${tenantId}/webhooks`, { method: 'POST', body: JSON.stringify(data) })
  }

  async deleteWebhook(tenantId: string, webhookId: string): Promise<void> {
    return this.request(`/tenants/${tenantId}/webhooks/${webhookId}`, { method: 'DELETE' })
  }

  // Health
  async health(): Promise<{ status: string }> {
    const res = await fetch(`${this.baseUrl}/health`)
    return res.json()
  }
}
