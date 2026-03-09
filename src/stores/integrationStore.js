import { create } from "zustand"

// Apply theme class to <html> immediately on store action
function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.classList.add("light")
  } else {
    document.documentElement.classList.remove("light")
  }
}

export const useIntegrationStore = create((set, get) => ({
  // ── Input
  inputMode: "file",
  rawFile:   null,
  rawJson:   "",

  // ── Processing
  status: "idle",
  error:  null,

  // ── Output
  parsedMetadata: null,

  // ── Theme
  theme: "dark",

  // ── Actions
  setInputMode: (mode) => set({ inputMode: mode }),
  setRawFile:   (file) => set({ rawFile: file }),
  setRawJson:   (json) => set({ rawJson: json }),

  setStatus: (status) => set({ status }),
  setError:  (error)  => set({ error, status: "error" }),

  setParsedMetadata: (data) =>
    set({ parsedMetadata: data, status: "ready", error: null }),

  reset: () =>
    set({
      rawFile:        null,
      rawJson:        "",
      parsedMetadata: null,
      status:         "idle",
      error:          null,
    }),

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark"
    applyTheme(next)
    set({ theme: next })
  },
}))