import type { ChatMessage as ChatMessageType } from '../types'

interface ChatMessageProps {
  message: ChatMessageType
}

function formatTimestamp(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 10) return 'Just now'
  if (diff < 60) return `${diff} seconds ago`
  if (diff < 120) return '1 minute ago'
  const mins = Math.floor(diff / 60)
  if (mins < 60) return `${mins} minutes ago`
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="bg-user-bubble text-white text-sm rounded-2xl rounded-br-sm px-4 py-3 max-w-[65%]">
        {message.question}
      </div>
      <span className="text-xs text-secondary pr-1">{formatTimestamp(message.timestamp)}</span>
    </div>
  )
}
