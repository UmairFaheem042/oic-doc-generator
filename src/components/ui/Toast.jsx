import { useEffect, useState } from "react"

export default function Toast({ message, onDone }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 10)
    const exitTimer  = setTimeout(() => setVisible(false), 2200)
    const doneTimer  = setTimeout(() => onDone(), 2700)
    return () => {
      clearTimeout(enterTimer)
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div style={{
      position:   "fixed",
      bottom:     32,
      left:       "50%",
      transform:  `translateX(-50%) translateY(${visible ? "0" : "12px"})`,
      opacity:    visible ? 1 : 0,
      transition: "transform 0.25s ease, opacity 0.25s ease",
      zIndex:     100,
      display:    "flex",
      alignItems: "center",
      gap:        8,
      padding:    "10px 16px",
      background: "var(--bg-card)",
      border:     "1px solid var(--accent)",
      borderRadius: 8,
      fontSize:     12,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color:         "var(--accent)",
      fontFamily:    "inherit",
      pointerEvents: "none",
      userSelect:    "none",
      whiteSpace:    "nowrap",
      boxShadow:     "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      <CheckIcon />
      {message}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}