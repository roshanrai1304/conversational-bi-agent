interface SlowQueryWarningProps {
  message: string
  suggestions: string[]
  messageId: string
  question: string
  onRunAnyway: (messageId: string, question: string) => void
  onSuggestion: (question: string) => void
}

export function SlowQueryWarning({
  message,
  suggestions,
  messageId,
  question,
  onRunAnyway,
  onSuggestion,
}: SlowQueryWarningProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Warning header */}
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">⚠️</span>
        <div>
          <p className="text-sm font-semibold text-primary">Query Performance Warning</p>
          <p className="text-sm text-secondary mt-1 leading-relaxed">{message}</p>
        </div>
      </div>

      {/* Faster alternatives */}
      <div className="bg-app rounded-lg px-4 py-3 border border-border">
        <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-3">
          Try a faster alternative instead
        </p>
        <div className="flex flex-col gap-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestion(s)}
              className="text-left text-sm text-primary bg-card-alt hover:bg-nav-active rounded-lg px-3 py-2.5 transition cursor-pointer border border-border hover:border-user-bubble"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Run anyway */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-secondary">
          Original question: <span className="italic">"{question}"</span>
        </p>
        <button
          onClick={() => onRunAnyway(messageId, question)}
          className="text-xs text-secondary border border-border rounded-lg px-3 py-1.5 hover:text-primary hover:border-secondary transition flex-shrink-0 ml-4"
        >
          Run anyway →
        </button>
      </div>
    </div>
  )
}
