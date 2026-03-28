import { useState, useCallback } from 'react'
import { postQuery } from '../api/query'
import type { ChatMessage, QueryResponse } from '../types'

const EMPTY_ERROR_RESPONSE: QueryResponse = {
  success: false,
  sql: null,
  chart_type: null,
  plotly_figure: null,
  table_data: null,
  row_count: 0,
  summary: null,
  warning: null,
  error: 'Could not connect to the server.',
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID())

  const sendQuestion = useCallback(async (question: string) => {
    if (!question.trim() || isLoading) return

    setIsLoading(true)

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      question: question.trim(),
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      const response = await postQuery({ question: question.trim() })
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        response,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        response: {
          ...EMPTY_ERROR_RESPONSE,
          error: err instanceof Error ? err.message : 'Could not connect to the server.',
        },
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  // Update an existing assistant message in-place — used by forceExecute
  const updateMessage = useCallback((messageId: string, response: QueryResponse) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, response } : msg)),
    )
  }, [])

  // Re-execute a question that was blocked by a slow query warning.
  // Updates the warning card in-place rather than adding a new message pair.
  const forceExecute = useCallback(async (messageId: string, question: string) => {
    if (isLoading) return

    // Show running state inside the existing card
    updateMessage(messageId, {
      success: true,
      sql: null,
      chart_type: 'running',
      plotly_figure: null,
      table_data: null,
      row_count: 0,
      summary: null,
      warning: null,
      error: null,
    })

    setIsLoading(true)
    try {
      const response = await postQuery({ question, force_execute: true })
      updateMessage(messageId, response)
    } catch (err) {
      updateMessage(messageId, {
        ...EMPTY_ERROR_RESPONSE,
        error: err instanceof Error ? err.message : 'Query failed.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, updateMessage])

  const clearMessages = useCallback(() => {
    setMessages([])
    setSessionId(crypto.randomUUID())
  }, [])

  const loadMessages = useCallback((msgs: ChatMessage[], id: string) => {
    setMessages(msgs)
    setSessionId(id)
  }, [])

  return { messages, isLoading, sessionId, sendQuestion, forceExecute, clearMessages, loadMessages }
}
