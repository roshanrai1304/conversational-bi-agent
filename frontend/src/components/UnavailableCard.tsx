interface UnavailableCardProps {
  message: string
}

export function UnavailableCard({ message }: UnavailableCardProps) {
  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Icon + title row */}
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🔍</span>
        <div>
          <p className="text-sm font-semibold text-primary">Data Not Available</p>
          <p className="text-sm text-secondary mt-1 leading-relaxed">{message}</p>
        </div>
      </div>

      {/* What IS available hint */}
      <div className="bg-app rounded-lg px-4 py-3 border border-border">
        <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
          What this dataset can answer
        </p>
        <ul className="text-xs text-secondary space-y-1">
          <li>• Order counts, frequency, and timing</li>
          <li>• Reorder rates by product, aisle, or department</li>
          <li>• Basket size and cart position analysis</li>
          <li>• Product popularity and category trends</li>
        </ul>
      </div>
    </div>
  )
}
