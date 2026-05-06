import { m } from "framer-motion"
import { Radar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js"

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip)

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function parseFinancialValue(rawValue) {
  if (!rawValue || rawValue === "N/A") return null

  const normalized = String(rawValue).replace(/,/g, "").trim()
  const match = normalized.match(/(-?\$?\d+(?:\.\d+)?)([TMBK])?/i)
  if (!match) return null

  let value = Number(match[1].replace("$", ""))
  if (!Number.isFinite(value)) return null

  const multiplier = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[(match[2] || "").toUpperCase()]
  if (multiplier) value *= multiplier
  return value
}

function parsePercent(rawValue) {
  if (!rawValue || rawValue === "N/A") return null
  const match = String(rawValue).match(/-?\d+(?:\.\d+)?/)
  if (!match) return null
  const value = Number(match[0])
  if (!Number.isFinite(value)) return null
  return clamp(Math.round(value), 0, 100)
}

function toMagnitudeScore(value, reference) {
  if (value === null || reference <= 0) return null
  const ratio = Math.abs(value) / reference
  return clamp(Math.round(ratio * 100), 0, 100)
}

function deriveScores(kpiData, riskData) {
  const momentum = toMagnitudeScore(parseFinancialValue(kpiData?.revenue), 1e10)
  const liquidity = toMagnitudeScore(parseFinancialValue(kpiData?.ebitda), 5e9)
  const volatilityRaw = Number(riskData?.threat_score)
  const volatility = Number.isFinite(volatilityRaw) ? clamp(Math.round(volatilityRaw), 0, 100) : null
  const innovation = parsePercent(kpiData?.op_margin)
  const fear = volatility

  return {
    momentum,
    liquidity,
    volatility,
    innovation,
    fear,
    hasRealData: [momentum, liquidity, volatility, innovation, fear].some((value) => value !== null),
  }
}

function EkgLine({ hasData }) {
  const flatline = "M0,30 L40,30 L50,30 L55,5 L60,55 L65,20 L70,30 L120,30"

  return (
    <div className="border-[4px] border-black bg-black p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] rotate-1">
      <div className="mb-2 flex items-center gap-2">
        <m.div
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.4, repeat: Infinity }}
          className="h-3 w-3 rounded-full border-[2px] border-[#00ff00] bg-[#00ff00]"
        />
        <span className="font-mono font-black text-[10px] uppercase tracking-widest text-[#00ff00]">
          {hasData ? "MARKET PULSE - LIVE" : "MARKET PULSE - WAITING FOR REPORT"}
        </span>
      </div>
      <svg viewBox="0 0 400 60" className="h-12 w-full" preserveAspectRatio="none">
        <line x1="0" y1="30" x2="400" y2="30" stroke="#004400" strokeWidth="1" />
        {[0, 130, 260].map((offset) => (
          <m.path
            key={offset}
            d={flatline}
            fill="none"
            stroke="#00ff00"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`translate(${offset}, 0)`}
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: [0, 1], opacity: [1, 1, 0] }}
            transition={{ duration: 1.8, ease: "easeInOut", delay: offset * 0.004, repeat: Infinity }}
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between">
        {["MOMENTUM", "LIQUIDITY", "RISK", "MARGIN"].map((label) => (
          <span key={label} className="font-mono font-black text-[9px] uppercase text-[#00ff00]/60">
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

function SentimentRadar({ scores }) {
  const data = {
    labels: ["MOMENTUM", "LIQUIDITY", "VOLATILITY", "INNOVATION", "FEAR"],
    datasets: [
      {
        label: "Derived Metrics",
        data: scores,
        backgroundColor: "rgba(255, 105, 180, 0.25)",
        borderColor: "#FF69B4",
        borderWidth: 3,
        pointBackgroundColor: "#FFD700",
        pointBorderColor: "#000",
        pointBorderWidth: 2,
        pointRadius: 5,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#000",
        titleFont: { family: "monospace" },
        bodyFont: { family: "monospace" },
        cornerRadius: 0,
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { display: false },
        grid: { color: "#00000033", lineWidth: 2 },
        pointLabels: {
          font: { family: "monospace", weight: "bold", size: 10 },
          color: "#000",
        },
      },
    },
  }

  return <Radar data={data} options={options} />
}

export default function MarketPulse({ hasData, kpiData, riskData }) {
  const derived = deriveScores(kpiData, riskData)
  const scores = [
    derived.momentum ?? 0,
    derived.liquidity ?? 0,
    derived.volatility ?? 0,
    derived.innovation ?? 0,
    derived.fear ?? 0,
  ]

  return (
    <div className="mt-6 space-y-4">
      <EkgLine hasData={hasData && derived.hasRealData} />

      <div className="-rotate-1 border-[4px] border-black bg-[#FDFBF7] p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-black text-sm uppercase tracking-widest text-black">SENTIMENT RADAR</h4>
          <m.span
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="text-xl"
          >
            ++
          </m.span>
        </div>

        {hasData && derived.hasRealData ? (
          <>
            <div className="h-[200px]">
              <SentimentRadar scores={scores} />
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1">
              {["MOM", "LIQ", "VOL", "INN", "FEAR"].map((label, idx) => (
                <div key={label} className="border-[3px] border-black bg-[#FF69B4] p-1 text-center">
                  <span className="block font-mono text-[9px] font-black uppercase text-black">{label}</span>
                  <span className="font-mono text-sm font-black text-black">{scores[idx]}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="border-[3px] border-dashed border-black bg-white px-4 py-8 text-center">
            <p className="font-mono text-xs font-bold uppercase text-black">
              Upload a report to compute live pulse metrics from extracted KPIs and risk analysis.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
