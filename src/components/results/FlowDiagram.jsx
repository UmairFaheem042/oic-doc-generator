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

// Theme-aware color maps
function getColors(theme) {
  const dark = theme === "dark"
  return {
    nodeBg:        dark ? "#0c0c0e"  : "#ffffff",
    triggerBg:     dark ? "#1a0f00"  : "#fffbeb",
    triggerBorder: dark ? "#ff8a00"  : "#d97706",
    triggerText:   dark ? "#ff8a00"  : "#d97706",
    invokeText:    dark ? "#e8e6e0"  : "#2a2825",
    invokeBorder:  dark ? "#1c1c1f"  : "#dddbd4",
    kindColor:     dark ? "#3d3b38"  : "#a8a29e",
    subText:       dark ? "#555350"  : "#a8a29e",
    adapterText:   dark ? "#2a2a2c"  : "#c8c5bc",
    connector:     dark ? "#2a2a2d"  : "#dddbd4",
    faultBg:       dark ? "#120808"  : "#fff5f5",
    faultBorder:   dark ? "#7f1d1d"  : "#fca5a5",
    faultLabel:    dark ? "#ef4444"  : "#dc2626",
    faultText:     dark ? "#fca5a5"  : "#dc2626",
    faultAction:   dark ? "#7f1d1d"  : "#fca5a5",
    faultLine:     dark ? "#ef4444"  : "#dc2626",
    arrowFill:     dark ? "#3d3b38"  : "#c8c5bc",
    zoomBg:        dark ? "#0c0c0e"  : "#ffffff",
    zoomBorder:    dark ? "#1c1c1f"  : "#dddbd4",
    zoomColor:     dark ? "#3d3b38"  : "#a8a29e",
    hintColor:     dark ? "#2a2a2c"  : "#c8c5bc",
  }
}

export default function FlowDiagram() {
  const parsedMetadata = useIntegrationStore((s) => s.parsedMetadata)
const theme          = useIntegrationStore((s) => s.theme)

  const containerRef = useRef(null)
  const dragStart    = useRef(null)

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [dragging,  setDragging]  = useState(false)

  if (!parsedMetadata) return null

  const C = getColors(theme)
  const { triggers, invokes, faultHandlers } = parsedMetadata

  const mainNodes = [
    ...triggers.map((t) => ({ ...t, kind: "trigger" })),
    ...invokes.map((i)  => ({ ...i, kind: "invoke"  })),
  ]

  const hasFaults   = faultHandlers.length > 0
 
const faultNodeW  = 130
const faultHGap   = 16
const totalFaultW = faultHandlers.length * faultNodeW + (faultHandlers.length - 1) * faultHGap

// Fault row is centered under the last node
const lastNodeCenterX = MARGIN_X + (mainNodes.length - 1) * (NODE_W + H_GAP) + NODE_W / 2
const faultRowLeft    = lastNodeCenterX - totalFaultW / 2
const faultRowRight   = lastNodeCenterX + totalFaultW / 2

// SVG width must fit both the main node row AND the fault row
const mainRowWidth = MARGIN_X * 2 + mainNodes.length * NODE_W + (mainNodes.length - 1) * H_GAP
const svgW = Math.max(mainRowWidth, faultRowRight + MARGIN_X)
  const svgH        = hasFaults
    ? MARGIN_Y + NODE_H + FAULT_OFFSET + NODE_H + MARGIN_Y
    : MARGIN_Y + NODE_H + MARGIN_Y

  // Container height adapts to content
  const containerH  = hasFaults ? 340 : 220

  function nodeX(i) {
    return MARGIN_X + i * (NODE_W + H_GAP)
  }

  const mainY  = MARGIN_Y
  const faultY = mainY + NODE_H + FAULT_OFFSET

  // Fit to view
  const fitToView = useCallback(() => {
    if (!containerRef.current) return
    const containerW = containerRef.current.offsetWidth
    const padding    = 48
    const scaleX     = (containerW - padding) / svgW
    const scaleY     = (containerH - padding) / svgH
    const scale      = Math.min(scaleX, scaleY, 1)
    setTransform({ x: padding / 2, y: padding / 2, scale })
  }, [svgW, svgH, containerH])

  // Auto fit on mount and when data changes
  useEffect(() => {
    fitToView()
  }, [fitToView])

  // Wheel zoom
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

  // Global mouseup
  useEffect(() => {
    function handleGlobalMouseUp() {
      setDragging(false)
      dragStart.current = null
    }
    window.addEventListener("mouseup", handleGlobalMouseUp)
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp)
  }, [])

  // Drag
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

  // Zoom buttons
  function zoomIn()    { setTransform((p) => ({ ...p, scale: Math.min(ZOOM_MAX, p.scale + ZOOM_STEP) })) }
  function zoomOut()   { setTransform((p) => ({ ...p, scale: Math.max(ZOOM_MIN, p.scale - ZOOM_STEP) })) }
  function zoomReset() { setTransform({ x: 0, y: 0, scale: 1 }) }

  const cursor = dragging ? "grabbing" : "grab"

  return (
    <div style={{ position: "relative" }}>

      {/* Zoom controls */}
      <div style={{
        position: "absolute", top: 12, right: 12, zIndex: 10,
        display: "flex", alignItems: "center", gap: 4,
      }}>
        <ZoomButton onClick={fitToView} label="⊡" C={C} title="Fit to view" />
        <ZoomButton onClick={zoomOut}   label="−" C={C} title="Zoom out" />
        <button
          onClick={zoomReset}
          style={{
            fontSize:      10,
            letterSpacing: "0.08em",
            padding:       "4px 8px",
            minWidth:      44,
            background:    C.zoomBg,
            border:        `1px solid ${C.zoomBorder}`,
            color:         C.zoomColor,
            borderRadius:  4,
            cursor:        "pointer",
            fontFamily:    "inherit",
            transition:    "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)"
            e.currentTarget.style.color       = "var(--accent)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.zoomBorder
            e.currentTarget.style.color       = C.zoomColor
          }}
        >
          {Math.round(transform.scale * 100)}%
        </button>
        <ZoomButton onClick={zoomIn}    label="+" C={C} title="Zoom in" />
      </div>

      {/* Hint */}
      <div style={{
        position:      "absolute",
        bottom:        12,
        left:          12,
        zIndex:        10,
        fontSize:      10,
        letterSpacing: "0.08em",
        color:         C.hintColor,
        userSelect:    "none",
        pointerEvents: "none",
      }}>
        scroll to zoom · drag to pan
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        style={{
          cursor,
          overflow:         "hidden",
          height:           containerH,
          userSelect:       "none",
          WebkitUserSelect: "none",
          MozUserSelect:    "none",
        }}
      >
        <div style={{
          transform:       `translate(${transform.x}px, ${transform.y}px)`,
          transformOrigin: "top left",
          display:         "inline-block",
        }}>
          <svg
            width={svgW * transform.scale}
            height={svgH * transform.scale}
            viewBox={`0 0 ${svgW} ${svgH}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8"
                refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={C.arrowFill} />
              </marker>
              <marker id="arrow-fault" markerWidth="8" markerHeight="8"
                refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={C.faultLine} />
              </marker>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Connector arrows */}
            {mainNodes.map((_, i) => {
              if (i === mainNodes.length - 1) return null
              const x1 = nodeX(i) + NODE_W
              const x2 = nodeX(i + 1)
              const cy = mainY + NODE_H / 2
              return (
                <line key={`conn-${i}`}
                  x1={x1} y1={cy} x2={x2 - 2} y2={cy}
                  stroke={C.connector} strokeWidth="1.5"
                  markerEnd="url(#arrow)"
                />
              )
            })}

            {/* Fault section */}
            {hasFaults && (() => {
              const anchorX     = nodeX(mainNodes.length - 1) + NODE_W / 2
              const anchorY     = mainY + NODE_H
              const faultNodeW  = 130
              const faultHGap   = 16
              const totalW      = faultHandlers.length * faultNodeW + (faultHandlers.length - 1) * faultHGap
              const faultStartX = anchorX - totalW / 2

              return (
                <g>
                  <line
                    x1={anchorX} y1={anchorY}
                    x2={anchorX} y2={faultY - 4}
                    stroke={C.faultLine} strokeWidth="1"
                    strokeDasharray="3 3"
                    markerEnd="url(#arrow-fault)"
                  />
                  <text
                    x={anchorX + 5} y={anchorY + FAULT_OFFSET / 2}
                    fontSize="8" fill={C.faultLine}
                    fontFamily="courier, monospace" opacity="0.7">
                    fault
                  </text>
                  {faultHandlers.map((f, fi) => {
                    const fx = faultStartX + fi * (faultNodeW + faultHGap)
                    return (
                      <g key={`fault-${fi}`}>
                        {fi > 0 && (
                          <line
                            x1={faultStartX + (fi - 1) * (faultNodeW + faultHGap) + faultNodeW}
                            y1={faultY + NODE_H / 2}
                            x2={fx} y2={faultY + NODE_H / 2}
                            stroke={C.connector} strokeWidth="1"
                            strokeDasharray="3 3"
                          />
                        )}
                        <FaultNode
                          x={fx} y={faultY}
                          w={faultNodeW} h={NODE_H}
                          label={f.faultName || "GenericFault"}
                          action={f.action}
                          C={C}
                        />
                      </g>
                    )
                  })}
                </g>
              )
            })()}

            {/* Main nodes */}
            {mainNodes.map((node, i) => (
              <FlowNode
                key={`node-${i}`}
                x={nodeX(i)} y={mainY}
                w={NODE_W}   h={NODE_H}
                node={node}
                isTrigger={node.kind === "trigger"}
                C={C}
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  )
}

// FlowNode
function FlowNode({ x, y, w, h, node, isTrigger, C }) {
  return (
    <g filter={isTrigger ? "url(#glow)" : undefined}>
      <rect x={x} y={y} width={w} height={h} rx="6" ry="6"
        fill={isTrigger ? C.triggerBg     : C.nodeBg}
        stroke={isTrigger ? C.triggerBorder : C.invokeBorder}
        strokeWidth={isTrigger ? "1.5" : "0.8"}
      />
      <text x={x + 8} y={y + 13} fontSize="6.5"
        fill={isTrigger ? C.triggerText : C.kindColor}
        fontFamily="courier, monospace" fontWeight="bold" letterSpacing="1">
        {isTrigger ? "TRIGGER" : "INVOKE"}
      </text>
      <text x={x + 8} y={y + 26} fontSize="9.5"
        fill={isTrigger ? C.triggerText : C.invokeText}
        fontFamily="courier, monospace" fontWeight="bold">
        {truncate(node.name, 17)}
      </text>
      <text x={x + 8} y={y + 38} fontSize="7.5"
        fill={C.subText} fontFamily="courier, monospace">
        {truncate(node.connection || node.adapterType || "", 20)}
      </text>
      <text x={x + w - 8} y={y + h - 8} fontSize="6"
        fill={C.adapterText} fontFamily="courier, monospace" textAnchor="end">
        {(node.binding || node.adapterType || "").toUpperCase()}
      </text>
    </g>
  )
}


// FaultNode
function FaultNode({ x, y, w, h, label, action, C }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="6" ry="6"
        fill={C.faultBg} stroke={C.faultBorder}
        strokeWidth="0.8" strokeDasharray="3 2"
      />
      <text x={x + 8} y={y + 13} fontSize="6.5"
        fill={C.faultLabel}
        fontFamily="courier, monospace" fontWeight="bold" letterSpacing="1">
        FAULT
      </text>
      <text x={x + 8} y={y + 26} fontSize="9"
        fill={C.faultText}
        fontFamily="courier, monospace" fontWeight="bold">
        {truncate(label, 16)}
      </text>
      <text x={x + 8} y={y + 38} fontSize="7.5"
        fill={C.faultAction} fontFamily="courier, monospace">
        {action}
      </text>
    </g>
  )
}


// ZoomButton
function ZoomButton({ onClick, label, C, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width:          28,
        height:         28,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        background:     C.zoomBg,
        border:         `1px solid ${C.zoomBorder}`,
        borderRadius:   4,
        cursor:         "pointer",
        color:          C.zoomColor,
        fontSize:       14,
        fontFamily:     "inherit",
        transition:     "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)"
        e.currentTarget.style.color       = "var(--accent)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.zoomBorder
        e.currentTarget.style.color       = C.zoomColor
      }}
    >
      {label}
    </button>
  )
}


// Utility
function truncate(str, max) {
  if (!str) return ""
  return str.length > max ? str.slice(0, max - 1) + "…" : str
}