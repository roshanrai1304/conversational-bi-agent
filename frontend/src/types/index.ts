export interface QueryRequest {
  question: string
  force_execute?: boolean
}

export interface PlotlyFigure {
  data: object[]
  layout: object
}

export interface QueryWarning {
  message: string
  suggestions: string[]
}

export interface QueryResponse {
  success: boolean
  sql: string | null
  chart_type: 'bar' | 'line' | 'pie' | 'table' | 'metric' | 'unavailable' | 'warning' | 'running' | null
  plotly_figure: PlotlyFigure | null
  table_data: Record<string, unknown>[] | null
  row_count: number
  summary: string | null
  warning: QueryWarning | null
  error: string | null
}

export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  question?: string
  response?: QueryResponse
  timestamp: number
}
