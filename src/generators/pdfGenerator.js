import jsPDF from "jspdf"

// ── Theme — mirrors the webapp exactly ──────────
const THEME = {
  bg:          [8,   8,   9],
  bgCard:      [12,  12,  14],
  bgBadgeGood: [15,  42,  26],
  bgBadgePri:  [26,  26,  15],
  border:      [28,  28,  31],
  accent:      [255, 138, 0],
  textPrimary: [240, 237, 232],
  textMuted:   [168, 164, 158],
  textDim:     [61,  59,  56],
  textGreen:   [34,  197, 94],
  white:       [255, 255, 255],
}

const PAGE_W    = 210
const PAGE_H    = 297
const MARGIN    = 14
const CONTENT_W = PAGE_W - MARGIN * 2

export function generatePdf(metadata) {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  let y = 0

  // ── Page setup ──────────────────────────────
  function newPage() {
    doc.addPage()
    drawPageBg()
    drawAccentLine()
    y = MARGIN + 6
  }

  function drawPageBg() {
    doc.setFillColor(...THEME.bg)
    doc.rect(0, 0, PAGE_W, PAGE_H, "F")
  }

  function drawAccentLine() {
    doc.setDrawColor(...THEME.accent)
    doc.setLineWidth(0.8)
    doc.line(0, 0, PAGE_W, 0)
  }

  function checkPageBreak(needed = 20) {
    if (y + needed > PAGE_H - MARGIN) newPage()
  }

  // ── Drawing primitives ──────────────────────
  function setFont(style = "normal", size = 10) {
    doc.setFont("courier", style)
    doc.setFontSize(size)
  }

  function text(str, x, yPos, color = THEME.textPrimary) {
    doc.setTextColor(...color)
    doc.text(str, x, yPos)
  }

  function rect(x, yPos, w, h, color) {
    doc.setFillColor(...color)
    doc.setDrawColor(...color)
    doc.rect(x, yPos, w, h, "F")
  }

  function hLine(yPos, color = THEME.border) {
    doc.setDrawColor(...color)
    doc.setLineWidth(0.2)
    doc.line(MARGIN, yPos, PAGE_W - MARGIN, yPos)
  }

  function badge(label, x, yPos, bgColor, textColor) {
    setFont("normal", 7)
    const tw = doc.getTextWidth(label)
    const pw = tw + 4
    const ph = 4.5
    doc.setFillColor(...bgColor)
    doc.roundedRect(x, yPos - 3.2, pw, ph, 1, 1, "F")
    doc.setTextColor(...textColor)
    doc.text(label, x + 2, yPos)
    return pw
  }

  // ─────────────────────────────────────────────
  // PAGE 1 — Header
  // ─────────────────────────────────────────────
  drawPageBg()
  drawAccentLine()
  y = MARGIN + 6

  // Eyebrow
  setFont("normal", 7)
  text("ORACLE INTEGRATION CLOUD", MARGIN, y, THEME.accent)
  y += 5

  // Title
  setFont("bold", 22)
  text(metadata.integrationName, MARGIN, y, THEME.textPrimary)
  y += 3

  // Subtitle
  setFont("normal", 8)
  const subtitle = `v${metadata.version}  ·  ${metadata.pattern}  ·  ${metadata.percentComplete}% complete`
  text(subtitle, MARGIN, y + 4, THEME.textDim)
  y += 10

  // Status badges
  if (!metadata.hasErrors)   badge("NO ERRORS",   MARGIN,      y, THEME.bgBadgeGood, THEME.textGreen)
  if (!metadata.hasWarnings) badge("NO WARNINGS",  MARGIN + 22, y, THEME.bgBadgeGood, THEME.textGreen)
  y += 8

  hLine(y)
  y += 8

  // ── Summary cards ───────────────────────────
  const cardW = (CONTENT_W - 9) / 4
  const cardH = 22
  const cards = [
    { label: "TRIGGERS",       value: metadata.triggers.length },
    { label: "INVOKES",        value: metadata.invokes.length },
    { label: "FAULT HANDLERS", value: metadata.faultHandlers.length },
    { label: "VARIABLES",      value: metadata.variables.length },
  ]

  cards.forEach((card, i) => {
    const cx = MARGIN + i * (cardW + 3)
    rect(cx, y, cardW, cardH, THEME.bgCard)
    doc.setDrawColor(...THEME.border)
    doc.setLineWidth(0.2)
    doc.roundedRect(cx, y, cardW, cardH, 1.5, 1.5, "S")
    setFont("bold", 18)
    doc.setTextColor(...THEME.accent)
    doc.text(String(card.value), cx + 4, y + 12)
    setFont("normal", 6.5)
    doc.setTextColor(...THEME.textDim)
    doc.text(card.label, cx + 4, y + 19)
  })

  y += cardH + 10

  // ── Flow Diagram — inline after summary cards ──
  checkPageBreak(60)
  setFont("bold", 9)
  text("INTEGRATION FLOW", MARGIN, y, THEME.textPrimary)
  y += 2
  hLine(y)
  y += 10

  const diagramHeight = drawFlowDiagram(doc, metadata, y)
  y += diagramHeight + 8

  hLine(y)
  y += 10

  // ─────────────────────────────────────────────
  // Section helpers
  // ─────────────────────────────────────────────
  function sectionHeader(title, count) {
    checkPageBreak(16)
    setFont("bold", 9)
    text(title.toUpperCase(), MARGIN, y, THEME.textPrimary)
    if (count !== undefined) {
      setFont("normal", 7)
      const tw = doc.getTextWidth(title.toUpperCase()) + 3
      badge(String(count), MARGIN + tw + 2, y, THEME.border, THEME.textDim)
    }
    y += 2
    hLine(y, THEME.border)
    y += 5
  }

  function tableHeader(cols) {
    checkPageBreak(10)
    setFont("normal", 6.5)
    doc.setTextColor(...THEME.textDim)
    cols.forEach(({ label, x }) => doc.text(label.toUpperCase(), x, y))
    y += 2
    hLine(y, THEME.border)
    y += 4
  }

  function tableRow(cols, isAlt = false) {
    checkPageBreak(9)
    if (isAlt) {
      doc.setFillColor(14, 14, 16)
      doc.rect(MARGIN, y - 3.5, CONTENT_W, 7.5, "F")
    }
    setFont("normal", 8)
    cols.forEach(({ value, x, isStatus, isPrimary }) => {
      if (isStatus && value) {
        const isConfigured = value === "CONFIGURED"
        badge(
          value, x, y,
          isConfigured ? THEME.bgBadgeGood : [42, 26, 15],
          isConfigured ? THEME.textGreen   : [249, 115, 22]
        )
      } else if (isPrimary && value) {
        badge("PRIMARY", x, y, THEME.bgBadgePri, THEME.accent)
      } else {
        doc.setTextColor(...THEME.textMuted)
        doc.text(String(value || "—"), x, y)
      }
    })
    y += 7
  }

  function emptyRow() {
    setFont("normal", 8)
    text("None found", MARGIN, y, THEME.textDim)
    y += 8
  }

  // ─────────────────────────────────────────────
  // Data sections
  // ─────────────────────────────────────────────

  // Triggers
  sectionHeader("Triggers", metadata.triggers.length)
  if (!metadata.triggers.length) {
    emptyRow()
  } else {
    const TC = [
      { label: "Name",       x: MARGIN },
      { label: "Connection", x: MARGIN + 38 },
      { label: "Operation",  x: MARGIN + 90 },
      { label: "Security",   x: MARGIN + 125 },
      { label: "Status",     x: MARGIN + 158 },
    ]
    tableHeader(TC)
    metadata.triggers.forEach((t, i) => {
      tableRow([
        { value: t.name,       x: TC[0].x },
        { value: t.connection, x: TC[1].x },
        { value: t.operation,  x: TC[2].x },
        { value: t.security,   x: TC[3].x },
        { value: t.status,     x: TC[4].x, isStatus: true },
      ], i % 2 === 1)
    })
  }
  y += 4

  // Invoke Connections
  sectionHeader("Invoke Connections", metadata.invokes.length)
  if (!metadata.invokes.length) {
    emptyRow()
  } else {
    const IC = [
      { label: "Name",       x: MARGIN },
      { label: "Connection", x: MARGIN + 38 },
      { label: "Binding",    x: MARGIN + 85 },
      { label: "Operation",  x: MARGIN + 110 },
      { label: "Security",   x: MARGIN + 143 },
      { label: "Status",     x: MARGIN + 168 },
    ]
    tableHeader(IC)
    metadata.invokes.forEach((inv, i) => {
      tableRow([
        { value: inv.name,       x: IC[0].x },
        { value: inv.connection, x: IC[1].x },
        { value: inv.binding,    x: IC[2].x },
        { value: inv.operation,  x: IC[3].x },
        { value: inv.security,   x: IC[4].x },
        { value: inv.status,     x: IC[5].x, isStatus: true },
      ], i % 2 === 1)
    })
  }
  y += 4

  // Fault Handlers
  sectionHeader("Fault Handlers", metadata.faultHandlers.length)
  if (!metadata.faultHandlers.length) {
    emptyRow()
  } else {
    const FC = [
      { label: "Fault Name", x: MARGIN },
      { label: "Action",     x: MARGIN + 80 },
    ]
    tableHeader(FC)
    metadata.faultHandlers.forEach((f, i) => {
      tableRow([
        { value: f.faultName || "GenericFault", x: FC[0].x },
        { value: f.action,                      x: FC[1].x },
      ], i % 2 === 1)
    })
  }
  y += 4

  // Variables
  sectionHeader("Variables", metadata.variables.length)
  if (!metadata.variables.length) {
    emptyRow()
  } else {
    const VC = [
      { label: "Name",    x: MARGIN },
      { label: "Type",    x: MARGIN + 60 },
      { label: "Scope",   x: MARGIN + 100 },
      { label: "Primary", x: MARGIN + 150 },
    ]
    tableHeader(VC)
    metadata.variables.forEach((v, i) => {
      tableRow([
        { value: v.name  || "unnamed",   x: VC[0].x },
        { value: v.type,                 x: VC[1].x },
        { value: v.scope || "—",         x: VC[2].x },
        { value: v.primary ? "yes" : "", x: VC[3].x, isPrimary: v.primary },
      ], i % 2 === 1)
    })
  }

  // ─────────────────────────────────────────────
  // Footer — after all pages are built
  // ─────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    hLine(PAGE_H - 10)
    setFont("normal", 6.5)
    text("OIC Documentation Generator", MARGIN, PAGE_H - 6, THEME.textDim)
    text(
      `Page ${p} of ${totalPages}`,
      PAGE_W - MARGIN - doc.getTextWidth(`Page ${p} of ${totalPages}`),
      PAGE_H - 6,
      THEME.textDim
    )
  }

  // ── Save ─────────────────────────────────────
  const filename = `${metadata.integrationName.replace(/\s+/g, "_")}_docs.pdf`
  doc.save(filename)
}

// ─────────────────────────────────────────────
// Flow diagram renderer
// Returns total height consumed in mm
// ─────────────────────────────────────────────
function drawFlowDiagram(doc, metadata, startY) {
  const { triggers, invokes, faultHandlers } = metadata

  const mainNodes = [
    ...triggers.map((t) => ({ ...t, kind: "trigger" })),
    ...invokes.map((i)  => ({ ...i, kind: "invoke"  })),
  ]

  if (!mainNodes.length) return 0

  const NODE_W     = 42
  const NODE_H     = 18
  const H_GAP      = 10
  const FAULT_DROP = 28
  const START_X    = MARGIN

  function nodeX(i) {
    return START_X + i * (NODE_W + H_GAP)
  }

  const mainY  = startY
  const faultY = mainY + NODE_H + FAULT_DROP

  // ── Connector arrows between main nodes ─────
  mainNodes.forEach((_, i) => {
    if (i === mainNodes.length - 1) return
    const x1 = nodeX(i) + NODE_W
    const x2 = nodeX(i + 1)
    const cy  = mainY + NODE_H / 2

    doc.setDrawColor(...THEME.border)
    doc.setLineWidth(0.4)
    doc.line(x1, cy, x2, cy)

    // Arrowhead
    doc.setFillColor(...THEME.border)
    doc.triangle(x2, cy, x2 - 2.5, cy - 1.5, x2 - 2.5, cy + 1.5, "F")
  })

  // ── Main flow nodes ─────────────────────────
  mainNodes.forEach((node, i) => {
    const x         = nodeX(i)
    const isTrigger = node.kind === "trigger"

    // Background
    doc.setFillColor(...THEME.bgCard)
    doc.roundedRect(x, mainY, NODE_W, NODE_H, 1.5, 1.5, "F")

    // Border
    doc.setDrawColor(...(isTrigger ? THEME.accent : THEME.border))
    doc.setLineWidth(isTrigger ? 0.6 : 0.3)
    doc.roundedRect(x, mainY, NODE_W, NODE_H, 1.5, 1.5, "S")

    // Kind label
    doc.setFont("courier", "bold")
    doc.setFontSize(5.5)
    doc.setTextColor(...(isTrigger ? THEME.accent : THEME.textDim))
    doc.text(isTrigger ? "TRIGGER" : "INVOKE", x + 3, mainY + 5)

    // Name
    doc.setFont("courier", "bold")
    doc.setFontSize(7.5)
    doc.setTextColor(...(isTrigger ? THEME.accent : THEME.textPrimary))
    doc.text(truncatePdf(node.name, 14), x + 3, mainY + 10)

    // Connection
    doc.setFont("courier", "normal")
    doc.setFontSize(6)
    doc.setTextColor(...THEME.textDim)
    doc.text(truncatePdf(node.connection || node.adapterType || "", 18), x + 3, mainY + 15)
  })

  // ── Fault handlers ──────────────────────────
  if (faultHandlers.length > 0) {
    const anchorIndex = mainNodes.length - 1
    const anchorX     = nodeX(anchorIndex) + NODE_W / 2
    const anchorY     = mainY + NODE_H

    // Vertical dashed drop line
    doc.setDrawColor(239, 68, 68)
    doc.setLineWidth(0.4)
    doc.setLineDashPattern([1, 1], 0)
    doc.line(anchorX, anchorY, anchorX, faultY - 2)
    doc.setLineDashPattern([], 0)

    // "fault" label
    doc.setFont("courier", "normal")
    doc.setFontSize(5.5)
    doc.setTextColor(239, 68, 68)
    doc.text("fault", anchorX + 1.5, anchorY + FAULT_DROP / 2)

    // Arrowhead pointing down
    doc.setFillColor(239, 68, 68)
    doc.triangle(anchorX, faultY - 1, anchorX - 1.5, faultY - 4, anchorX + 1.5, faultY - 4, "F")

    const FAULT_NODE_W = 38
    const FAULT_NODE_H = 16
    const FAULT_H_GAP  = 6
    const totalFaultW  = faultHandlers.length * FAULT_NODE_W + (faultHandlers.length - 1) * FAULT_H_GAP
    const faultStartX  = anchorX - totalFaultW / 2

    faultHandlers.forEach((f, fi) => {
      const fx = faultStartX + fi * (FAULT_NODE_W + FAULT_H_GAP)

      // Horizontal connector between sibling fault nodes
      if (fi > 0) {
        doc.setDrawColor(...THEME.border)
        doc.setLineWidth(0.3)
        doc.setLineDashPattern([1, 1], 0)
        doc.line(
          faultStartX + (fi - 1) * (FAULT_NODE_W + FAULT_H_GAP) + FAULT_NODE_W,
          faultY + FAULT_NODE_H / 2,
          fx,
          faultY + FAULT_NODE_H / 2
        )
        doc.setLineDashPattern([], 0)
      }

      // Node background
      doc.setFillColor(18, 8, 8)
      doc.roundedRect(fx, faultY, FAULT_NODE_W, FAULT_NODE_H, 1.5, 1.5, "F")

      // Node border — dashed red
      doc.setDrawColor(127, 29, 29)
      doc.setLineWidth(0.3)
      doc.setLineDashPattern([1.5, 1], 0)
      doc.roundedRect(fx, faultY, FAULT_NODE_W, FAULT_NODE_H, 1.5, 1.5, "S")
      doc.setLineDashPattern([], 0)

      // FAULT label
      doc.setFont("courier", "bold")
      doc.setFontSize(5.5)
      doc.setTextColor(239, 68, 68)
      doc.text("FAULT", fx + 3, faultY + 5)

      // Fault name
      doc.setFont("courier", "bold")
      doc.setFontSize(7)
      doc.setTextColor(252, 165, 165)
      doc.text(truncatePdf(f.faultName || "GenericFault", 13), fx + 3, faultY + 10)

      // Action
      doc.setFont("courier", "normal")
      doc.setFontSize(6)
      doc.setTextColor(127, 29, 29)
      doc.text(f.action || "—", fx + 3, faultY + 14.5)
    })

    return NODE_H + FAULT_DROP + FAULT_NODE_H + 10
  }

  return NODE_H + 10
}

function truncatePdf(str, max) {
  if (!str) return ""
  return str.length > max ? str.slice(0, max - 1) + "…" : str
}