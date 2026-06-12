import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/auth'

export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
})

api.interceptors.request.use((config) => {
  const { access } = useAuthStore.getState()
  if (access) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const { refresh, setTokens, logout } = useAuthStore.getState()
  if (!refresh) return null
  try {
    const { data } = await axios.post<{ access: string; refresh?: string }>(
      `${API_BASE}/api/v1/auth/token/refresh/`,
      { refresh },
    )
    setTokens(data.access, data.refresh ?? refresh)
    return data.access
  } catch {
    logout()
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean }
    const isAuthRoute = original?.url?.includes('/auth/')
    if (error.response?.status === 401 && original && !original._retried && !isAuthRoute) {
      original._retried = true
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const access = await refreshPromise
      if (access) {
        original.headers.Authorization = `Bearer ${access}`
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)

/** Fetch a cursor-paginated page either by absolute `next` URL or a relative path. */
export async function fetchPage<T>(url: string): Promise<T> {
  const { data } = await api.get<T>(url)
  return data
}

/** Extract a human-readable message from a DRF error response. */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Record<string, unknown>
    if (typeof data.detail === 'string') return data.detail
    for (const value of Object.values(data)) {
      if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
      if (typeof value === 'string') return value
    }
  }
  return fallback
}
