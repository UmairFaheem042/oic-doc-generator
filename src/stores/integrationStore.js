import { create } from "zustand"

export const useIntegrationStore = create((set) => ({
  // ── Input
  inputMode: "file",       // "file" | "json"
  rawFile: null,           // File object from upload
  rawJson: "",             // Raw string from paste panel

  // ── Processing
  status: "idle",          // "idle" | "parsing" | "ready" | "error"
  error: null,

  // ── Output
  parsedMetadata: null,    // Populated by parsers in Step 5

  // ── Actions
  setInputMode: (mode) => set({ inputMode: mode }),
  setRawFile: (file) => set({ rawFile: file }),
  setRawJson: (json) => set({ rawJson: json }),

  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: "error" }),

  setParsedMetadata: (data) =>
    set({ parsedMetadata: data, status: "ready", error: null }),

  reset: () =>
    set({
      rawFile: null,
      rawJson: "",
      parsedMetadata: null,
      status: "idle",
      error: null,
    }),
}))