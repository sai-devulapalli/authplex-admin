export interface Tenant {
  ID: string
  Domain: string
  Issuer: string
  SigningConfig: {
    Algorithm: string
    ActiveKeyID: string
  }
  MFA: {
    required: string
    methods: string[]
  }
  CreatedAt: string
  UpdatedAt: string
  DeletedAt: string | null
}

export interface Client {
  client_id: string
  client_secret?: string
  client_name: string
  client_type: 'public' | 'confidential'
  redirect_uris: string[]
  allowed_scopes: string[]
  grant_types: string[]
}

export interface Provider {
  id: string
  provider_type: 'google' | 'github' | 'microsoft' | 'apple' | 'oidc' | 'oauth2'
  client_id: string
  scopes: string[]
  discovery_url: string
  auth_url: string
  token_url: string
  userinfo_url: string
  enabled: boolean
  extra_config: Record<string, string>
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
}

export interface User {
  ID: string
  TenantID: string
  Email: string
  Phone: string
  Name: string
  EmailVerified: boolean
  PhoneVerified: boolean
  Enabled: boolean
  CreatedAt: string
}

export interface AuditEvent {
  id: string
  tenant_id: string
  actor_id: string
  actor_type: string
  action: string
  resource_type: string
  resource_id: string
  ip_address: string
  user_agent: string
  details: Record<string, unknown>
  timestamp: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  offset: number
  limit: number
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}
