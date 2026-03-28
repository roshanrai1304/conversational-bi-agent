export function Footer() {
  return (
    <footer className="flex items-center justify-between px-0 py-4 border-t border-border text-xs text-secondary mt-4">
      <span>© 2026 BI AGENT AI. CONNECTED TO INSTACART PRODUCTION CLUSTER.</span>
      <div className="flex items-center gap-4">
        <span className="cursor-pointer hover:text-primary transition">PRIVACY POLICY</span>
        <span className="cursor-pointer hover:text-primary transition">TERMS OF SERVICE</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
          SECURITY STATUS: ACTIVE
        </span>
      </div>
    </footer>
  )
}
