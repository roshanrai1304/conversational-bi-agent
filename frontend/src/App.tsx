import { useRef, useEffect, useState, useCallback } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { ChatInput } from './components/ChatInput'
import { ChatMessage } from './components/ChatMessage'
import { ResultCard } from './components/ResultCard'
import { EmptyState } from './components/EmptyState'
import { Footer } from './components/Footer'
import { QueryHistoryPanel } from './components/QueryHistoryPanel'
import { useChat } from './hooks/useChat'
import { useSessions } from './hooks/useSessions'
import type { ChatMessage as ChatMessageType } from './types'

type ActiveView = 'chat' | 'history'

function LoadingSkeleton() {
  return (
    <div className="bg-card rounded-xl p-5 w-full animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded bg-card-alt" />
        <div className="h-4 w-40 rounded bg-card-alt" />
      </div>
      <div className="h-56 rounded bg-card-alt" />
      <div className="mt-4 pt-3 border-t border-border">
        <div className="h-3 w-16 rounded bg-card-alt" />
      </div>
    </div>
  )
}

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('chat')
  const { messages, isLoading, sessionId, sendQuestion, forceExecute, clearMessages, loadMessages } = useChat()
  const { sessions, saveSession, loadSession, deleteSession, clearAll } = useSessions()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-save session whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveSession(sessionId, messages)
    }
  }, [messages, sessionId, saveSession])

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleNewAnalysis = useCallback(() => {
    clearMessages()
    setActiveView('chat')
  }, [clearMessages])

  const handleNavChange = useCallback((view: string) => {
    if (view === 'chat') setActiveView('chat')
    else if (view === 'history') setActiveView('history')
  }, [])

  const handleLoadSession = useCallback((id: string) => {
    const msgs = loadSession(id) as ChatMessageType[] | null
    if (msgs) {
      loadMessages(msgs, id)
      setActiveView('chat')
    }
  }, [loadSession, loadMessages])

  const isEmpty = messages.length === 0 && !isLoading
  const inputPlaceholder = isEmpty ? 'Type your data question here...' : 'Ask a question about the data...'

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-app">
      <Header />

      <div className="flex flex-1 overflow-hidden pt-12 pb-16">
        <Sidebar
          activeView={activeView}
          onNewAnalysis={handleNewAnalysis}
          onNavChange={handleNavChange}
          sessionCount={sessions.length}
        />

        <main className="ml-48 flex-1 overflow-y-auto bg-app">
          {activeView === 'history' ? (
            <QueryHistoryPanel
              sessions={sessions}
              onLoad={handleLoadSession}
              onDelete={deleteSession}
              onClearAll={clearAll}
            />
          ) : isEmpty ? (
            <EmptyState onQuestion={sendQuestion} />
          ) : (
            <div className="flex flex-col gap-5 px-6 py-6 max-w-4xl mx-auto">
              {messages.map((msg, index) =>
                msg.role === 'user' ? (
                  <ChatMessage key={msg.id} message={msg} />
                ) : (
                  <ResultCard
                    key={msg.id}
                    message={msg}
                    originalQuestion={messages[index - 1]?.question ?? ''}
                    onForceExecute={forceExecute}
                    onSuggestion={sendQuestion}
                  />
                ),
              )}

              {isLoading && <LoadingSkeleton />}

              <Footer />
              <div ref={bottomRef} />
            </div>
          )}
        </main>
      </div>

      <ChatInput
        onSend={sendQuestion}
        isLoading={isLoading}
        placeholder={inputPlaceholder}
      />
    </div>
  )
}
