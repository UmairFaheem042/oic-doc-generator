import JSZip from "jszip"

export async function parseIar(file) {
  const zip = new JSZip()
  const contents = await zip.loadAsync(file)

  // 1. Load project.xml
  const projectFile = findProjectXml(contents)
  if (!projectFile) throw new Error("project.xml not found in archive")

  const projectXml  = await projectFile.async("string")
  const projectDom  = parseDom(projectXml)

  // 2. Load all appinstance XMLs (connections)
  const connections = await extractConnections(contents)

  // 3. Extract and return normalized metadata
  return extractMetadata(projectDom, connections, file.name)
}


// Locators
function findProjectXml(zip) {
  const path = Object.keys(zip.files).find((name) =>
    name.includes("PROJECT-INF/project.xml")
  )
  return path ? zip.files[path] : null
}

async function extractConnections(zip) {
  const paths = Object.keys(zip.files).filter(
    (name) => name.startsWith("icspackage/appinstances/") && name.endsWith(".xml")
  )

  const connections = {}

  for (const path of paths) {
    const text = await zip.files[path].async("string")
    const dom  = parseDom(text)

    const code        = getText(dom, "instanceCode")
    const displayName = getText(dom, "displayName")
    const adapterType = getText(dom, "applicationTypeRef")
    const role        = getText(dom, "integrationRole")   // SOURCE | TARGET
    const status      = getText(dom, "status")
    const security    = getText(dom, "securityPolicy")
    const url         = getConnectionProperty(dom, "connectionUrl")

    if (code) {
      connections[code] = { code, displayName, adapterType, role, status, security, url }
    }
  }

  return connections
}


// Metadata extraction
function extractMetadata(dom, connections, fileName) {
  return {
    source:          "iar",
    fileName,
    integrationName: getText(dom, "projectName")    || fileName.replace(".iar", ""),
    version:         getText(dom, "projectVersion") || "unknown",
    description:     getText(dom, "description")    || "",
    pattern:         dom.documentElement.getAttribute("modelType") || "unknown",
    percentComplete: getText(dom, "percentComplete") || "unknown",
    hasErrors:       getText(dom, "projectHasErrors") === "true",
    hasWarnings:     getText(dom, "projectHasWarnings") === "true",

    triggers:      extractTriggers(dom, connections),
    invokes:       extractInvokes(dom, connections),
    faultHandlers: extractFaultHandlers(dom),
    variables:     extractVariables(dom),
  }
}

// Triggers = applications with role "target" (they receive/trigger the flow)
function extractTriggers(dom, connections) {
  return getApplicationsByRole(dom, "target").map((app) => {
    const code       = getAdapterCode(app)
    const conn       = connections[code] || {}
    const inbound    = app.querySelector("inbound")
    const operation  = inbound ? getText(inbound, "operation") : null

    return {
      name:        getAdapterName(app),
      code,
      adapterType: getAdapterType(app),
      binding:     inbound ? inbound.getAttribute("name") : null,
      operation:   operation || "execute",
      connection:  conn.displayName || code || null,
      security:    conn.security    || null,
      status:      conn.status      || null,
    }
  })
}

// Invokes = applications with role "source" (they call external services)
function extractInvokes(dom, connections) {
  return getApplicationsByRole(dom, "source").map((app) => {
    const code      = getAdapterCode(app)
    const conn      = connections[code] || {}
    const outbound  = app.querySelector("outbound")
    const operation = outbound ? getText(outbound, "operation") : null
    const binding   = outbound ? getAdapterBinding(outbound) : null
    const url       = conn.url || null

    return {
      name:        getAdapterName(app),
      code,
      adapterType: getAdapterType(app),
      binding,
      operation:   operation || null,
      connection:  conn.displayName || code || null,
      security:    conn.security    || null,
      status:      conn.status      || null,
      url,
    }
  })
}

// Fault handlers = inputs with role "fault" across all applications
function extractFaultHandlers(dom) {
  return [...dom.querySelectorAll("input")]
    .filter((node) => {
      const roleEl = [...node.children].find(
        (child) => child.localName === "role"
      )
      return roleEl && roleEl.textContent.trim() === "fault"
    })
    .map((node) => {
      const subRoleEl = [...node.children].find(
        (child) => child.localName === "subRole"
      )
      return {
        name:      node.getAttribute("name") || "unnamed",
        faultName: subRoleEl ? subRoleEl.textContent.trim() : "GenericFault",
        action:    "catch",
      }
    })
}

// Variables = trackingVariables inside processor nodes
function extractVariables(dom) {
  return [...dom.querySelectorAll("trackingVariable")].map((node) => {
    const nameEl    = [...node.children].find((c) => c.localName === "name")
    const roleEl    = [...node.children].find((c) => c.localName === "role")
    const primaryEl = [...node.children].find((c) => c.localName === "primary")
    return {
      name:    nameEl    ? nameEl.textContent.trim()    : "unnamed",
      type:    "tracking",
      scope:   roleEl    ? roleEl.textContent.trim()    : "global",
      primary: primaryEl ? primaryEl.textContent.trim() === "true" : false,
    }
  })
}


// Helpers
function parseDom(xmlString) {
  const parser = new DOMParser()
  const dom    = parser.parseFromString(xmlString, "application/xml")
  const err    = dom.querySelector("parsererror")
  if (err) throw new Error("XML parse error: " + err.textContent)
  return dom
}

function getApplicationsByRole(dom, role) {
  
  return [...dom.querySelectorAll("application")].filter((app) => {
    const roleEl = [...app.children].find(
      (child) => child.localName === "role"
    )
    return roleEl && roleEl.textContent.trim() === role
  })
}

function getAdapterName(app) {
  const adapter = app.querySelector("adapter")
  return adapter ? getText(adapter, "name") || "unnamed" : "unnamed"
}

function getAdapterCode(app) {
  const adapter = app.querySelector("adapter")
  return adapter ? getText(adapter, "code") || null : null
}

function getAdapterType(app) {
  const adapter = app.querySelector("adapter")
  return adapter ? getText(adapter, "type") || "unknown" : "unknown"
}

function getAdapterBinding(outbound) {
  return getText(outbound, "binding") || null
}

function getConnectionProperty(dom, name) {
  const props = [...dom.querySelectorAll("connectionProperty")]
  const match = props.find((p) => getText(p, "name") === name)
  return match ? getText(match, "value") : null
}

// Safely gets trimmed text of first matching tag (namespace-agnostic)
function getText(node, tag) {
  const el = node.querySelector(tag)
  return el ? el.textContent.trim() : null
}


// Debug helper — remove after development
export async function debugIar(file) {
  const zip = new JSZip()
  const contents = await zip.loadAsync(file)
  console.log("=== IAR CONTENTS ===")
  Object.keys(contents.files).forEach((name) => console.log(name))

  const projectFile = findProjectXml(contents)
  if (projectFile) {
    console.log("=== project.xml ===")
    console.log(await projectFile.async("string"))
  }

  const appFiles = Object.keys(contents.files).filter(
    (n) => n.startsWith("icspackage/appinstances/") && n.endsWith(".xml")
  )
  for (const path of appFiles) {
    console.log(`=== ${path} ===`)
    console.log(await contents.files[path].async("string"))
  }
}