import { ApiError, ShortenRequest, ShortenResponse, UrlItem } from '../types'

/**
 * Gets the API base URL based on environment.
 * 
 * In development: Uses Vite dev proxy (/api -> http://localhost:8080)
 * In production: Uses VITE_API_BASE_URL env var if set, otherwise uses /api (nginx proxy)
 */
function getApiBaseUrl(): string {
  // Check if we're in development mode (Vite sets MODE to 'development' in dev)
  // Type assertion needed because TypeScript doesn't always recognize Vite's env types
  const env = (import.meta as any).env as { MODE: string; VITE_API_BASE_URL?: string }
  const isDev = env.MODE === 'development'
  
  if (isDev) {
    // Use Vite dev proxy (configured in vite.config.ts)
    // Requests to /api/* are proxied to http://localhost:8080/*
    return '/api'
  }
  
  // Production: Use VITE_API_BASE_URL if set, otherwise use /api (nginx will proxy to backend)
  const base = env.VITE_API_BASE_URL || '/api'
  return base
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${path}`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    ...init
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const data = await response.json()
      if (typeof data?.message === 'string') {
        message = data.message
      }
    } catch {
      // ignore body parse errors
    }

    if (response.status === 400) {
      throw new ApiError(message || 'Invalid input', 400)
    }
    if (response.status === 404) {
      throw new ApiError(message || 'Not found', 404)
    }
    throw new ApiError(message, response.status)
  }

  // Some endpoints return no content (204)
  if (response.status === 204) {
    return undefined as unknown as T
  }

  // Attempt to parse JSON; if empty, return as unknown
  const text = await response.text()
  if (!text) return undefined as unknown as T
  return JSON.parse(text) as T
}

export async function shortenUrl(params: ShortenRequest): Promise<ShortenResponse> {
  return request<ShortenResponse>('/shorten', {
    method: 'POST',
    body: JSON.stringify(params)
  })
}

export async function listUrls(): Promise<UrlItem[]> {
  return request<UrlItem[]>('/urls', { method: 'GET' })
}

export async function deleteAlias(alias: string): Promise<void> {
  await request<void>(`/${encodeURIComponent(alias)}`, { method: 'DELETE' })
}


