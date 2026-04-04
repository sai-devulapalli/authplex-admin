import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { AuthPlexClient } from '../api/client'

interface AuthContextType {
  client: AuthPlexClient | null
  isAuthenticated: boolean
  login: (apiUrl: string, apiKey: string) => void
  logout: () => void
  apiUrl: string
}

const AuthContext = createContext<AuthContextType>({
  client: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  apiUrl: '',
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<AuthPlexClient | null>(() => {
    const key = sessionStorage.getItem('authplex_api_key')
    const url = sessionStorage.getItem('authplex_api_url') || ''
    if (key) return new AuthPlexClient(url, key)
    return null
  })

  const login = useCallback((apiUrl: string, apiKey: string) => {
    sessionStorage.setItem('authplex_api_key', apiKey)
    sessionStorage.setItem('authplex_api_url', apiUrl)
    setClient(new AuthPlexClient(apiUrl, apiKey))
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('authplex_api_key')
    sessionStorage.removeItem('authplex_api_url')
    setClient(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      client,
      isAuthenticated: client !== null,
      login,
      logout,
      apiUrl: sessionStorage.getItem('authplex_api_url') || '',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
