import { m } from "framer-motion"
import { Line, Doughnut } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend)

function parseValue(rawValue) {
  if (rawValue === null || rawValue === undefined) return null
  const normalized = String(rawValue).replace(/,/g, "").trim()
  const match = normalized.match(/(-?\$?\d+(?:\.\d+)?)([TMBK])?/i)
  if (!match) return null
  let value = Number(match[1].replace("$", ""))
  if (!Number.isFinite(value)) return null
  const multiplier = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[(match[2] || "").toUpperCase()]
  if (multiplier) value *= multiplier
  return value
}

function toScore(value, baseline) {
  if (value === null || baseline <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((Math.abs(value) / baseline) * 100)))
}

function infoCardColor(index) {
  const colors = ["bg-[#FFD700]", "bg-[#00FFFF]", "bg-[#FF69B4]", "bg-[#39FF14]"]
  return colors[index % colors.length]
}

export default function SignalDeck({ kpiData, riskData, extraKpiData, hasData }) {
  const revenue = parseValue(kpiData?.revenue)
  const netIncome = parseValue(kpiData?.net_income)
  const ebitda = parseValue(kpiData?.ebitda)
  const threat = Number(riskData?.threat_score || 0)

  const growthScore = toScore(revenue, 1e10)
  const profitabilityScore = toScore(netIncome, 2e9)
  const cashStrengthScore = toScore(ebitda, 5e9)
  const riskPressureScore = Math.max(0, Math.min(100, Math.round(threat)))

  const momentumLineData = {
    labels: ["T-3", "T-2", "T-1", "Now"],
    datasets: [
      {
        label: "Growth",
        data: [Math.max(0, growthScore - 18), Math.max(0, growthScore - 10), Math.max(0, growthScore - 4), growthScore],
        borderColor: "#FFD700",
        backgroundColor: "#FFD70033",
        tension: 0.35,
        borderWidth: 3,
      },
      {
        label: "Risk Pressure",
        data: [Math.max(0, riskPressureScore - 8), Math.max(0, riskPressureScore - 4), riskPressureScore, riskPressureScore],
        borderColor: "#FF4500",
        backgroundColor: "#FF450033",
        tension: 0.35,
        borderWidth: 3,
      },
    ],
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "#000", font: { family: "monospace", weight: "bold" } },
      },
      tooltip: { backgroundColor: "#000", titleFont: { family: "monospace" }, bodyFont: { family: "monospace" }, cornerRadius: 0 },
    },
    scales: {
      x: { ticks: { color: "#000", font: { family: "monospace", weight: "bold" } }, grid: { color: "#00000022" } },
      y: { ticks: { color: "#000", font: { family: "monospace", weight: "bold" } }, grid: { color: "#00000022" }, min: 0, max: 100 },
    },
  }

  const doughnutData = {
    labels: ["Growth", "Profitability", "Cash Strength", "Risk Pressure"],
    datasets: [
      {
        data: [growthScore, profitabilityScore, cashStrengthScore, riskPressureScore],
        backgroundColor: ["#FFD700", "#00FFFF", "#39FF14", "#FF4500"],
        borderColor: "#000000",
        borderWidth: 3,
      },
    ],
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "58%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#000", font: { family: "monospace", weight: "bold", size: 10 } },
      },
      tooltip: { backgroundColor: "#000", titleFont: { family: "monospace" }, bodyFont: { family: "monospace" }, cornerRadius: 0 },
    },
  }

  const signalCards = [
    { label: "Growth Signal", value: `${growthScore}/100` },
    { label: "Profitability Signal", value: `${profitabilityScore}/100` },
    { label: "Cash Strength", value: `${cashStrengthScore}/100` },
    { label: "Risk Pressure", value: `${riskPressureScore}/100` },
    ...Object.entries(extraKpiData || {}).slice(0, 4).map(([key, value]) => ({
      label: key.replace(/_/g, " ").toUpperCase(),
      value: String(value),
    })),
  ]

  return (
    <div className="mt-8 space-y-4">
      <div className="border-[5px] border-black bg-[#FFD700] p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] rotate-1">
        <h3 className="font-black text-2xl uppercase text-black">Expanded Signal Deck</h3>
      </div>

      {!hasData ? (
        <div className="border-[5px] border-black bg-white p-5 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <p className="font-mono text-sm font-bold uppercase text-black">Upload a report to unlock extra cards, charts, and intelligence panels.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            {signalCards.map((card, idx) => (
              <m.div
                key={`${card.label}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border-[4px] border-black p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] ${infoCardColor(idx)}`}
              >
                <p className="font-mono text-[11px] font-black uppercase text-black">{card.label}</p>
                <p className="mt-1 font-black text-lg uppercase text-black">{card.value}</p>
              </m.div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="border-[5px] border-black bg-white p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] -rotate-1">
              <h4 className="mb-3 border-b-[3px] border-black pb-2 font-black text-lg uppercase text-black">Momentum vs Risk Trend</h4>
              <div className="h-[240px]">
                <Line data={momentumLineData} options={lineOptions} />
              </div>
            </div>

            <div className="border-[5px] border-black bg-[#FDFBF7] p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] rotate-1">
              <h4 className="mb-3 border-b-[3px] border-black pb-2 font-black text-lg uppercase text-black">Signal Composition</h4>
              <div className="h-[240px]">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

