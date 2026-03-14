import { useEffect }           from "react"
import { useIntegrationStore } from "./stores/integrationStore"
import AppShell                from "./components/layout/AppShell"
import UploadView              from "./views/UploadView"
import ResultsView             from "./views/ResultsView"

export default function App() {
  const currentView = useIntegrationStore((s) => s.currentView)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [currentView])

  return (
    <AppShell>
      {(() => {
        switch (currentView) {
          case "results": return <ResultsView />
          case "upload":
          default:        return <UploadView />
        }
      })()}
    </AppShell>
  )
}