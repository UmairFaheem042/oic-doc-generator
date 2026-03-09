export default function Skeleton() {
  const pulse = {
    background: "var(--bg-inset)",
    borderRadius: 4,
    animation: "pulse 1.8s ease-in-out infinite",
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ ...pulse, height: 8,  width: 120 }} />
          <div style={{ ...pulse, height: 28, width: 260 }} />
          <div style={{ ...pulse, height: 8,  width: 180 }} />
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{
              background:   "var(--bg-card)",
              border:       "1px solid var(--border)",
              borderRadius: 12,
              padding:      16,
              display:      "flex",
              flexDirection: "column",
              gap:          10,
            }}>
              <div style={{ ...pulse, height: 28, width: 32 }} />
              <div style={{ ...pulse, height: 7,  width: 64 }} />
            </div>
          ))}
        </div>

        {/* Flow placeholder */}
        <div style={{
          background:   "var(--bg-card)",
          border:       "1px solid var(--border)",
          borderRadius: 12,
          padding:      20,
          height:       120,
          display:      "flex",
          alignItems:   "center",
          gap:          12,
        }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                ...pulse,
                width: 120, height: 52,
                borderRadius: 8,
              }} />
              {i < 2 && (
                <div style={{ ...pulse, width: 40, height: 2 }} />
              )}
            </div>
          ))}
        </div>

        {/* Table sections */}
        {[...Array(3)].map((_, si) => (
          <div key={si} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ ...pulse, height: 8, width: 100 }} />
              <div style={{ ...pulse, height: 8, width: 20, borderRadius: 4 }} />
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>
            {/* Table rows */}
            {[...Array(2)].map((_, ri) => (
              <div key={ri} style={{ display: "flex", gap: 24, paddingBottom: 10, borderBottom: "1px solid var(--bg-inset)" }}>
                <div style={{ ...pulse, height: 8, width: 80  }} />
                <div style={{ ...pulse, height: 8, width: 110 }} />
                <div style={{ ...pulse, height: 8, width: 60  }} />
                <div style={{ ...pulse, height: 8, width: 80  }} />
              </div>
            ))}
          </div>
        ))}

      </div>
    </>
  )
}