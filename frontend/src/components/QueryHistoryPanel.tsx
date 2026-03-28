import type { Session } from '../types/session'
import { SessionCard } from './SessionCard'

interface QueryHistoryPanelProps {
  sessions: Session[]
  onLoad: (id: string) => void
  onDelete: (id: string) => void
  onClearAll: () => void
}

function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
      <span className="text-5xl opacity-40">◷</span>
      <p className="text-base font-semibold text-primary">No history yet</p>
      <p className="text-sm text-secondary max-w-xs">
        Your past analyses will appear here. Start a new analysis to get going.
      </p>
    </div>
  )
}

export function QueryHistoryPanel({ sessions, onLoad, onDelete, onClearAll }: QueryHistoryPanelProps) {
  if (sessions.length === 0) {
    return <EmptyHistory />
  }

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-primary">Query History</h2>
          <p className="text-xs text-secondary mt-0.5">{sessions.length} saved session{sessions.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onClearAll}
          className="text-xs text-secondary border border-border rounded-lg px-3 py-1.5 hover:text-error-red hover:border-error-red transition"
        >
          Clear All
        </button>
      </div>

      {/* Session list */}
      <div className="flex flex-col gap-3">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onLoad={onLoad}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
