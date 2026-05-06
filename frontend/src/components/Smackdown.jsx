import { m, AnimatePresence } from "framer-motion"

function StatRow({ label, valA, valB, winner }) {
  return (
    <div className="grid grid-cols-3 border-b-[3px] border-black last:border-b-0">
      <div className={`border-r-[3px] border-black p-3 font-mono font-bold text-sm text-black ${winner === "A" ? "bg-[#FFD700]" : "bg-white"}`}>
        <p className="font-black">{valA}</p>
        {winner === "A" && <span className="text-[10px] uppercase tracking-widest font-black text-black">▲ WINNER</span>}
      </div>
      <div className="p-3 bg-black flex items-center justify-center border-r-[3px] border-black">
        <p className="font-black text-[10px] uppercase tracking-widest text-center text-white leading-tight">{label}</p>
      </div>
      <div className={`p-3 font-mono font-bold text-sm text-black ${winner === "B" ? "bg-[#FF69B4]" : "bg-white"}`}>
        <p className="font-black">{valB}</p>
        {winner === "B" && <span className="text-[10px] uppercase tracking-widest font-black text-black">▲ WINNER</span>}
      </div>
    </div>
  )
}

export default function Smackdown({ companyA, companyB, comparison, isLoading }) {
  if (isLoading) {
    return (
      <div className="mt-10 border-[5px] border-black bg-[#FF69B4] p-8 shadow-[10px_10px_0px_rgba(0,0,0,1)] rotate-1">
        <m.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 3, repeat: Infinity }}
          className="flex whitespace-nowrap"
        >
          {[...Array(8)].map((_, i) => (
            <span key={i} className="mx-6 font-black text-2xl uppercase text-black flex-none">
              ⚡ LOADING FIGHTER DATA ⚡ PREPARING SMACKDOWN ⚡ DO NOT LOOK AWAY ⚡
            </span>
          ))}
        </m.div>
      </div>
    )
  }

  if (!comparison) return null

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 16 }}
        className="mt-10"
      >
        {/* HEADER */}
        <div className="border-[5px] border-black bg-[#FF69B4] py-5 px-6 shadow-[10px_10px_0px_rgba(0,0,0,1)] -rotate-1 mb-1">
          <h2 className="font-black text-4xl md:text-5xl uppercase text-black text-center tracking-tight">
            ⚡ SMACKDOWN MODE ⚡
          </h2>
        </div>

        {/* FIGHTER NAMES */}
        <div className="grid grid-cols-3 border-[5px] border-black shadow-[10px_10px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#FFD700] border-r-[5px] border-black p-5 text-center">
            <p className="font-black text-3xl uppercase text-black">{companyA || "CORP A"}</p>
            <p className="font-mono font-bold text-xs text-black mt-1 uppercase tracking-wider">CHALLENGER</p>
          </div>
          <div className="bg-black p-5 text-center flex items-center justify-center">
            <p className="font-black text-4xl text-white">VS</p>
          </div>
          <div className="bg-[#FF69B4] border-l-[5px] border-black p-5 text-center">
            <p className="font-black text-3xl uppercase text-black">{companyB || "CORP B"}</p>
            <p className="font-mono font-bold text-xs text-black mt-1 uppercase tracking-wider">CHALLENGER</p>
          </div>
        </div>

        {/* STATS TABLE */}
        <div className="border-x-[5px] border-b-[5px] border-black shadow-[10px_10px_0px_rgba(0,0,0,1)]">
          {(comparison?.metrics || []).map((metric, idx) => (
            <StatRow key={idx} label={metric.label} valA={metric.value_a} valB={metric.value_b} winner={metric.winner} />
          ))}
        </div>

        {/* OVERALL VERDICT */}
        {comparison?.verdict && (
          <m.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 2 }}
            transition={{ type: "spring", stiffness: 300, damping: 14 }}
            className="mt-4 border-[5px] border-black bg-black p-6 shadow-[10px_10px_0px_rgba(0,0,0,1)]"
          >
            <p className="font-black text-xl uppercase text-[#FFD700] text-center">{comparison.verdict}</p>
          </m.div>
        )}
      </m.div>
    </AnimatePresence>
  )
}
