import { m, AnimatePresence } from "framer-motion"

export default function BullBearDebate({ bull, bear, isLoading }) {
  const sideClass = "flex-1 border-[5px] border-black p-6 shadow-[10px_10px_0px_rgba(0,0,0,1)]"

  if (isLoading) {
    return (
      <div className="mt-10 border-[5px] border-black bg-[#FFD700] p-8 shadow-[10px_10px_0px_rgba(0,0,0,1)] -rotate-1">
        <m.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 4, repeat: Infinity }}
          className="flex whitespace-nowrap"
        >
          {[...Array(8)].map((_, i) => (
            <span key={i} className="mx-6 font-black text-2xl uppercase text-black flex-none">
              ⚔️ SUMMONING AGENTS ⚔️ THE AI IS FIGHTING ITSELF ⚔️ PLEASE STAND BY ⚔️
            </span>
          ))}
        </m.div>
      </div>
    )
  }

  if (!bull && !bear) return null

  return (
    <AnimatePresence>
      <div className="mt-10">
        {/* DEBATE HEADER */}
        <div className="mb-4 border-[5px] border-black bg-black px-6 py-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] rotate-1">
          <h2 className="font-black text-3xl md:text-4xl uppercase text-white tracking-tight text-center">
            ⚔️ MULTI-AGENT DEBATE ⚔️
          </h2>
        </div>

        {/* SPLIT SCREEN */}
        <div className="flex flex-col md:flex-row gap-0 border-[5px] border-black shadow-[14px_14px_0px_rgba(0,0,0,1)]">

          {/* BULL SIDE */}
          <m.div
            initial={{ x: -300, opacity: 0, rotate: -6 }}
            animate={{ x: 0, opacity: 1, rotate: -1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className={`${sideClass} bg-[#00FFFF] md:border-r-[5px]`}
          >
            <div className="mb-5 border-b-[4px] border-black pb-3 flex items-center justify-between">
              <h3 className="font-black text-4xl text-black">🐂 THE BULL</h3>
              <span className="border-[3px] border-black bg-black px-3 py-1 font-mono font-black text-xs text-[#00FFFF] uppercase tracking-widest">LONG</span>
            </div>

            {/* Verdict stamp */}
            {bull?.verdict && (
              <div className="mb-5 border-[4px] border-black bg-black px-4 py-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <p className="font-black text-lg uppercase text-[#00FFFF] leading-tight">{bull.verdict}</p>
              </div>
            )}

            {/* Arguments */}
            <div className="space-y-3">
              {(bull?.arguments || []).map((arg, idx) => (
                <m.div
                  key={idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  className="flex items-start gap-3 border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_rgba(0,0,0,1)]"
                >
                  <span className="font-black text-green-600 flex-none text-xl">▲</span>
                  <p className="font-mono font-bold text-black text-sm leading-relaxed">{arg}</p>
                </m.div>
              ))}
            </div>
          </m.div>

          {/* BEAR SIDE */}
          <m.div
            initial={{ x: 300, opacity: 0, rotate: 6 }}
            animate={{ x: 0, opacity: 1, rotate: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className={`${sideClass} bg-[#FF0000]`}
          >
            <div className="mb-5 border-b-[4px] border-black pb-3 flex items-center justify-between">
              <h3 className="font-black text-4xl text-white">🐻 THE BEAR</h3>
              <span className="border-[3px] border-black bg-black px-3 py-1 font-mono font-black text-xs text-[#FF0000] uppercase tracking-widest">SHORT</span>
            </div>

            {/* Verdict stamp */}
            {bear?.verdict && (
              <div className="mb-5 border-[4px] border-black bg-black px-4 py-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <p className="font-black text-lg uppercase text-red-400 leading-tight">{bear.verdict}</p>
              </div>
            )}

            {/* Arguments */}
            <div className="space-y-3">
              {(bear?.arguments || []).map((arg, idx) => (
                <m.div
                  key={idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  className="flex items-start gap-3 border-[3px] border-black bg-black p-3 shadow-[3px_3px_0px_rgba(255,255,255,0.2)]"
                >
                  <span className="font-black text-red-400 flex-none text-xl">▼</span>
                  <p className="font-mono font-bold text-white text-sm leading-relaxed">{arg}</p>
                </m.div>
              ))}
            </div>
          </m.div>

        </div>
      </div>
    </AnimatePresence>
  )
}
