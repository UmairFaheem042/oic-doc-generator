const SEVERITY_ORDER = { risk: 0, suggestion: 1, info: 2 }

export function analyze(metadata) {
  const findings = []

  function risk(title, detail, affected = []) {
    findings.push({ severity: "risk", title, detail, affected })
  }
  function suggestion(title, detail, affected = []) {
    findings.push({ severity: "suggestion", title, detail, affected })
  }
  function info(title, detail, affected = []) {
    findings.push({ severity: "info", title, detail, affected })
  }

  const { triggers, invokes, faultHandlers, variables } = metadata

  // Fault handler coverage
  if (invokes.length > 0 && faultHandlers.length === 0) {
    risk(
      "No fault handlers defined",
      `This integration has ${invokes.length} invoke connection${invokes.length > 1 ? "s" : ""} but no fault handlers. Unhandled errors will cause the integration to fail silently.`,
      invokes.map((i) => i.name)
    )
  }

  if (invokes.length > faultHandlers.length && faultHandlers.length > 0) {
    suggestion(
      "Partial fault handler coverage",
      `${faultHandlers.length} fault handler${faultHandlers.length > 1 ? "s" : ""} defined for ${invokes.length} invoke connections. Consider adding a generic fault handler to catch uncovered failures.`
    )
  }

  // Security policies
  const unsecuredInvokes = invokes.filter(
    (i) => !i.security || i.security === "NONE" || i.security === "none"
  )
  if (unsecuredInvokes.length > 0) {
    risk(
      "Unsecured outbound connections",
      `${unsecuredInvokes.length} invoke connection${unsecuredInvokes.length > 1 ? "s have" : " has"} no security policy. Outbound calls should use at minimum BASIC_AUTH.`,
      unsecuredInvokes.map((i) => i.name)
    )
  }

  const basicAuthInvokes = invokes.filter(
    (i) => i.security && i.security.toUpperCase().includes("BASIC")
  )
  if (basicAuthInvokes.length > 0) {
    suggestion(
      "BASIC_AUTH in use on outbound connections",
      `${basicAuthInvokes.length} connection${basicAuthInvokes.length > 1 ? "s use" : " uses"} BASIC_AUTH. Consider upgrading to OAuth 2.0 where the target system supports it.`,
      basicAuthInvokes.map((i) => i.name)
    )
  }

  // Triggers
  if (triggers.length === 0) {
    risk(
      "No trigger defined",
      "This integration has no inbound trigger. It cannot be invoked or scheduled without one."
    )
  }

  if (triggers.length > 1) {
    info(
      "Multiple triggers defined",
      `${triggers.length} triggers are defined. Verify this is intentional — most OIC patterns use a single trigger.`,
      triggers.map((t) => t.name)
    )
  }

  // Tracking variables
  const primaryVars = variables.filter((v) => v.primary)
  if (variables.length > 0 && primaryVars.length === 0) {
    suggestion(
      "No primary tracking variable set",
      "Tracking variables exist but none are marked as primary. Setting a primary variable improves observability in the OIC monitoring dashboard."
    )
  }

  if (variables.length === 0) {
    info(
      "No tracking variables defined",
      "Adding tracking variables makes it easier to trace integration instances in the OIC monitoring console."
    )
  }

  // Description
  if (!metadata.description || metadata.description.trim() === "") {
    suggestion(
      "No integration description provided",
      "A clear description improves documentation quality and helps other developers understand the integration's purpose at a glance."
    )
  }

  // Completion status
  const pct = parseInt(metadata.percentComplete, 10)
  if (!isNaN(pct) && pct < 100) {
    risk(
      `Integration is ${pct}% complete`,
      `This integration is not fully configured. Incomplete integrations may fail at activation or runtime.`
    )
  }
  // Errors and warnings
  if (metadata.hasErrors) {
    risk(
      "Integration has reported errors",
      "The OIC metadata indicates this integration has validation errors. Review the integration in the OIC console before activating."
    )
  }

  if (metadata.hasWarnings) {
    suggestion(
      "Integration has reported warnings",
      "The OIC metadata indicates warnings are present. These may not block activation but should be reviewed."
    )
  }

  // Adapter diversity
  const adapterTypes = [
    ...new Set([
      ...triggers.map((t) => t.adapterType),
      ...invokes.map((i)  => i.adapterType),
    ].filter(Boolean))
  ]
  if (adapterTypes.length > 0) {
    info(
      `Adapter types in use`,
      `This integration uses ${adapterTypes.length} adapter type${adapterTypes.length > 1 ? "s" : ""}: ${adapterTypes.join(", ")}.`
    )
  }

  // Pattern info
  if (metadata.pattern) {
    const patternDescriptions = {
      APP_DRIVEN_ORCHESTRATION: "App-driven orchestration — triggered by an inbound request and processes data synchronously.",
      SCHEDULED_ORCHESTRATION:  "Scheduled orchestration — runs on a timer and is not triggered by external requests.",
      FILE_TRANSFER:            "File transfer pattern — moves files between systems.",
      BASIC_ROUTING:            "Basic routing — routes a message from a trigger to a single invoke.",
      PUBLISH_TO_OIC:           "Publish to OIC — publishes events to the OIC event framework.",
      SUBSCRIBE_TO_OIC:         "Subscribe to OIC — subscribes to events from the OIC event framework.",
    }
    const desc = patternDescriptions[metadata.pattern]
    if (desc) {
      info(`Pattern: ${metadata.pattern}`, desc)
    }
  }

  // Sort by severity
  return findings.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  )
}