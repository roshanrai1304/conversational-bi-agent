const SAMPLE_QUESTIONS = [
  'Top 10 most ordered products',
  'Reorder rate by department',
  'Orders by hour of day',
  'Average days between orders',
]

interface EmptyStateProps {
  onQuestion: (q: string) => void
}

export function EmptyState({ onQuestion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
      {/* Icon */}
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-secondary opacity-60">
        <rect x="3" y="12" width="4" height="9" rx="1" fill="currentColor" />
        <rect x="10" y="7" width="4" height="14" rx="1" fill="currentColor" />
        <rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor" />
      </svg>

      {/* Heading */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Ask anything about your data</h1>
        <p className="text-sm text-secondary mt-2 max-w-sm">
          Try asking about orders, products, departments, or trends from the Instacart production cluster.
        </p>
      </div>

      {/* Sample question cards */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
        {SAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onQuestion(q)}
            className="bg-card border border-border rounded-xl px-4 py-4 text-sm text-primary text-left cursor-pointer hover:bg-card-alt transition"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
