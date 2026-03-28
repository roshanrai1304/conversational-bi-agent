import type { ChatMessage } from '../types'
import { ChartRenderer } from './ChartRenderer'
import { SqlViewer } from './SqlViewer'
import { ErrorCard } from './ErrorCard'
import { UnavailableCard } from './UnavailableCard'
import { SlowQueryWarning } from './SlowQueryWarning'

const CHART_ICONS: Record<string, string> = {
  bar: '📊',
  line: '📈',
  pie: '🥧',
  table: '📋',
  metric: '🔢',
  unavailable: '🔍',
  warning: '⚠️',
}

function inferTitle(_chartType: string | null, tableData: Record<string, unknown>[] | null): string {
  if (!tableData || tableData.length === 0) return 'Result'
  const keys = Object.keys(tableData[0])
  if (keys.length === 1 && keys[0].toLowerCase() === 'explanation') return 'Result'
  return keys.map((k) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())).join(' vs ')
}

interface ResultCardProps {
  message: ChatMessage
  originalQuestion?: string
  onForceExecute?: (messageId: string, question: string) => void
  onSuggestion?: (question: string) => void
}

export function ResultCard({ message, originalQuestion = '', onForceExecute, onSuggestion }: ResultCardProps) {
  const { response } = message
  if (!response) return null

  if (!response.success) {
    return (
      <div className="w-full">
        <ErrorCard error={response.error ?? 'Unknown error'} sql={response.sql} />
      </div>
    )
  }

  // Method 6: slow query warning — show alternatives and Run Anyway option
  if (response.chart_type === 'warning' && response.warning) {
    return (
      <div className="bg-card rounded-xl p-5 w-full overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">⚠️</span>
          <span className="text-sm font-semibold text-primary">Performance Warning</span>
        </div>
        <SlowQueryWarning
          message={response.warning.message}
          suggestions={response.warning.suggestions}
          messageId={message.id}
          question={originalQuestion}
          onRunAnyway={onForceExecute ?? (() => {})}
          onSuggestion={onSuggestion ?? (() => {})}
        />
        {response.sql && <SqlViewer sql={response.sql} />}
      </div>
    )
  }

  // Running state — shown while forceExecute is in progress for this card
  if (response.chart_type === 'running') {
    return (
      <div className="bg-card rounded-xl p-5 w-full overflow-hidden animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-5 rounded bg-card-alt" />
          <div className="h-4 w-56 rounded bg-card-alt" />
        </div>
        <div className="h-48 rounded bg-card-alt" />
        <p className="text-xs text-secondary mt-3">Running full query — this may take a few minutes...</p>
      </div>
    )
  }

  // Method 4: graceful unavailability response
  if (response.chart_type === 'unavailable') {
    return (
      <div className="bg-card rounded-xl p-5 w-full overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">🔍</span>
          <span className="text-sm font-semibold text-primary">Data Not Available</span>
        </div>
        <UnavailableCard message={response.summary ?? 'This data is not available in the dataset.'} />
      </div>
    )
  }

  const icon = CHART_ICONS[response.chart_type ?? 'table'] ?? '📊'
  const title = inferTitle(response.chart_type, response.table_data)

  return (
    <div className="bg-card rounded-xl p-5 w-full overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-semibold text-primary">{title}</span>
      </div>

      {/* Chart */}
      {response.plotly_figure && (
        <ChartRenderer
          figure={response.plotly_figure}
          chartType={response.chart_type ?? 'table'}
          tableData={response.table_data}
        />
      )}

      {/* Summary — below chart, above VIEW SQL */}
      {response.summary && (
        <p className="text-sm italic text-secondary mt-3 leading-relaxed">
          {response.summary}
        </p>
      )}

      {/* SQL viewer — always at bottom */}
      {response.sql && <SqlViewer sql={response.sql} />}
    </div>
  )
}
