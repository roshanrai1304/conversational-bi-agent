import { useState } from 'react'
import { getSchema } from '../api/query'

interface ErrorCardProps {
  error: string
  sql: string | null
}

export function ErrorCard({ error, sql }: ErrorCardProps) {
  const [schema, setSchema] = useState<string | null>(null)
  const [loadingSchema, setLoadingSchema] = useState(false)

  async function handleViewSchema() {
    if (schema) { setSchema(null); return }
    setLoadingSchema(true)
    try {
      const s = await getSchema()
      setSchema(s)
    } finally {
      setLoadingSchema(false)
    }
  }

  const isSchemaError = error.toLowerCase().includes('not found') ||
    error.toLowerCase().includes('column') ||
    error.toLowerCase().includes('table')

  return (
    <div className="flex flex-col gap-3">
      {/* Robot avatar + error card */}
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5 flex-shrink-0">🤖</span>

        <div className="flex-1 bg-error-bg border border-error-border rounded-xl px-4 py-4">
          <div className="flex items-start gap-2">
            <span className="text-error-red text-lg leading-none mt-0.5">●</span>
            <div>
              <p className="text-sm font-semibold text-primary leading-snug">
                {isSchemaError ? error.split('\n')[0] : 'Query failed'}
              </p>
              {error.split('\n').length > 1 && (
                <p className="text-xs text-secondary mt-1">{error.split('\n').slice(1).join(' ')}</p>
              )}
              {error.split('\n').length === 1 && (
                <p className="text-xs text-secondary mt-1">{error}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hint */}
      <p className="text-xs text-secondary flex items-center gap-1.5 pl-9">
        <span className="text-secondary">ℹ</span>
        Try rephrasing your question or check the schema.
      </p>

      {/* Action buttons */}
      <div className="flex gap-2 pl-9">
        <button
          onClick={handleViewSchema}
          disabled={loadingSchema}
          className="text-xs border border-border rounded-lg px-3 py-1.5 text-secondary hover:text-primary hover:border-secondary transition disabled:opacity-50"
        >
          {loadingSchema ? 'Loading...' : schema ? 'Hide Schema' : 'View Schema'}
        </button>
        {sql && (
          <button
            onClick={() => navigator.clipboard.writeText(sql)}
            className="text-xs border border-border rounded-lg px-3 py-1.5 text-secondary hover:text-primary hover:border-secondary transition"
          >
            Copy SQL
          </button>
        )}
      </div>

      {/* Schema panel */}
      {schema && (
        <pre className="mt-3 ml-9 bg-app rounded-lg p-3 text-xs font-mono text-blue-300 whitespace-pre-wrap overflow-x-auto leading-relaxed">
          {schema}
        </pre>
      )}
    </div>
  )
}
