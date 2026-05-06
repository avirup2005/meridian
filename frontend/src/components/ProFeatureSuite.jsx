import { useMemo, useState } from "react"
import { m } from "framer-motion"
import { Bar, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js"
import { fetchValuationQuickPack, exportProfessionalPack } from "../api"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend)

function parseNumeric(raw) {
  if (!raw && raw !== 0) return null
  const m = String(raw).replace(/,/g, "").match(/-?\d+(\.\d+)?/)
  if (!m) return null
  const n = Number(m[0])
  return Number.isFinite(n) ? n : null
}

export default function ProFeatureSuite({
  uploadDone,
  kpiData,
  riskData,
  riskFactors,
  professionalPack,
  previousSnapshot,
  currentSnapshot,
}) {
  const [growthAssumption, setGrowthAssumption] = useState(12)
  const [marginAssumption, setMarginAssumption] = useState(18)
  const [waccAssumption, setWaccAssumption] = useState(11)
  const [marketShareAssumption, setMarketShareAssumption] = useState(6)
  const [pricingAssumption, setPricingAssumption] = useState(4)
  const [peerInput, setPeerInput] = useState("")
  const [peers, setPeers] = useState([])
  const [actions, setActions] = useState([])
  const [newAction, setNewAction] = useState("")
  const [valuationData, setValuationData] = useState(null)
  const [exportBlob, setExportBlob] = useState("")
  const [isBusy, setIsBusy] = useState(false)

  const confidence = Number(professionalPack?.executive_view?.confidence_score || 0)
  const quality = Number(professionalPack?.data_quality?.completeness_score || 0)
  const threat = Number(riskData?.threat_score || 0)

  const earlyWarnings = useMemo(() => {
    const warnings = []
    if (threat >= 70) warnings.push({ level: "HIGH", text: "Threat score is critical. Escalate to IC immediately." })
    if ((riskData?.anomalies || []).length >= 2) warnings.push({ level: "MED", text: "Multiple anomalies detected. Start forensic review." })
    if ((riskFactors || []).length >= 4) warnings.push({ level: "MED", text: "Risk factor density is elevated vs normal filings." })
    if (warnings.length === 0 && uploadDone) warnings.push({ level: "LOW", text: "No immediate critical warning triggers." })
    return warnings
  }, [threat, riskData, riskFactors, uploadDone])

  const icMode = useMemo(() => {
    const yes = (confidence >= 65 ? 2 : 1) + (threat <= 45 ? 2 : threat <= 65 ? 1 : 0)
    const no = (threat >= 70 ? 2 : 1) + (confidence <= 45 ? 2 : 0)
    const hold = 5 - Math.min(4, yes + no)
    const verdict = yes > no ? "APPROVE" : no > yes ? "REJECT" : "HOLD"
    return { yes, no, hold, verdict }
  }, [confidence, threat])

  const diffRows = useMemo(() => {
    if (!previousSnapshot || !currentSnapshot) return []
    const keys = ["revenue", "net_income", "ebitda", "op_margin", "churn", "cac", "threat_score"]
    return keys.map((k) => {
      const prev = previousSnapshot[k]
      const curr = currentSnapshot[k]
      const prevN = parseNumeric(prev)
      const currN = parseNumeric(curr)
      let delta = "N/A"
      if (prevN !== null && currN !== null && prevN !== 0) delta = `${(((currN - prevN) / Math.abs(prevN)) * 100).toFixed(1)}%`
      return { key: k, prev: prev ?? "N/A", curr: curr ?? "N/A", delta }
    })
  }, [previousSnapshot, currentSnapshot])

  const scenarioBase = Math.max(10, parseNumeric(kpiData?.revenue) || 100)
  const scenarioSeries = [
    Math.round((scenarioBase * (1 + (growthAssumption - 5) / 100)) * (1 + pricingAssumption / 100)),
    Math.round((scenarioBase * (1 + growthAssumption / 100)) * (1 + pricingAssumption / 100)),
    Math.round((scenarioBase * (1 + (growthAssumption + 6) / 100)) * (1 + (pricingAssumption + 1) / 100)),
  ]

  async function runValuation() {
    setIsBusy(true)
    try {
      const res = await fetchValuationQuickPack()
      if (res.status === "success") setValuationData(res.valuation)
    } finally {
      setIsBusy(false)
    }
  }

  async function runExport() {
    if (!professionalPack) return
    setIsBusy(true)
    try {
      const res = await exportProfessionalPack(professionalPack, "markdown")
      if (res.status === "success") setExportBlob(res.content)
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="mt-10 space-y-3">
      <div className="border-[5px] border-black bg-[#00FFFF] p-4 shadow-[10px_10px_0px_rgba(0,0,0,1)] rotate-1">
        <h2 className="font-black text-3xl uppercase text-black">Pro Feature Suite</h2>
      </div>

      {!uploadDone ? (
        <div className="border-[4px] border-black bg-white p-4 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
          <p className="font-mono text-sm font-bold uppercase text-black">Upload report to unlock advanced professional toolkit.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="border-[4px] border-black bg-[#FDFBF7] p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
              <h3 className="mb-2 font-black text-lg uppercase">Assumption Lab</h3>
              <div className="grid gap-2 md:grid-cols-2">
                {[
                  ["Growth %", growthAssumption, setGrowthAssumption, 0, 40],
                  ["Margin %", marginAssumption, setMarginAssumption, 0, 50],
                  ["WACC %", waccAssumption, setWaccAssumption, 5, 25],
                  ["Market Share %", marketShareAssumption, setMarketShareAssumption, 1, 20],
                  ["Pricing %", pricingAssumption, setPricingAssumption, -10, 20],
                ].map(([label, val, setter, min, max]) => (
                  <label key={label} className="border-[3px] border-black bg-white p-2 font-mono text-xs font-bold">
                    {label}: {val}
                    <input type="range" min={min} max={max} value={val} onChange={(e) => setter(Number(e.target.value))} className="w-full" />
                  </label>
                ))}
              </div>
              <div className="mt-3 h-[220px]">
                <Line
                  data={{
                    labels: ["Downside", "Base", "Upside"],
                    datasets: [{ label: "Projected Revenue Index", data: scenarioSeries, borderColor: "#FF69B4", backgroundColor: "#FF69B433", borderWidth: 3, tension: 0.35 }],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#000" } } } }}
                />
              </div>
            </div>

            <div className="border-[4px] border-black bg-white p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
              <h3 className="mb-2 font-black text-lg uppercase">Investment Committee Mode</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="border-[3px] border-black bg-[#39FF14] p-2 text-center font-black">YES {icMode.yes}</div>
                <div className="border-[3px] border-black bg-[#FFD700] p-2 text-center font-black">HOLD {icMode.hold}</div>
                <div className="border-[3px] border-black bg-[#FF4500] p-2 text-center font-black text-white">NO {icMode.no}</div>
              </div>
              <p className="mt-3 border-[3px] border-black bg-black p-2 font-mono text-sm font-bold text-[#00ff00]">VERDICT: {icMode.verdict}</p>
              <div className="mt-3 h-[160px]">
                <Bar
                  data={{ labels: ["YES", "HOLD", "NO"], datasets: [{ label: "Committee Votes", data: [icMode.yes, icMode.hold, icMode.no], backgroundColor: ["#39FF14", "#FFD700", "#FF4500"], borderColor: "#000", borderWidth: 3 }] }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="border-[4px] border-black bg-[#FFD700] p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)] -rotate-1">
              <h3 className="mb-2 font-black text-lg uppercase">Early Warning System</h3>
              <div className="space-y-2">
                {earlyWarnings.map((w, i) => (
                  <div key={i} className="border-[3px] border-black bg-white p-2 font-mono text-xs font-bold">
                    [{w.level}] {w.text}
                  </div>
                ))}
              </div>
            </div>
            <div className="border-[4px] border-black bg-[#00FFFF] p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)] rotate-1">
              <h3 className="mb-2 font-black text-lg uppercase">Confidence & Data Quality</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="border-[3px] border-black bg-white p-3 text-center">
                  <p className="font-mono text-[10px] font-black uppercase">Confidence</p>
                  <p className="font-black text-3xl">{confidence || 0}</p>
                </div>
                <div className="border-[3px] border-black bg-white p-3 text-center">
                  <p className="font-mono text-[10px] font-black uppercase">Data Quality</p>
                  <p className="font-black text-3xl">{quality || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-[4px] border-black bg-white p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
            <h3 className="mb-2 font-black text-lg uppercase">What-Changed Diff</h3>
            {diffRows.length === 0 ? (
              <p className="font-mono text-xs font-bold uppercase text-black/70">Upload at least two reports to view deltas.</p>
            ) : (
              <div className="space-y-1">
                {diffRows.map((r) => (
                  <div key={r.key} className="grid grid-cols-4 border-[3px] border-black bg-[#FDFBF7] p-2 font-mono text-xs font-bold">
                    <span>{r.key.toUpperCase()}</span><span>{r.prev}</span><span>{r.curr}</span><span>{r.delta}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="border-[4px] border-black bg-white p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
              <h3 className="mb-2 font-black text-lg uppercase">Peer Universe Builder</h3>
              <div className="flex gap-2">
                <input value={peerInput} onChange={(e) => setPeerInput(e.target.value)} placeholder="Add peer name..." className="flex-1 border-[3px] border-black px-2 py-1 font-mono font-bold" />
                <button onClick={() => { if (peerInput.trim()) { setPeers((p) => [...p, { name: peerInput.trim(), score: 50 }]); setPeerInput("") } }} className="border-[3px] border-black bg-[#FF69B4] px-3 py-1 font-black">ADD</button>
              </div>
              <div className="mt-2 space-y-1">
                {peers.map((p, i) => (
                  <div key={`${p.name}-${i}`} className="grid grid-cols-3 items-center border-[3px] border-black bg-[#FDFBF7] p-1">
                    <span className="font-mono text-xs font-bold">{p.name}</span>
                    <input type="range" min={0} max={100} value={p.score} onChange={(e) => setPeers((arr) => arr.map((x, idx) => idx === i ? { ...x, score: Number(e.target.value) } : x))} />
                    <span className="font-black">{p.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-[4px] border-black bg-white p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
              <h3 className="mb-2 font-black text-lg uppercase">Action Tracker</h3>
              <div className="flex gap-2">
                <input value={newAction} onChange={(e) => setNewAction(e.target.value)} placeholder="Action item..." className="flex-1 border-[3px] border-black px-2 py-1 font-mono font-bold" />
                <button onClick={() => { if (newAction.trim()) { setActions((a) => [...a, { text: newAction.trim(), status: "TODO" }]); setNewAction("") } }} className="border-[3px] border-black bg-[#39FF14] px-3 py-1 font-black">ADD</button>
              </div>
              <div className="mt-2 space-y-1">
                {actions.map((a, i) => (
                  <button key={`${a.text}-${i}`} onClick={() => setActions((arr) => arr.map((x, idx) => idx === i ? { ...x, status: x.status === "TODO" ? "DOING" : x.status === "DOING" ? "DONE" : "TODO" } : x))} className="w-full border-[3px] border-black bg-[#FDFBF7] p-2 text-left font-mono text-xs font-bold">
                    [{a.status}] {a.text}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="border-[4px] border-black bg-white p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
              <h3 className="mb-2 font-black text-lg uppercase">Source Traceability</h3>
              <div className="max-h-[220px] space-y-1 overflow-y-auto">
                {(professionalPack?.traceability?.retrieved_chunks || []).slice(0, 8).map((chunk, i) => (
                  <div key={i} className="border-[3px] border-black bg-[#FDFBF7] p-2 font-mono text-[11px] font-bold">{chunk.slice(0, 280)}...</div>
                ))}
                {!(professionalPack?.traceability?.retrieved_chunks || []).length && <p className="font-mono text-xs font-bold uppercase text-black/70">Run professional pack to populate sources.</p>}
              </div>
            </div>

            <div className="border-[4px] border-black bg-white p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
              <h3 className="mb-2 font-black text-lg uppercase">Valuation + Export Pack</h3>
              <div className="flex gap-2">
                <button disabled={isBusy} onClick={runValuation} className="border-[3px] border-black bg-[#FFD700] px-3 py-2 font-black uppercase disabled:opacity-50">Run Valuation</button>
                <button disabled={isBusy || !professionalPack} onClick={runExport} className="border-[3px] border-black bg-[#00FFFF] px-3 py-2 font-black uppercase disabled:opacity-50">Export Memo</button>
              </div>
              {valuationData?.valuation_range && (
                <div className="mt-3 border-[3px] border-black bg-[#FDFBF7] p-2 font-mono text-xs font-bold">
                  Downside: {valuationData.valuation_range.downside} | Base: {valuationData.valuation_range.base} | Upside: {valuationData.valuation_range.upside} {valuationData.valuation_range.currency}
                </div>
              )}
              {exportBlob && (
                <textarea readOnly value={exportBlob} className="mt-3 h-[160px] w-full border-[3px] border-black bg-black p-2 font-mono text-[11px] font-bold text-[#00ff00]" />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

