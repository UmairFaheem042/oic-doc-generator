export default function EmptyState({ message = "None found" }) {
  return (
    <div style={{
      display:    "flex",
      alignItems: "center",
      gap:        12,
      padding:    "14px 4px",
    }}>
      <div style={{
        width:      2,
        height:     16,
        background: "var(--border)",
        borderRadius: 2,
        flexShrink: 0,
      }} />
      <p style={{
        margin:        0,
        fontSize:      12,
        letterSpacing: "0.06em",
        color:         "var(--text-ghost)",
        fontStyle:     "italic",
        fontFamily:    "inherit",
      }}>
        {message}
      </p>
    </div>
  )
}