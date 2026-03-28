import { useState, useRef, useEffect } from 'react'

interface ChatInputProps {
  onSend: (question: string) => void
  isLoading: boolean
  placeholder?: string
  initialValue?: string
}

export function ChatInput({ onSend, isLoading, placeholder, initialValue = '' }: ChatInputProps) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue)
      inputRef.current?.focus()
    }
  }, [initialValue])

  function handleSubmit() {
    if (!value.trim() || isLoading) return
    onSend(value.trim())
    setValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const inputPlaceholder = placeholder ?? (isLoading ? 'Thinking...' : 'Ask a question about the data...')

  return (
    <div className="fixed bottom-0 left-48 right-0 h-16 bg-card border-t border-border flex items-center gap-3 px-4 z-10">
      {/* Mic icon */}
      <button className="text-secondary hover:text-primary transition flex-shrink-0" title="Voice input">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
        </svg>
      </button>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={inputPlaceholder}
        disabled={isLoading}
        className="flex-1 bg-app border border-border-input rounded-xl px-4 py-2 text-sm text-primary placeholder:text-secondary outline-none focus:border-user-bubble transition disabled:opacity-50"
      />

      {/* Attachment icon */}
      <button className="text-secondary hover:text-primary transition flex-shrink-0" title="Attach file">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15.172 7l-6.586 6.586a2 2 0 1 0 2.828 2.828l6.414-6.586a4 4 0 0 0-5.656-5.656l-6.415 6.585a6 6 0 1 0 8.486 8.486L20.5 13" />
        </svg>
      </button>

      {/* Send button */}
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || isLoading}
        className="w-10 h-10 rounded-full bg-send-btn hover:opacity-90 flex items-center justify-center flex-shrink-0 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
