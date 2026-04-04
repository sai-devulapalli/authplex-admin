import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type LoginMode = 'apikey' | 'admin'

export default function Login() {
  const [apiUrl, setApiUrl] = useState('http://localhost:9090')
  const [apiKey, setApiKey] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<LoginMode>('apikey')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const baseUrl = apiUrl.replace(/\/$/, '')

    try {
      if (mode === 'apikey') {
        const res = await fetch(`${baseUrl}/health`)
        if (!res.ok) throw new Error('Cannot reach server')

        login(apiUrl, apiKey)
        navigate('/')
      } else {
        const res = await fetch(`${baseUrl}/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => null)
          const msg = body?.error?.message || body?.message || 'Login failed'
          throw new Error(msg)
        }

        const body = await res.json()
        const token = body.data?.token
        if (!token) throw new Error('No token returned from server')

        login(apiUrl, token)
        navigate('/')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>AuthPlex Admin</h1>
        <p>
          {mode === 'apikey'
            ? 'Enter your server URL and API key to connect.'
            : 'Sign in with your admin email and password.'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="apiUrl">Server URL</label>
            <input
              id="apiUrl"
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8080"
              required
            />
          </div>

          {mode === 'apikey' ? (
            <div className="form-group">
              <label htmlFor="apiKey">API Key</label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your admin API key"
                required
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </>
          )}

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Connecting...' : mode === 'apikey' ? 'Connect' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            className="btn-link"
            onClick={() => { setMode(mode === 'apikey' ? 'admin' : 'apikey'); setError('') }}
          >
            {mode === 'apikey' ? 'Switch to Admin Login' : 'Switch to API Key'}
          </button>
        </div>
      </div>
    </div>
  )
}
