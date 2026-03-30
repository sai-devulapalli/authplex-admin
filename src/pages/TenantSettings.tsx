import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'

interface TenantSettingsProps {
  tenantId: string
}

export default function TenantSettings({ tenantId }: TenantSettingsProps) {
  const { client } = useAuth()

  // MFA policy
  const [mfaRequired, setMfaRequired] = useState('none')
  const [mfaMethods, setMfaMethods] = useState<string[]>([])

  // Token & session
  const [sessionTTL, setSessionTTL] = useState(86400)
  const [accessTokenTTL, setAccessTokenTTL] = useState(3600)
  const [refreshTokenTTL, setRefreshTokenTTL] = useState(2592000)

  // Password policy
  const [passwordMinLength, setPasswordMinLength] = useState(8)
  const [passwordRequireUppercase, setPasswordRequireUppercase] = useState(false)
  const [passwordRequireNumber, setPasswordRequireNumber] = useState(false)
  const [passwordRequireSpecial, setPasswordRequireSpecial] = useState(false)

  // Security
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(0)
  const [lockoutDuration, setLockoutDuration] = useState(0)
  const [allowedOrigins, setAllowedOrigins] = useState('')

  // SMTP
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState(587)
  const [smtpUsername, setSmtpUsername] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [smtpFrom, setSmtpFrom] = useState('')

  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!client) return
    setLoading(true)
    client
      .getTenant(tenantId)
      .then((tenant) => {
        // MFA
        if (tenant.MFA) {
          setMfaRequired(tenant.MFA.required || 'none')
          setMfaMethods(tenant.MFA.methods || [])
        }
        // Settings
        const s = tenant.Settings
        if (s) {
          setSessionTTL(s.session_ttl ?? 86400)
          setAccessTokenTTL(s.access_token_ttl ?? 3600)
          setRefreshTokenTTL(s.refresh_token_ttl ?? 2592000)
          setPasswordMinLength(s.password_min_length ?? 8)
          setPasswordRequireUppercase(s.password_require_uppercase ?? false)
          setPasswordRequireNumber(s.password_require_number ?? false)
          setPasswordRequireSpecial(s.password_require_special ?? false)
          setMaxLoginAttempts(s.max_login_attempts ?? 0)
          setLockoutDuration(s.lockout_duration ?? 0)
          setAllowedOrigins((s.allowed_origins || []).join('\n'))
          setSmtpHost(s.smtp_host ?? '')
          setSmtpPort(s.smtp_port ?? 587)
          setSmtpUsername(s.smtp_username ?? '')
          setSmtpPassword(s.smtp_password ?? '')
          setSmtpFrom(s.smtp_from ?? '')
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load tenant settings')
      })
      .finally(() => setLoading(false))
  }, [client, tenantId])

  const toggleMethod = (method: string) => {
    setMfaMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    )
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!client) return

    setSaving(true)
    setSuccess('')
    setError('')

    const origins = allowedOrigins
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    try {
      await client.updateTenant(tenantId, {
        mfa: {
          required: mfaRequired,
          methods: mfaMethods,
        },
        settings: {
          session_ttl: sessionTTL,
          access_token_ttl: accessTokenTTL,
          refresh_token_ttl: refreshTokenTTL,
          password_min_length: passwordMinLength,
          password_require_uppercase: passwordRequireUppercase,
          password_require_number: passwordRequireNumber,
          password_require_special: passwordRequireSpecial,
          max_login_attempts: maxLoginAttempts,
          lockout_duration: lockoutDuration,
          allowed_origins: origins,
          smtp_host: smtpHost,
          smtp_port: smtpPort,
          smtp_username: smtpUsername,
          smtp_password: smtpPassword,
          smtp_from: smtpFrom,
        },
      })
      setSuccess('Settings saved successfully.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">Loading settings...</div>

  return (
    <form onSubmit={handleSave}>
      {success && <div className="success-msg">{success}</div>}
      {error && <div className="error-msg">{error}</div>}

      {/* MFA Policy */}
      <div className="settings-section">
        <h3>MFA Policy</h3>
        <div className="form-group">
          <label>MFA Required</label>
          <select value={mfaRequired} onChange={(e) => setMfaRequired(e.target.value)}>
            <option value="none">None</option>
            <option value="optional">Optional</option>
            <option value="required">Required</option>
          </select>
        </div>
        <div className="form-group">
          <label>Methods</label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={mfaMethods.includes('totp')}
                onChange={() => toggleMethod('totp')}
              />
              TOTP
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={mfaMethods.includes('webauthn')}
                onChange={() => toggleMethod('webauthn')}
              />
              WebAuthn
            </label>
          </div>
        </div>
      </div>

      {/* Token & Session */}
      <div className="settings-section">
        <h3>Token &amp; Session</h3>
        <div className="form-group">
          <label>Session TTL (seconds)</label>
          <input
            type="number"
            min={0}
            value={sessionTTL}
            onChange={(e) => setSessionTTL(Number(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Access Token TTL (seconds)</label>
          <input
            type="number"
            min={0}
            value={accessTokenTTL}
            onChange={(e) => setAccessTokenTTL(Number(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Refresh Token TTL (seconds)</label>
          <input
            type="number"
            min={0}
            value={refreshTokenTTL}
            onChange={(e) => setRefreshTokenTTL(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Password Policy */}
      <div className="settings-section">
        <h3>Password Policy</h3>
        <div className="form-group">
          <label>Minimum Length</label>
          <input
            type="number"
            min={1}
            value={passwordMinLength}
            onChange={(e) => setPasswordMinLength(Number(e.target.value))}
          />
        </div>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={passwordRequireUppercase}
              onChange={(e) => setPasswordRequireUppercase(e.target.checked)}
            />
            Require uppercase
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={passwordRequireNumber}
              onChange={(e) => setPasswordRequireNumber(e.target.checked)}
            />
            Require number
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={passwordRequireSpecial}
              onChange={(e) => setPasswordRequireSpecial(e.target.checked)}
            />
            Require special character
          </label>
        </div>
      </div>

      {/* Security */}
      <div className="settings-section">
        <h3>Security</h3>
        <div className="form-group">
          <label>Max Login Attempts (0 = unlimited)</label>
          <input
            type="number"
            min={0}
            value={maxLoginAttempts}
            onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Lockout Duration (seconds)</label>
          <input
            type="number"
            min={0}
            value={lockoutDuration}
            onChange={(e) => setLockoutDuration(Number(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Allowed CORS Origins (one per line)</label>
          <textarea
            rows={4}
            value={allowedOrigins}
            onChange={(e) => setAllowedOrigins(e.target.value)}
            placeholder={"https://example.com\nhttps://app.example.com"}
          />
        </div>
      </div>

      {/* Email (SMTP) */}
      <div className="settings-section">
        <h3>Email (SMTP)</h3>
        <p className="hint">Per-tenant SMTP override. Leave empty to use global config.</p>
        <div className="form-group">
          <label>SMTP Host</label>
          <input
            type="text"
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.target.value)}
            placeholder="smtp.example.com"
          />
        </div>
        <div className="form-group">
          <label>SMTP Port</label>
          <input
            type="number"
            min={0}
            value={smtpPort}
            onChange={(e) => setSmtpPort(Number(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>SMTP Username</label>
          <input
            type="text"
            value={smtpUsername}
            onChange={(e) => setSmtpUsername(e.target.value)}
            placeholder="user@example.com"
          />
        </div>
        <div className="form-group">
          <label>SMTP Password</label>
          <input
            type="password"
            value={smtpPassword}
            onChange={(e) => setSmtpPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>From Address</label>
          <input
            type="text"
            value={smtpFrom}
            onChange={(e) => setSmtpFrom(e.target.value)}
            placeholder="noreply@example.com"
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
}
