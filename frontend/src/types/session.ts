import type { ChatMessage } from './index'

export interface Session {
  id: string
  title: string
  created_at: number
  updated_at: number
  message_count: number
  messages: ChatMessage[]
}
