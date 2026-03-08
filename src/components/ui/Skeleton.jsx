export default function Skeleton() {
    return (
      <div className="flex flex-col gap-10 animate-pulse">
  
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="h-2 w-24 rounded bg-[#161618]" />
          <div className="h-7 w-64 rounded bg-[#161618]" />
          <div className="h-2 w-48 rounded bg-[#161618]" />
        </div>
  
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[88px] rounded-xl bg-[#0c0c0e] border border-[#161618]">
              <div className="m-4 h-7 w-8 rounded bg-[#161618]" />
              <div className="mx-4 h-2 w-16 rounded bg-[#161618]" />
            </div>
          ))}
        </div>
  
        {/* Flow diagram placeholder */}
        <div className="h-[100px] rounded-xl bg-[#0c0c0e] border border-[#161618]" />
  
        {/* Table sections */}
        {[...Array(3)].map((_, si) => (
          <div key={si} className="flex flex-col gap-3">
            <div className="h-2 w-32 rounded bg-[#161618]" />
            <div className="h-px bg-[#161618]" />
            {[...Array(2)].map((_, ri) => (
              <div key={ri} className="flex gap-6">
                <div className="h-2 w-24 rounded bg-[#161618]" />
                <div className="h-2 w-32 rounded bg-[#161618]" />
                <div className="h-2 w-16 rounded bg-[#161618]" />
                <div className="h-2 w-20 rounded bg-[#161618]" />
              </div>
            ))}
          </div>
        ))}
  
      </div>
    )
  }