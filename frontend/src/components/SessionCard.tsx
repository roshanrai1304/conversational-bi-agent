import type { Session } from '../types/session'

interface SessionCardProps {
  session: Session
  onLoad: (id: string) => void
  onDelete: (id: string) => void
}

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function SessionCard({ session, onLoad, onDelete }: SessionCardProps) {
  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    onDelete(session.id)
  }

  return (
    <div
      onClick={() => onLoad(session.id)}
      className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-4 cursor-pointer hover:bg-card-alt transition group"
    >
      <div className="flex items-start gap-3 min-w-0">
        <span className="text-secondary text-base mt-0.5 flex-shrink-0">📋</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary truncate">{session.title}</p>
          <p className="text-xs text-secondary mt-0.5">
            {session.message_count} messages · {relativeTime(session.updated_at)}
          </p>
        </div>
      </div>

      <button
        onClick={handleDelete}
        title="Delete session"
        className="flex-shrink-0 ml-3 text-secondary opacity-0 group-hover:opacity-100 hover:text-error-red transition"
      >
        🗑
      </button>
    </div>
  )
}
