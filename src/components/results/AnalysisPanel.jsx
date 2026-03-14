import { useState } from "react"
import { analyze }  from "../../analyzers/integrationAnalyzer"

const SEVERITY_CONFIG = {
  risk: {
    label:       "RISK",
    color:       "var(--red)",
    bg:          "var(--red-bg)",
    border:      "var(--red-border)",
    icon:        <AlertIcon />,
  },
  suggestion: {
    label:       "SUGGESTION",
    color:       "var(--accent)",
    bg:          "var(--accent-bg)",
    border:      "var(--accent)",
    icon:        <LightbulbIcon />,
  },
  info: {
    label:       "INFO",
    color:       "var(--text-muted)",
    bg:          "var(--bg-inset)",
    border:      "var(--border)",
    icon:        <InfoIcon />,
  },
}

export default function AnalysisPanel({ metadata }) {
  const [open, setOpen] = useState(true)

  const findings = analyze(metadata)

  const risks       = findings.filter((f) => f.severity === "risk")
  const suggestions = findings.filter((f) => f.severity === "suggestion")
  const infos       = findings.filter((f) => f.severity === "info")

  return (
    <div style={{
      border:       "1px solid var(--border)",
      borderRadius: 12,
      overflow:     "hidden",
    }}>

      {/* Header — clickable to collapse */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width:          "100%",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          padding:        "14px 20px",
          background:     "var(--bg-card)",
          border:         "none",
          cursor:         "pointer",
          fontFamily:     "inherit",
          borderBottom:   open ? "1px solid var(--border)" : "none",
          transition:     "background 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-card-alt)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-card)"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            fontSize:      10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color:         "var(--text-body)",
            fontWeight:    700,
          }}>
            Analysis
          </span>

          {/* Summary pills */}
          <div style={{ display: "flex", gap: 6 }}>
            {risks.length > 0 && (
              <Pill count={risks.length}       label="risk"       color="var(--red)"        bg="var(--red-bg)"    />
            )}
            {suggestions.length > 0 && (
              <Pill count={suggestions.length} label="suggestion" color="var(--accent)"     bg="var(--accent-bg)" />
            )}
            {infos.length > 0 && (
              <Pill count={infos.length}       label="info"       color="var(--text-muted)" bg="var(--bg-inset)"  />
            )}
          </div>
        </div>

        <ChevronIcon open={open} />
      </button>

      {/* Findings list */}
      {open && (
        <div style={{ background: "var(--bg-card)" }}>
          {findings.length === 0 ? (
            <div style={{
              padding:    "20px 24px",
              fontSize:   12,
              color:      "var(--text-faint)",
              fontStyle:  "italic",
              letterSpacing: "0.04em",
            }}>
              No issues found — integration looks good.
            </div>
          ) : (
            findings.map((finding, i) => (
              <FindingRow
                key={i}
                finding={finding}
                isLast={i === findings.length - 1}
              />
            ))
          )}
        </div>
      )}

    </div>
  )
}


// FindingRow
function FindingRow({ finding, isLast }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = SEVERITY_CONFIG[finding.severity]

  return (
    <div style={{
      borderBottom: isLast ? "none" : "1px solid var(--bg-inset)",
      transition:   "background 0.1s",
    }}>
      {/* Row header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width:       "100%",
          display:     "flex",
          alignItems:  "center",
          gap:         12,
          padding:     "12px 20px",
          background:  "none",
          border:      "none",
          cursor:      "pointer",
          fontFamily:  "inherit",
          textAlign:   "left",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-card-alt)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      >
        {/* Severity icon */}
        <span style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }}>
          {cfg.icon}
        </span>

        {/* Title */}
        <span style={{
          flex:          1,
          fontSize:      12.5,
          color:         "var(--text-body)",
          letterSpacing: "0.01em",
        }}>
          {finding.title}
        </span>

        {/* Severity badge */}
        <span style={{
          fontSize:      9,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding:       "2px 8px",
          borderRadius:  4,
          background:    cfg.bg,
          color:         cfg.color,
          border:        `1px solid ${cfg.border}`,
          flexShrink:    0,
        }}>
          {cfg.label}
        </span>

        {/* Expand chevron */}
        <span style={{
          color:      "var(--text-faint)",
          flexShrink: 0,
          transition: "transform 0.2s",
          transform:  expanded ? "rotate(180deg)" : "rotate(0deg)",
        }}>
          <SmallChevronIcon />
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding:    "0 20px 16px 44px",
          display:    "flex",
          flexDirection: "column",
          gap:        10,
        }}>
          <p style={{
            margin:        0,
            fontSize:      12,
            lineHeight:    1.7,
            color:         "var(--text-muted)",
            letterSpacing: "0.01em",
          }}>
            {finding.detail}
          </p>

          {/* Affected components */}
          {finding.affected && finding.affected.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {finding.affected.map((name) => (
                <span key={name} style={{
                  fontSize:      10,
                  letterSpacing: "0.06em",
                  padding:       "2px 8px",
                  borderRadius:  4,
                  background:    "var(--bg-inset)",
                  color:         "var(--text-dim)",
                  border:        "1px solid var(--border)",
                }}>
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


// Pill
function Pill({ count, label, color, bg }) {
  return (
    <span style={{
      display:       "flex",
      alignItems:    "center",
      gap:           4,
      fontSize:      10,
      letterSpacing: "0.08em",
      padding:       "2px 8px",
      borderRadius:  99,
      background:    bg,
      color,
    }}>
      <span style={{ fontWeight: 700 }}>{count}</span>
      <span style={{ opacity: 0.7 }}>{label}{count > 1 ? "s" : ""}</span>
    </span>
  )
}


// Icons
function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9"  x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function LightbulbIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <line x1="9"  y1="18" x2="15" y2="18" />
      <line x1="10" y1="22" x2="14" y2="22" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8"  x2="12" y2="8.01" />
      <line x1="12" y1="12" x2="12" y2="16" />
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="var(--text-faint)" strokeWidth="2"
      style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function SmallChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}