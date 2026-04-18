/* eslint-disable react-refresh/only-export-components -- provider + hook pattern */
import { GoogleOAuthProvider } from '@react-oauth/google'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import axios from 'axios'
import { api, getToken, setToken } from '../api/client'
import { GOOGLE_CLIENT_ID, isGoogleClientConfigured } from '../config/oauth'
import type { User } from '../types'

const AuthCtx = createContext<{
  user: User | null
  loading: boolean
  /** Resolves with ok if /me succeeded; on failure clears token and may include detail for UI. */
  refresh: () => Promise<{ ok: boolean; detail?: string }>
  logout: () => void
} | null>(null)

function AuthInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async (): Promise<{ ok: boolean; detail?: string }> => {
    const t = getToken()
    if (!t) {
      setUser(null)
      setLoading(false)
      return { ok: false }
    }
    try {
      const { data } = await api.get<User>('/api/v1/me')
      setUser(data)
      setLoading(false)
      return { ok: true }
    } catch (e) {
      setToken(null)
      setUser(null)
      setLoading(false)
      let detail: string | undefined
      if (axios.isAxiosError(e)) {
        if (e.code === 'ERR_NETWORK' || !e.response) {
          detail =
            'API වෙත connect වුණේ නැහැ. Spring Boot http://localhost:9094 එකේ run වෙනවාද? (Vite proxy /api → 9094)'
        } else {
          const body = e.response.data as { message?: string } | undefined
          const msg = typeof body?.message === 'string' ? body.message : undefined
          const st = e.response.status
          if (st === 401) {
            detail =
              msg ??
              'Session expired or token invalid. Sign in again (email/password or Google). For Google, ensure the same Web client ID is used on frontend and backend.'
          } else if (st === 500 || st === 503) {
            detail = msg ?? 'Server error — MySQL run වෙනවාද? spring.datasource.* (user/password/DB name) නිවැරදිද?'
          } else if (msg) {
            detail = msg
          }
        }
      }
      return { ok: false, detail }
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      logout,
    }),
    [user, loading, refresh, logout],
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (isGoogleClientConfigured()) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthInner>{children}</AuthInner>
      </GoogleOAuthProvider>
    )
  }
  return <AuthInner>{children}</AuthInner>
}

export function useAuth() {
  const v = useContext(AuthCtx)
  if (!v) throw new Error('AuthProvider missing')
  return v
}
