export default function AppShell({ children }) {
    return (
      <div className="min-h-screen bg-[#080809] text-[#e8e6e0] font-mono">
  
        {/* Top accent line */}
        <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff8a00] to-transparent z-50" />
  
        {/* Grid background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,138,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,138,0,0.025) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
  
        {/* Top bar */}
        <header className="relative z-10 border-b border-[#161618] px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ZapIcon />
            <span className="text-[10px] tracking-[0.25em] text-[#ff8a00] uppercase">
              OIC Doc Generator
            </span>
          </div>
          <span className="text-[11px] text-[#2a2a2c] tracking-widest uppercase">
            Oracle Integration Cloud
          </span>
        </header>
  
        {/* Main content */}
        <main className="relative z-10 max-w-[860px] mx-auto px-7 py-14">
          {children}
        </main>
  
      </div>
    )
  }
  
  function ZapIcon() {
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="#ff8a00"
        stroke="#ff8a00"
        strokeWidth="1"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    )
  }