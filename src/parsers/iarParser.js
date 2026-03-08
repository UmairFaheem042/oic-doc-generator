import JSZip from "jszip"

/**
 * Parses an OIC .iar file and extracts integration metadata.
 * @param {File} file - The .iar File object from the upload input
 * @returns {Promise<IntegrationMetadata>} - Normalized metadata object
 */
export async function parseIar(file) {
  const zip = new JSZip()
  const contents = await zip.loadAsync(file)

  // 1. Locate the integration descriptor XML inside the archive
  const descriptorFile = findDescriptor(contents)
  if (!descriptorFile) {
    throw new Error("No integration descriptor found in .iar archive")
  }

  // 2. Extract raw XML string
  const xmlString = await descriptorFile.async("string")

  // 3. Parse XML → DOM
  const parser = new DOMParser()
  const xml = parser.parseFromString(xmlString, "application/xml")

  const parseError = xml.querySelector("parsererror")
  if (parseError) {
    throw new Error("Failed to parse integration XML: " + parseError.textContent)
  }

  // 4. Extract and return normalized metadata
  return extractMetadata(xml, file.name)
}

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

/**
 * Finds the main integration descriptor inside the ZIP.
 * OIC archives typically place it at:
 *   ics/metadata/integration/<name>.xml  or  descriptor.xml at root
 */
function findDescriptor(zip) {
  const candidates = Object.keys(zip.files).filter(
    (name) =>
      !zip.files[name].dir &&
      name.endsWith(".xml") &&
      (name.includes("integration") || name === "descriptor.xml")
  )

  if (candidates.length === 0) return null

  // Prefer the most deeply nested match (most specific)
  candidates.sort((a, b) => b.split("/").length - a.split("/").length)
  return zip.files[candidates[0]]
}

/**
 * Walks the parsed XML DOM and extracts all relevant fields.
 */
function extractMetadata(xml, fileName) {
  return {
    source: "iar",
    fileName,
    integrationName: getText(xml, "name") || fileName.replace(".iar", ""),
    version: getText(xml, "version") || "unknown",
    description: getText(xml, "description") || "",
    pattern: getText(xml, "pattern") || "unknown",

    triggers: extractTriggers(xml),
    invokes: extractInvokes(xml),
    faultHandlers: extractFaultHandlers(xml),
    variables: extractVariables(xml),
  }
}

function extractTriggers(xml) {
  return [...xml.querySelectorAll("trigger")].map((node) => ({
    name: node.getAttribute("name") || getText(node, "name") || "unnamed",
    type: node.getAttribute("type") || getText(node, "type") || "unknown",
    connection: node.getAttribute("connection") || getText(node, "connection") || null,
  }))
}

function extractInvokes(xml) {
  return [...xml.querySelectorAll("invoke")].map((node) => ({
    name: node.getAttribute("name") || getText(node, "name") || "unnamed",
    type: node.getAttribute("type") || getText(node, "type") || "unknown",
    connection: node.getAttribute("connection") || getText(node, "connection") || null,
    operation: node.getAttribute("operation") || getText(node, "operation") || null,
  }))
}

function extractFaultHandlers(xml) {
  return [...xml.querySelectorAll("faultHandler, fault-handler, catch")].map((node) => ({
    name: node.getAttribute("name") || getText(node, "name") || "unnamed",
    faultName: node.getAttribute("faultName") || getText(node, "faultName") || null,
    action: node.getAttribute("action") || getText(node, "action") || "unknown",
  }))
}

function extractVariables(xml) {
  return [...xml.querySelectorAll("variable")].map((node) => ({
    name: node.getAttribute("name") || getText(node, "name") || "unnamed",
    type: node.getAttribute("type") || getText(node, "type") || "unknown",
    scope: node.getAttribute("scope") || getText(node, "scope") || "global",
  }))
}

// Safely gets trimmed text content of first matching tag
function getText(node, tag) {
  const el = node.querySelector(tag)
  return el ? el.textContent.trim() : null
}