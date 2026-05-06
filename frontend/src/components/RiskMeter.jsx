import { m } from "framer-motion"

function getBgColor(score) {
  if (score >= 71) return "bg-[#FF0000]"
  if (score >= 40) return "bg-[#FFD700]"
  return "bg-[#39FF14]"
}

function getTextColor(score) {
  if (score >= 71) return "text-white"
  return "text-black"
}

export default function RiskMeter({ threatScore = 0, criticalWarning = "NO DATA", anomalies = [] }) {
  const isShaking = threatScore > 75

  return (
    <m.div
      animate={
        isShaking
          ? { x: [0, -2, 2, -1, 1, 0], y: [0, 1, -1, 2, -2, 0] }
          : {}
      }
      transition={
        isShaking
          ? { duration: 0.3, repeat: Infinity, ease: "linear" }
          : {}
      }
      className={`mt-10 border-[5px] border-black p-6 shadow-[10px_10px_0px_rgba(0,0,0,1)] rotate-1 ${getBgColor(threatScore)}`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between border-b-[4px] border-black pb-3 mb-4">
        <h3 className={`font-black text-2xl uppercase tracking-widest ${getTextColor(threatScore)}`}>
          THREAT LEVEL
        </h3>
        <div className={`border-[3px] border-black px-3 py-1 font-mono font-black text-sm ${
          threatScore >= 71 ? "bg-black text-[#FF0000]" : threatScore >= 40 ? "bg-black text-[#FFD700]" : "bg-black text-[#39FF14]"
        }`}>
          {threatScore >= 71 ? "CRITICAL" : threatScore >= 40 ? "ELEVATED" : "LOW"}
        </div>
      </div>

      {/* THE NUMBER */}
      <div className="flex items-center justify-center my-6">
        <span className={`font-mono font-black text-[10rem] leading-none ${getTextColor(threatScore)} select-none`}>
          {threatScore}
        </span>
      </div>

      {/* CRITICAL WARNING MARQUEE */}
      <div className="overflow-hidden border-[4px] border-black bg-white mb-4">
        <m.div
          animate={{ x: ["100%", "-100%"] }}
          transition={{ ease: "linear", duration: 8, repeat: Infinity }}
          className="whitespace-nowrap py-2 px-4"
        >
          <span className="font-black text-lg uppercase text-black tracking-wider">
            ⚠ {criticalWarning} ⚠ {criticalWarning} ⚠ {criticalWarning} ⚠
          </span>
        </m.div>
      </div>

      {/* ANOMALIES LIST */}
      {anomalies.length > 0 && (
        <div className="space-y-2">
          <h4 className={`font-black uppercase tracking-widest text-sm border-b-[3px] border-black pb-1 ${getTextColor(threatScore)}`}>
            ANOMALIES DETECTED
          </h4>
          {anomalies.map((anomaly, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 border-[3px] border-black bg-black px-3 py-2 font-mono text-sm font-bold text-[#00ff00] shadow-[3px_3px_0px_rgba(0,0,0,1)]"
            >
              <span className="text-red-500 flex-none">▸</span>
              {anomaly}
            </div>
          ))}
        </div>
      )}
    </m.div>
  )
}
