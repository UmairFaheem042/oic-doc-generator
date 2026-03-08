export default function EmptyState({ message = "None found" }) {
    return (
      <div className="flex items-center gap-3 py-4 px-2">
        <div className="w-px h-4 bg-[#1c1c1f]" />
        <p className="text-[12px] text-[#2a2a2c] tracking-widest italic font-mono">
          {message}
        </p>
      </div>
    )
  }