import { useRef, useState, useCallback, useEffect } from "react"
import { useIntegrationStore } from "../../stores/integrationStore"

const NODE_W       = 148
const NODE_H       = 52
const H_GAP        = 52
const FAULT_OFFSET = 90
const MARGIN_X     = 24
const MARGIN_Y     = 32

const ZOOM_MIN  = 0.3
const ZOOM_MAX  = 2.5
const ZOOM_STEP = 0.1

export default function FlowDiagram() {
  const { parsedMetadata } = useIntegrationStore()

  const containerRef = useRef(null)
  const dragStart    = useRef(null)

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [dragging,  setDragging]  = useState(false)

  if (!parsedMetadata) return null

  const { triggers, invokes, faultHandlers } = parsedMetadata

  const mainNodes = [
    ...triggers.map((t) => ({ ...t, kind: "trigger" })),
    ...invokes.map((i)  => ({ ...i, kind: "invoke"  })),
  ]

  const hasFaults = faultHandlers.length > 0
  const svgW = MARGIN_X * 2 + mainNodes.length * NODE_W + (mainNodes.length - 1) * H_GAP
  const svgH = hasFaults
    ? MARGIN_Y + NODE_H + FAULT_OFFSET + NODE_H + MARGIN_Y
    : MARGIN_Y + NODE_H + MARGIN_Y

  function nodeX(i) {
    return MARGIN_X + i * (NODE_W + H_GAP)
  }

  const mainY  = MARGIN_Y
  const faultY = mainY + NODE_H + FAULT_OFFSET

  // ── Wheel zoom ───────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev.scale + delta)),
    }))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  // ── Global mouseup — always ends drag ────────
  useEffect(() => {
    function handleGlobalMouseUp() {
      setDragging(false)
      dragStart.current = null
    }
    window.addEventListener("mouseup", handleGlobalMouseUp)
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp)
  }, [])

  // ── Drag ─────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    setDragging(true)
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      tx: transform.x,
      ty: transform.y,
    }
  }, [transform.x, transform.y])

  const onMouseMove = useCallback((e) => {
    if (!dragging) return
    // Read ref into local variable before setTransform to avoid
    // stale closure access after ref is nulled by concurrent mouseup
    const start = dragStart.current
    if (!start) return

    const dx = e.clientX - start.mx
    const dy = e.clientY - start.my

    setTransform((prev) => ({
      ...prev,
      x: start.tx + dx,
      y: start.ty + dy,
    }))
  }, [dragging])

  // ── Zoom controls ─────────────────────────────
  function zoomIn()    { setTransform((p) => ({ ...p, scale: Math.min(ZOOM_MAX, p.scale + ZOOM_STEP) })) }
  function zoomOut()   { setTransform((p) => ({ ...p, scale: Math.max(ZOOM_MIN, p.scale - ZOOM_STEP) })) }
  function zoomReset() { setTransform({ x: 0, y: 0, scale: 1 }) }

  const cursor = dragging ? "grabbing" : "grab"

  return (
    <div className="relative">

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
        <ZoomButton onClick={zoomOut} label="−" />
        <button
          onClick={zoomReset}
          className="
            text-[10px] tracking-widest px-2 py-1 min-w-[44px]
            bg-[#0c0c0e] border border-[#1c1c1f] text-[#3d3b38]
            hover:text-[#ff8a00] hover:border-[#ff8a00]
            transition-all duration-150 rounded font-mono
          "
        >
          {Math.round(transform.scale * 100)}%
        </button>
        <ZoomButton onClick={zoomIn} label="+" />
      </div>

      {/* Hint */}
      <div className="absolute bottom-3 left-3 z-10 text-[10px] text-[#2a2a2c] tracking-wider select-none pointer-events-none">
        scroll to zoom · drag to pan
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        style={{
          cursor,
          overflow: "hidden",
          height: 260,
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
        }}
      >
        {/* Transformed layer */}
        <div
  style={{
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    transformOrigin: "top left",
    display: "inline-block",
  }}
>
  <svg
    width={svgW * transform.scale}
    height={svgH * transform.scale}
    viewBox={`0 0 ${svgW} ${svgH}`}
    xmlns="http://www.w3.org/2000/svg"
  >
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#3d3b38" />
              </marker>
              <marker id="arrow-fault" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#ef4444" />
              </marker>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Connector arrows — main flow */}
            {mainNodes.map((_, i) => {
              if (i === mainNodes.length - 1) return null
              const x1 = nodeX(i) + NODE_W
              const x2 = nodeX(i + 1)
              const cy = mainY + NODE_H / 2
              return (
                <line
                  key={`conn-${i}`}
                  x1={x1} y1={cy} x2={x2 - 2} y2={cy}
                  stroke="#2a2a2d" strokeWidth="1.5"
                  markerEnd="url(#arrow)"
                />
              )
            })}

            {/* Fault drop lines + fault nodes */}
            {hasFaults && (() => {
              const anchorX     = nodeX(mainNodes.length - 1) + NODE_W / 2
              const anchorY     = mainY + NODE_H
              const faultNodeW  = 130
              const faultHGap   = 16
              const totalW      = faultHandlers.length * faultNodeW + (faultHandlers.length - 1) * faultHGap
              const faultStartX = anchorX - totalW / 2

              return (
                <g>
                  {/* Vertical dashed drop */}
                  <line
                    x1={anchorX} y1={anchorY}
                    x2={anchorX} y2={faultY - 4}
                    stroke="#ef4444" strokeWidth="1"
                    strokeDasharray="3 3"
                    markerEnd="url(#arrow-fault)"
                  />

                  {/* "fault" label */}
                  <text
                    x={anchorX + 5} y={anchorY + FAULT_OFFSET / 2}
                    fontSize="8" fill="#ef4444"
                    fontFamily="courier, monospace" opacity="0.7"
                  >
                    fault
                  </text>

                  {/* Fault nodes */}
                  {faultHandlers.map((f, fi) => {
                    const fx = faultStartX + fi * (faultNodeW + faultHGap)
                    return (
                      <g key={`fault-${fi}`}>
                        {fi > 0 && (
                          <line
                            x1={faultStartX + (fi - 1) * (faultNodeW + faultHGap) + faultNodeW}
                            y1={faultY + NODE_H / 2}
                            x2={fx} y2={faultY + NODE_H / 2}
                            stroke="#2a2a2d" strokeWidth="1"
                            strokeDasharray="3 3"
                          />
                        )}
                        <FaultNode
                          x={fx} y={faultY}
                          w={faultNodeW} h={NODE_H}
                          label={f.faultName || "GenericFault"}
                          action={f.action}
                        />
                      </g>
                    )
                  })}
                </g>
              )
            })()}

            {/* Main flow nodes */}
            {mainNodes.map((node, i) => (
              <FlowNode
                key={`node-${i}`}
                x={nodeX(i)} y={mainY}
                w={NODE_W}   h={NODE_H}
                node={node}
                isTrigger={node.kind === "trigger"}
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// FlowNode
// ─────────────────────────────────────────────

function FlowNode({ x, y, w, h, node, isTrigger }) {
  return (
    <g filter={isTrigger ? "url(#glow)" : undefined}>
      <rect
        x={x} y={y} width={w} height={h} rx="6" ry="6"
        fill={isTrigger ? "#1a0f00" : "#0c0c0e"}
        stroke={isTrigger ? "#ff8a00" : "#1c1c1f"}
        strokeWidth={isTrigger ? "1.5" : "0.8"}
      />
      <text x={x + 8} y={y + 13} fontSize="6.5"
        fill={isTrigger ? "#ff8a00" : "#3d3b38"}
        fontFamily="courier, monospace" fontWeight="bold" letterSpacing="1">
        {isTrigger ? "TRIGGER" : "INVOKE"}
      </text>
      <text x={x + 8} y={y + 26} fontSize="9.5"
        fill={isTrigger ? "#ff8a00" : "#e8e6e0"}
        fontFamily="courier, monospace" fontWeight="bold">
        {truncate(node.name, 17)}
      </text>
      <text x={x + 8} y={y + 38} fontSize="7.5" fill="#555350"
        fontFamily="courier, monospace">
        {truncate(node.connection || node.adapterType || "", 20)}
      </text>
      <text x={x + w - 8} y={y + h - 8} fontSize="6" fill="#2a2a2c"
        fontFamily="courier, monospace" textAnchor="end">
        {(node.binding || node.adapterType || "").toUpperCase()}
      </text>
    </g>
  )
}

// ─────────────────────────────────────────────
// FaultNode
// ─────────────────────────────────────────────

function FaultNode({ x, y, w, h, label, action }) {
  return (
    <g>
      <rect
        x={x} y={y} width={w} height={h} rx="6" ry="6"
        fill="#120808" stroke="#7f1d1d"
        strokeWidth="0.8" strokeDasharray="3 2"
      />
      <text x={x + 8} y={y + 13} fontSize="6.5" fill="#ef4444"
        fontFamily="courier, monospace" fontWeight="bold" letterSpacing="1">
        FAULT
      </text>
      <text x={x + 8} y={y + 26} fontSize="9" fill="#fca5a5"
        fontFamily="courier, monospace" fontWeight="bold">
        {truncate(label, 16)}
      </text>
      <text x={x + 8} y={y + 38} fontSize="7.5" fill="#7f1d1d"
        fontFamily="courier, monospace">
        {action}
      </text>
    </g>
  )
}

// ─────────────────────────────────────────────
// ZoomButton
// ─────────────────────────────────────────────

function ZoomButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="
        w-7 h-7 flex items-center justify-center
        bg-[#0c0c0e] border border-[#1c1c1f] rounded
        text-[#3d3b38] hover:text-[#ff8a00] hover:border-[#ff8a00]
        transition-all duration-150 text-[14px] font-mono
      "
    >
      {label}
    </button>
  )
}

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────

function truncate(str, max) {
  if (!str) return ""
  return str.length > max ? str.slice(0, max - 1) + "…" : str
}