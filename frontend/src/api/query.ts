import type { QueryRequest, QueryResponse } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function postQuery(request: QueryRequest): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json() as Promise<QueryResponse>
}

export async function getHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, { method: 'GET' })
    return response.ok
  } catch {
    return false
  }
}

export async function getSchema(): Promise<string> {
  const response = await fetch(`${API_BASE}/api/schema`, { method: 'GET' })
  if (!response.ok) throw new Error('Failed to fetch schema')
  const data = await response.json() as { schema: string }
  return data.schema
}
