import jsPDF from "jspdf"
import { analyze } from "../analyzers/integrationAnalyzer"

// LIGHT MODE PDF
const THEME = {
  bg:          [255, 255, 255],
  bgCard:      [248, 247, 244],
  bgBadgeGood: [240, 253, 244],
  bgBadgePri:  [255, 251, 235],
  border:      [221, 219, 212],
  accent:      [217, 119,   6],
  textPrimary: [ 26,  25,  22],
  textMuted:   [ 87,  83,  78],
  textDim:     [168, 162, 158],
  textGreen:   [ 22, 163,  74],
  white:       [255, 255, 255],
}

const PAGE_W    = 210
const PAGE_H    = 297
const MARGIN    = 14
const CONTENT_W = PAGE_W - MARGIN * 2

export function generatePdf(metadata) {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  let y = 0

  // Page setup 
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

  // Drawing primitives 
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

  // PAGE 1 — Header
  drawPageBg()
  drawAccentLine()
  y = MARGIN + 6

  setFont("normal", 7)
  text("ORACLE INTEGRATION CLOUD", MARGIN, y, THEME.accent)
  y += 5

  setFont("bold", 22)
  text(metadata.integrationName, MARGIN, y, THEME.textPrimary)
  y += 3

  setFont("normal", 8)
  const subtitle = `v${metadata.version}  ·  ${metadata.pattern}  ·  ${metadata.percentComplete}% complete`
  text(subtitle, MARGIN, y + 4, THEME.textDim)
  y += 10

  if (!metadata.hasErrors)   badge("NO ERRORS",   MARGIN,      y, THEME.bgBadgeGood, THEME.textGreen)
  if (!metadata.hasWarnings) badge("NO WARNINGS",  MARGIN + 22, y, THEME.bgBadgeGood, THEME.textGreen)
  y += 8

  hLine(y)
  y += 8

  // Summary cards
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
  

  // Analysis 
y += 4
checkPageBreak(16)
setFont("bold", 9)
text("ANALYSIS", MARGIN, y, THEME.textPrimary)
y += 2
hLine(y)
y += 6

const findings = analyze(metadata)

if (findings.length === 0) {
  setFont("normal", 8)
  text("No issues found — integration looks good.", MARGIN, y, THEME.textDim)
  y += 8
} else {
  const SEVERITY_STYLES = {
    risk:       { label: "RISK",       color: [220,  38,  38], bg: [255, 245, 245] },
    suggestion: { label: "SUGGESTION", color: [217, 119,   6], bg: [255, 251, 235] },
    info:       { label: "INFO",       color: [ 87,  83,  78], bg: [245, 244, 240] },
  }

  findings.forEach((finding) => {
    checkPageBreak(18)

    const cfg     = SEVERITY_STYLES[finding.severity]
    const badgeW  = finding.severity === "suggestion" ? 22 : 10

    // Row background
    doc.setFillColor(...cfg.bg)
    doc.roundedRect(MARGIN, y - 4, CONTENT_W, 14, 1.5, 1.5, "F")

    // Severity badge
    setFont("bold", 6.5)
    const badgePad = 3
    const bw = doc.getTextWidth(cfg.label) + badgePad * 2
    doc.setFillColor(...cfg.color)
    doc.roundedRect(MARGIN + 3, y - 2.5, bw, 5, 1, 1, "F")
    // doc.setTextColor(8, 8, 9)
    doc.setTextColor(255, 255, 255) 
    doc.text(cfg.label, MARGIN + 3 + badgePad, y + 1.2)

    // Title
    setFont("bold", 8.5)
    doc.setTextColor(...THEME.textPrimary)
    doc.text(
      truncatePdf(finding.title, 60),
      MARGIN + bw + 7,
      y + 1
    )

    // Detail — on next line
    setFont("normal", 7.5)
    doc.setTextColor(...THEME.textMuted)
    const detailLines = doc.splitTextToSize(finding.detail, CONTENT_W - 6)
    detailLines.slice(0, 2).forEach((line, li) => {
      checkPageBreak(6)
      doc.text(line, MARGIN + 3, y + 7 + li * 5)
    })

    // Affected tags
    if (finding.affected && finding.affected.length > 0) {
      const tagsY   = y + 7 + Math.min(detailLines.length, 2) * 5
      let   tagX    = MARGIN + 3
      setFont("normal", 6)
      finding.affected.slice(0, 5).forEach((name) => {
        const tw = doc.getTextWidth(name) + 6
        if (tagX + tw > PAGE_W - MARGIN) return
        doc.setFillColor(...THEME.border)
        doc.roundedRect(tagX, tagsY - 2.5, tw, 4.5, 1, 1, "F")
        doc.setTextColor(...THEME.textDim)
        doc.text(name, tagX + 3, tagsY + 1)
        tagX += tw + 3
      })
      y += tagsY - y + 8
    } else {
      y += 7 + Math.min(detailLines.length, 2) * 5 + 4
    }

    y += 4
  })
}

hLine(y)
y += 10


  // Section helpers
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
      doc.setFillColor(255, 255, 255)
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

  // Data sections
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

  // Footer — after all pages are built
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

  // Save
  const filename = `${metadata.integrationName.replace(/\s+/g, "_")}_docs.pdf`
  doc.save(filename)
}

function truncatePdf(str, max) {
  if (!str) return ""
  return str.length > max ? str.slice(0, max - 1) + "…" : str
}