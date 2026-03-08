import { useEffect, useState } from "react"

export default function Toast({ message, onDone }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger enter
    const enterTimer = setTimeout(() => setVisible(true), 10)
    // Trigger exit
    const exitTimer  = setTimeout(() => setVisible(false), 2200)
    // Unmount after exit animation
    const doneTimer  = setTimeout(() => onDone(), 2700)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      style={{
        transform:  visible ? "translateY(0)"    : "translateY(12px)",
        opacity:    visible ? 1                  : 0,
        transition: "transform 0.25s ease, opacity 0.25s ease",
      }}
      className="
        fixed bottom-8 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-2 px-4 py-2.5
        bg-[#0e0e10] border border-[#ff8a00]
        rounded-lg shadow-lg shadow-black/40
        text-[12px] tracking-widest uppercase text-[#ff8a00]
        font-mono pointer-events-none select-none
      "
    >
      <CheckIcon />
      {message}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}