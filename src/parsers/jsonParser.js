/**
 * Parses raw integration metadata JSON (pasted by user).
 * Returns the same normalized shape as iarParser.js.
 * @param {string} rawJson - Raw JSON string from the paste panel
 * @returns {IntegrationMetadata} - Normalized metadata object
 */
export function parseJson(rawJson) {
    let data
  
    // 1. Parse
    try {
      data = JSON.parse(rawJson)
    } catch {
      throw new Error("Invalid JSON — check syntax and try again")
    }
  
    // 2. Must be an object, not array or primitive
    if (typeof data !== "object" || Array.isArray(data) || data === null) {
      throw new Error("JSON must be an object at the root level")
    }
  
    // 3. Normalize and return
    return {
      source: "json",
      fileName: null,
      integrationName: data.integrationName || data.name || "Unnamed Integration",
      version: data.version || "unknown",
      description: data.description || "",
      pattern: data.pattern || "unknown",
  
      triggers: normalizeArray(data.triggers).map(normalizeTrigger),
      invokes: normalizeArray(data.invokes || data.invoke).map(normalizeInvoke),
      faultHandlers: normalizeArray(data.faultHandlers || data.faults).map(normalizeFaultHandler),
      variables: normalizeArray(data.variables).map(normalizeVariable),
    }
  }
  
  // ─────────────────────────────────────────────
  // Field normalizers — mirror iarParser output
  // ─────────────────────────────────────────────
  
  function normalizeTrigger(item) {
    return {
      name: item.name || "unnamed",
      type: item.type || "unknown",
      connection: item.connection || null,
    }
  }
  
  function normalizeInvoke(item) {
    return {
      name: item.name || "unnamed",
      type: item.type || "unknown",
      connection: item.connection || null,
      operation: item.operation || null,
    }
  }
  
  function normalizeFaultHandler(item) {
    return {
      name: item.name || "unnamed",
      faultName: item.faultName || item.fault || null,
      action: item.action || "unknown",
    }
  }
  
  function normalizeVariable(item) {
    return {
      name: item.name || "unnamed",
      type: item.type || "unknown",
      scope: item.scope || "global",
    }
  }
  
  // Ensures a field is always a valid array regardless of input
  function normalizeArray(value) {
    if (Array.isArray(value)) return value
    if (value && typeof value === "object") return [value]
    return []
  }