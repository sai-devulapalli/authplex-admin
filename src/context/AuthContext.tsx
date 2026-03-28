import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { AuthCoreClient } from '../api/client'

interface AuthContextType {
  client: AuthCoreClient | null
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
  const [client, setClient] = useState<AuthCoreClient | null>(() => {
    const key = sessionStorage.getItem('authcore_api_key')
    const url = sessionStorage.getItem('authcore_api_url') || ''
    if (key) return new AuthCoreClient(url, key)
    return null
  })

  const login = useCallback((apiUrl: string, apiKey: string) => {
    sessionStorage.setItem('authcore_api_key', apiKey)
    sessionStorage.setItem('authcore_api_url', apiUrl)
    setClient(new AuthCoreClient(apiUrl, apiKey))
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('authcore_api_key')
    sessionStorage.removeItem('authcore_api_url')
    setClient(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      client,
      isAuthenticated: client !== null,
      login,
      logout,
      apiUrl: sessionStorage.getItem('authcore_api_url') || '',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
