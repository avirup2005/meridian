import { m, AnimatePresence } from "framer-motion"

export default function RealityCheck({ checks, isLoading }) {
  if (isLoading) {
    return (
      <div className="mt-10 border-[5px] border-black bg-[#FFD700] p-6 shadow-[10px_10px_0px_rgba(0,0,0,1)] rotate-1">
        <div className="flex items-center gap-3">
          <m.div
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.4, repeat: Infinity }}
            className="h-5 w-5 bg-red-600 flex-none border-[3px] border-black"
          />
          <p className="font-black text-2xl uppercase text-black">FACT CHECKING AGAINST LIVE WEB...</p>
        </div>
      </div>
    )
  }

  if (!checks || checks.length === 0) return null

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 16 }}
        className="mt-10"
      >
        {/* HEADER TICKER */}
        <div className="overflow-hidden border-[5px] border-black bg-[#FFD700] shadow-[10px_10px_0px_rgba(0,0,0,1)] -rotate-1">
          <div className="flex items-center border-b-[5px] border-black px-4 py-2 gap-3">
            <m.div
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
              className="h-4 w-4 bg-red-600 flex-none border-[2px] border-black"
            />
            <span className="font-black text-lg uppercase tracking-widest text-black">LIVE REALITY CHECK</span>
            <m.div
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.4, repeat: Infinity, ease: "linear", delay: 0.2 }}
              className="h-4 w-4 bg-red-600 flex-none border-[2px] border-black"
            />
          </div>

          <div className="space-y-0">
            {checks.map((check, idx) => (
              <m.div
                key={idx}
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.2 }}
                className="border-b-[4px] border-black last:border-b-0"
              >
                {/* Claim from PDF */}
                <div className="flex items-start gap-3 border-b-[3px] border-black bg-white px-4 py-3">
                  <span className="font-mono font-black text-xs uppercase text-black bg-[#FFD700] border-[2px] border-black px-2 py-1 flex-none">PDF CLAIM</span>
                  <p className="font-mono font-bold text-sm text-black leading-relaxed">{check.claim}</p>
                </div>
                {/* Reality from web */}
                <div className={`flex items-start gap-3 px-4 py-3 ${check.status === "CONFIRMED" ? "bg-[#39FF14]" : check.status === "DISPUTED" ? "bg-[#FF0000]" : "bg-[#FF4500]"}`}>
                  <span className={`font-mono font-black text-xs uppercase border-[2px] border-black px-2 py-1 flex-none whitespace-nowrap ${check.status === "CONFIRMED" ? "bg-black text-[#39FF14]" : "bg-black text-white"}`}>
                    {check.status}
                  </span>
                  <p className="font-mono font-bold text-sm text-black leading-relaxed">{check.reality}</p>
                  {check.source && (
                    <a href={check.source} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase underline text-black flex-none ml-auto">SRC →</a>
                  )}
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </m.div>
    </AnimatePresence>
  )
}
