import Plot from 'react-plotly.js'
import type { Data, Layout } from 'plotly.js'
import type { PlotlyFigure } from '../types'

interface ChartRendererProps {
  figure: PlotlyFigure
  chartType: string
  tableData: Record<string, unknown>[] | null
}

// Shared dark theme base — no height constraint
const DARK_BASE: Partial<Layout> = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: { color: '#f0f4f8', family: 'Inter' },
  title: { text: '' },
  autosize: true,
  legend: { font: { color: '#f0f4f8' } },
  xaxis: { gridcolor: '#1e2d40', color: '#8892a4' },
  yaxis: { gridcolor: '#1e2d40', color: '#8892a4' },
}

// Fixed 320px height for bar / line / pie charts
const CHART_LAYOUT: Partial<Layout> = {
  ...DARK_BASE,
  margin: { t: 10, b: 48, l: 48, r: 24 },
  height: 320,
}


function MetricCard({ tableData }: { figure: PlotlyFigure; tableData: Record<string, unknown>[] | null }) {
  const row = tableData?.[0]
  if (!row) return null
  const [[key, value]] = Object.entries(row)

  // Safety net: if the value is a string containing 'unavailable' it slipped
  // through backend detection — render as an info message, not giant bold text
  if (typeof value === 'string' && value.toLowerCase().includes('unavailable')) {
    const message = value.replace(/^UNAVAILABLE:\s*/i, '').trim()
    return (
      <div className="flex items-start gap-3 py-2">
        <span className="text-2xl flex-shrink-0">🔍</span>
        <div>
          <p className="text-sm font-semibold text-primary">Data Not Available</p>
          <p className="text-sm text-secondary mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
    )
  }

  const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const formatted = typeof value === 'number' ? value.toLocaleString() : String(value)

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <span className="text-4xl font-bold text-primary">{formatted}</span>
      <span className="text-sm text-secondary">{label}</span>
    </div>
  )
}

function TableFallback({ data }: { data: Record<string, unknown>[] }) {
  const cols = Object.keys(data[0] ?? {})
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs text-primary">
        <thead>
          <tr className="bg-card-alt border-b border-border">
            {cols.map((c) => (
              <th key={c} className="text-left px-3 py-2 font-semibold text-secondary uppercase tracking-wide">
                {c.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-app' : 'bg-card'}>
              {cols.map((c) => (
                <td key={c} className="px-3 py-2">
                  {String(row[c] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ChartRenderer({ figure, chartType, tableData }: ChartRendererProps) {
  // figure.data is always saved; figure.layout is stripped (rebuilt from DARK_LAYOUT)
  // Only fall back to table if figure is completely absent
  if (!figure) {
    if (tableData && tableData.length > 0) return <TableFallback data={tableData} />
    return null
  }

  if (chartType === 'metric') {
    return <MetricCard figure={figure} tableData={tableData} />
  }

  // Tables — always use HTML table, never Plotly.
  // Plotly tables have a large internal minimum height regardless of row count.
  // HTML table sizes naturally to its content.
  if (chartType === 'table') {
    if (tableData && tableData.length > 0) return <TableFallback data={tableData} />
    return null
  }

  // Bar / line / pie — fixed 320px so charts don't collapse or overflow
  // Merge xaxis/yaxis separately to preserve figure's axis type (e.g. type:'category')
  // while still applying our dark theme colours.
  // Spreading CHART_LAYOUT directly would replace the entire xaxis object and
  // remove type:'category', causing categorical bar charts to show a blank numeric axis.
  const figureLayout = figure.layout as Partial<Layout> & {
    xaxis?: Partial<Layout['xaxis']>
    yaxis?: Partial<Layout['yaxis']>
  }
  const layout: Partial<Layout> = {
    ...figureLayout,
    ...CHART_LAYOUT,
    xaxis: { ...figureLayout.xaxis, gridcolor: '#1e2d40', color: '#8892a4' },
    yaxis: { ...figureLayout.yaxis, gridcolor: '#1e2d40', color: '#8892a4' },
  }
  return (
    <div style={{ width: '100%', height: '320px' }}>
      <Plot
        data={figure.data as Data[]}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        useResizeHandler
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
