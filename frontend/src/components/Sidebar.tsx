const NAV_ITEMS = [
  { id: 'chat', label: 'Dashboard', icon: '▦' },
  { id: 'history', label: 'Query History', icon: '◷' },
  { id: 'reports', label: 'Saved Reports', icon: '▤' },
  { id: 'datasets', label: 'Datasets', icon: '◫' },
]

const BOTTOM_ITEMS = [
  { id: 'settings', label: 'Settings', icon: '⚙' },
  { id: 'docs', label: 'Documentation', icon: '▦' },
]

interface SidebarProps {
  activeView: string
  onNewAnalysis: () => void
  onNavChange: (view: string) => void
  sessionCount: number
}

export function Sidebar({ activeView, onNewAnalysis, onNavChange, sessionCount }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-12 bottom-16 w-48 bg-sidebar border-r border-border flex flex-col z-10">
      {/* Version */}
      <p className="text-xs text-secondary px-3 pt-3 pb-2 tracking-wide">V1.2.0-STABLE</p>

      {/* New Analysis */}
      <div className="px-3 mb-4">
        <button
          onClick={onNewAnalysis}
          className="w-full flex items-center justify-center gap-2 bg-user-bubble hover:opacity-90 text-white text-sm font-medium rounded-lg py-2 transition"
        >
          <span className="text-base leading-none">+</span>
          New Analysis
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 px-2 flex-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavChange(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition ${
              activeView === item.id
                ? 'bg-nav-active text-white'
                : 'text-secondary hover:bg-card-alt hover:text-primary'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{item.icon}</span>
              <span className="text-xs font-semibold uppercase tracking-wide">{item.label}</span>
            </div>
            {item.id === 'history' && sessionCount > 0 && (
              <span className="text-xs bg-card-alt text-secondary rounded-full px-1.5 min-w-[20px] text-center">
                {sessionCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom items */}
      <nav className="flex flex-col gap-1 px-2 pb-4">
        {BOTTOM_ITEMS.map((item) => (
          <button
            key={item.id}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-secondary hover:bg-card-alt hover:text-primary transition"
          >
            <span className="text-sm">{item.icon}</span>
            <span className="text-xs font-semibold uppercase tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
