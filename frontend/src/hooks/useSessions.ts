import { useState, useCallback } from 'react'
import type { Session } from '../types/session'
import type { ChatMessage } from '../types'

const STORAGE_KEY = 'bi_agent_sessions'
const MAX_SESSIONS = 20

function stripPlotlyFigures(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((msg) => {
    if (msg.role === 'assistant' && msg.response?.plotly_figure) {
      return {
        ...msg,
        response: {
          ...msg.response,
          // Keep data (x/y values, trace type) — small, ~2–8KB per chart
          // Drop layout — large (~50–200KB), rebuilt from DARK_LAYOUT on render
          plotly_figure: {
            data: msg.response.plotly_figure.data,
            layout: {},
          },
        },
      }
    }
    return msg
  })
}

function readFromStorage(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session[]) : []
  } catch {
    return []
  }
}

function writeToStorage(sessions: Session[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch {
    console.warn('localStorage quota exceeded — trimming oldest session')
    try {
      const trimmed = [...sessions].sort((a, b) => b.updated_at - a.updated_at).slice(0, MAX_SESSIONS - 1)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch {
      // silent fail — history just won't save this time
    }
  }
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(readFromStorage)

  const saveSession = useCallback((id: string, messages: ChatMessage[]) => {
    if (messages.length === 0) return

    const stripped = stripPlotlyFigures(messages)
    const firstQuestion = messages.find((m) => m.role === 'user')?.question ?? 'Untitled'
    const title = firstQuestion.length > 50 ? firstQuestion.slice(0, 47) + '...' : firstQuestion
    const now = Date.now()

    setSessions((prev) => {
      const exists = prev.find((s) => s.id === id)
      let updated: Session[]

      if (exists) {
        updated = prev.map((s) =>
          s.id === id
            ? { ...s, updated_at: now, message_count: messages.length, messages: stripped }
            : s,
        )
      } else {
        const newSession: Session = {
          id,
          title,
          created_at: now,
          updated_at: now,
          message_count: messages.length,
          messages: stripped,
        }
        updated = [newSession, ...prev]
      }

      // Enforce max — keep most recently updated
      if (updated.length > MAX_SESSIONS) {
        updated = [...updated].sort((a, b) => b.updated_at - a.updated_at).slice(0, MAX_SESSIONS)
      }

      writeToStorage(updated)
      return updated
    })
  }, [])

  const loadSession = useCallback(
    (id: string): ChatMessage[] | null => {
      return sessions.find((s) => s.id === id)?.messages ?? null
    },
    [sessions],
  )

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id)
      writeToStorage(updated)
      return updated
    })
  }, [])

  const clearAll = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    setSessions([])
  }, [])

  return { sessions, saveSession, loadSession, deleteSession, clearAll }
}
