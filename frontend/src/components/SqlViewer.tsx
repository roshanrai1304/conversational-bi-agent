import { useState } from 'react'

interface SqlViewerProps {
  sql: string
}

export function SqlViewer({ sql }: SqlViewerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-4 pt-3 border-t border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-secondary hover:text-primary transition cursor-pointer"
      >
        <span className="text-[10px]">{open ? '▾' : '▸'}</span>
        VIEW SQL
      </button>

      {open && (
        <pre className="mt-2 bg-app rounded-lg p-3 text-xs font-mono text-blue-300 whitespace-pre-wrap overflow-x-auto leading-relaxed">
          {sql}
        </pre>
      )}
    </div>
  )
}
