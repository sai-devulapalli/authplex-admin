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
  Settings?: {
    session_ttl?: number
    access_token_ttl?: number
    refresh_token_ttl?: number
    password_min_length?: number
    password_require_uppercase?: boolean
    password_require_number?: boolean
    password_require_special?: boolean
    max_login_attempts?: number
    lockout_duration?: number
    allowed_origins?: string[]
    smtp_host?: string
    smtp_port?: number
    smtp_username?: string
    smtp_password?: string
    smtp_from?: string
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
  is_agent?: boolean
  description?: string
  allowed_endpoints?: string[]
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
  id: string
  email: string
  name: string
  phone?: string
  email_verified: boolean
  enabled: boolean
  created_at: string
}

export interface AuditEvent {
  ID: string
  TenantID: string
  ActorID: string
  ActorType: string
  Action: string
  ResourceType: string
  ResourceID: string
  IPAddress: string
  UserAgent: string
  Details: Record<string, unknown> | null
  Timestamp: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  offset: number
  limit: number
}

export interface Webhook {
  ID: string
  TenantID: string
  URL: string
  Secret: string
  Events: string[]
  Enabled: boolean
  CreatedAt: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}
