import { useIntegrationStore } from "../../stores/integrationStore"

const VIEW_LABELS = {
  upload:  "Upload",
  results: "Results",
}

export default function AppShell({ children }) {
  const { theme, toggleTheme, currentView, navigate } = useIntegrationStore()

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-body)" }}>

      {/* Top accent line */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 50,
        background: `linear-gradient(90deg, transparent, var(--top-line), transparent)`
      }} />

      {/* Grid background */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `
          linear-gradient(var(--grid-line) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
        `,
        backgroundSize: "44px 44px",
      }} />

      {/* Header */}
      <header style={{
        position: "relative", zIndex: 10,
        borderBottom: "1px solid var(--border)",
        padding: "16px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ZapIcon />
          <span style={{
            fontSize: 10, letterSpacing: "0.25em",
            color: "var(--accent)", textTransform: "uppercase",
          }}>
            OIC Doc Generator
          </span>
        </div>



        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{
            fontSize: 11, letterSpacing: "0.15em",
            color: "var(--text-ghost)", textTransform: "uppercase",
          }}>
            Oracle Integration Cloud
          </span>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: 8,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              color: "var(--text-faint)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)"
              e.currentTarget.style.color       = "var(--accent)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)"
              e.currentTarget.style.color       = "var(--text-faint)"
            }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{
        position: "relative", zIndex: 10,
        maxWidth: 860, margin: "0 auto",
        padding: "52px 28px 80px",
      }}>
        {children}
      </main>

    </div>
  )
}


// Icons
function ZapIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24"
      fill="var(--accent)" stroke="var(--accent)" strokeWidth="1">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1"  x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1"  y1="12" x2="3"  y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78"  x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}