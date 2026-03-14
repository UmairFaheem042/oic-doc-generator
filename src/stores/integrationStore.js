import { create } from "zustand"

function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.classList.add("light")
  } else {
    document.documentElement.classList.remove("light")
  }
}

const savedTheme = localStorage.getItem("oic-theme") || "dark"
applyTheme(savedTheme)

export const useIntegrationStore = create((set, get) => ({
  // Input
  inputMode: "file",
  rawFile:   null,
  rawJson:   "",

  // Processing
  status: "idle",
  error:  null,

  // Output
  parsedMetadata: null,

  // Theme
  theme: savedTheme,

  // Routing
  currentView:  "upload",
  viewHistory:  [],

  // Actions
  setInputMode: (mode) => set({ inputMode: mode }),
  setRawFile:   (file) => set({ rawFile: file }),
  setRawJson:   (json) => set({ rawJson: json }),

  setStatus: (status) => set({ status }),
  setError:  (error)  => set({ error, status: "error" }),

  setParsedMetadata: (data) =>
    set({ parsedMetadata: data, status: "ready", error: null }),

  // navigate(view)
  navigate: (view) => {
    const { currentView, viewHistory } = get()

    // Going back to upload always does a full reset
    if (view === "upload") {
      set({
        currentView:    "upload",
        viewHistory:    [],
        rawFile:        null,
        rawJson:        "",
        parsedMetadata: null,
        status:         "idle",
        error:          null,
      })
      return
    }

    set({
      currentView: view,
      viewHistory: [...viewHistory, currentView],
      error:       null,
    })
  },

  reset: () => {
    get().navigate("upload")
  },

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark"
    applyTheme(next)
    localStorage.setItem("oic-theme", next)
    set({ theme: next })
  },
}))