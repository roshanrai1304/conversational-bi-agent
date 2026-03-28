import { useState, useEffect } from 'react'
import { getHealth } from '../api/query'

export function Header() {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    async function check() {
      const ok = await getHealth()
      setConnected(ok)
    }
    check()
    const interval = setInterval(check, 15000) // re-check every 15s
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 h-12 z-10 bg-card border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-user-bubble flex items-center justify-center text-white text-sm font-bold">
          B
        </div>
        <span className="text-base font-bold text-primary">BI Agent</span>
      </div>

      <span className="text-sm font-medium text-primary">Instacart Analytics</span>

      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-status-green' : 'bg-red-500'}`} />
        <span className="text-xs text-secondary uppercase tracking-wide">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </header>
  )
}
