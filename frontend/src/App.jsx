import { useState, useCallback, useEffect } from "react"
import { m } from "framer-motion"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from "chart.js"

import DraggableCard from "./components/DraggableCard"
import Chat from "./components/Chat"
import RiskMeter from "./components/RiskMeter"
import BullBearDebate from "./components/BullBearDebate"
import Smackdown from "./components/Smackdown"
import RealityCheck from "./components/RealityCheck"
import MarketPulse from "./components/MarketPulse"
import DecisionSupport from "./components/DecisionSupport"
import SignalDeck from "./components/SignalDeck"
import ProfessionalPack from "./components/ProfessionalPack"
import ProFeatureSuite from "./components/ProFeatureSuite"
import {
  uploadPDF, fetchKPIs, fetchRiskData, fetchDebate, compareCompanies, fetchRealityCheck, fetchRecommendation, fetchSWOT, fetchIndustryBenchmarking, fetchProfessionalPack
} from "./api"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip)

const EMPTY_KPI_DATA = {
  revenue: "N/A",
  net_income: "N/A",
  ebitda: "N/A",
  op_margin: "N/A",
  churn: "N/A",
  cac: "N/A",
}

const EMPTY_RISK_DATA = {
  threat_score: 0,
  critical_warning: "UPLOAD A REPORT TO ANALYZE RISK.",
  anomalies: [],
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

function buildKpiChart(kpiData) {
  const points = [
    { label: "Revenue", value: parseFinancialValue(kpiData.revenue), color: "#FFD700" },
    { label: "Net Income", value: parseFinancialValue(kpiData.net_income), color: "#FF4500" },
    { label: "EBITDA", value: parseFinancialValue(kpiData.ebitda), color: "#00FFFF" },
  ]
  const hasRealData = points.some((point) => point.value !== null)

  return {
    hasRealData,
    data: {
      labels: points.map((point) => point.label),
      datasets: [
        {
          label: "Extracted KPI Values",
          data: points.map((point) => point.value ?? 0),
          backgroundColor: points.map((point) => point.color),
          borderColor: "#000000",
          borderWidth: 4,
        },
      ],
    },
  }
}

function hasRealMetricValue(value) {
  if (value === null || value === undefined) return false
  const normalized = String(value).trim().toLowerCase()
  return normalized !== "" && normalized !== "n/a" && normalized !== "not disclosed" && normalized !== "none"
}

function formatMetricTitle(key) {
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
}

// The Brutalist Chart Theme
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      backgroundColor: "#000000",
      titleFont: { family: "monospace", size: 16, weight: "bold" },
      bodyFont: { family: "monospace", size: 14 },
      padding: 10,
      cornerRadius: 0,
      displayColors: false,
    },
    legend: { display: false }
  },
  scales: {
    x: { grid: { color: "#000", lineWidth: 3 }, ticks: { font: { family: "monospace", size: 14, weight: "bold" }, color: "#000" }, border: { color: "#000", width: 4 } },
    y: { grid: { color: "#000", lineWidth: 3 }, ticks: { font: { family: "monospace", size: 14, weight: "bold" }, color: "#000" }, border: { color: "#000", width: 4 } }
  }
}

export default function App() {
  const [isHoveringDrop, setIsHoveringDrop] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const [error, setError] = useState(null)

  // Smackdown: company name inputs
  const [companyAName, setCompanyAName] = useState("")
  const [companyBName, setCompanyBName] = useState("")
  const [smackdownData, setSmackdownData] = useState(null)
  const [isSmacking, setIsSmacking] = useState(false)

  // Reality Check state
  const [realityChecks, setRealityChecks] = useState([])
  const [isCheckingReality, setIsCheckingReality] = useState(false)

  // KPI and risk state populated from backend responses
  const [kpiData, setKpiData] = useState(EMPTY_KPI_DATA)
  const [extraKpiData, setExtraKpiData] = useState({})
  const [riskFactors, setRiskFactors] = useState([])
  const [riskData, setRiskData] = useState(EMPTY_RISK_DATA)
  const [debateData, setDebateData] = useState({ bull: null, bear: null })
  const [isDebating, setIsDebating] = useState(false)
  const [decisionSupportData, setDecisionSupportData] = useState(null)
  const [isDecisionSupportLoading, setIsDecisionSupportLoading] = useState(false)
  const [activeDecisionView, setActiveDecisionView] = useState("recommendation")
  const [professionalPackData, setProfessionalPackData] = useState(null)
  const [isProfessionalPackLoading, setIsProfessionalPackLoading] = useState(false)
  const [activeProfessionalView, setActiveProfessionalView] = useState("executive_view")
  const [previousSnapshot, setPreviousSnapshot] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const kpiChart = buildKpiChart(kpiData)

  const showError = useCallback((msg) => {
    setError(msg)
    setTimeout(() => setError(null), 5000)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark-mode", isDarkMode)
  }, [isDarkMode])

  const handleUpload = useCallback(async (file, companyName) => {
    if (!file) return
    if (uploadDone) {
      setPreviousSnapshot({
        revenue: kpiData.revenue,
        net_income: kpiData.net_income,
        ebitda: kpiData.ebitda,
        op_margin: kpiData.op_margin,
        churn: kpiData.churn,
        cac: kpiData.cac,
        threat_score: riskData.threat_score,
      })
    }
    setIsUploading(true)
    setUploadDone(false)
    try {
      await uploadPDF(file, companyName)
      // Immediately pull real KPIs from the backend
      const kpiRes = await fetchKPIs()
      if (kpiRes.status === "success" && kpiRes.data) {
        const knownMetricKeys = new Set(["revenue", "net_income", "ebitda", "profit_margin", "op_margin", "churn", "cac", "risk_factors"])
        setKpiData({
          revenue: kpiRes.data.revenue || "N/A",
          net_income: kpiRes.data.net_income || "N/A",
          ebitda: kpiRes.data.ebitda || "N/A",
          op_margin: kpiRes.data.profit_margin || kpiRes.data.op_margin || "N/A",
          churn: kpiRes.data.churn || "N/A",
          cac: kpiRes.data.cac || "N/A",
        })
        const extras = Object.fromEntries(
          Object.entries(kpiRes.data).filter(([key, value]) => !knownMetricKeys.has(key) && hasRealMetricValue(value))
        )
        setExtraKpiData(extras)
        if (kpiRes.data.risk_factors && kpiRes.data.risk_factors.length > 0) {
          setRiskFactors(kpiRes.data.risk_factors)
        } else {
          setRiskFactors([])
        }
      } else {
        setExtraKpiData({})
      }
      setUploadDone(true)

      // Fire risk analysis in parallel — don't block on it
      fetchRiskData().then((riskRes) => {
        if (riskRes.status === "success" && riskRes.data) {
          setRiskData({
            threat_score: riskRes.data.threat_score ?? 0,
            critical_warning: riskRes.data.critical_warning || "UNKNOWN THREAT",
            anomalies: riskRes.data.anomalies || [],
          })
        }
      }).catch(() => { /* risk fetch is non-critical */ })

    } catch (err) {
      console.error(err)
      showError(err?.response?.data?.message || err.message || "CATASTROPHIC UPLOAD FAILURE")
    } finally {
      setIsUploading(false)
    }
  }, [showError, uploadDone, kpiData, riskData])

  const handleDrop = (event) => {
    event.preventDefault()
    setIsHoveringDrop(false)
    const file = event.dataTransfer?.files?.[0]
    handleUpload(file, companyAName || undefined)
  }

  const handleFileInput = (event) => {
    const file = event.target.files?.[0]
    handleUpload(file, companyAName || undefined)
  }

  const baseCards = [
    { key: "revenue", title: "Revenue", value: kpiData.revenue, color: "bg-[#FFD700]", rotation: "rotate-2", style: { top: "5%", left: "5%" } },
    { key: "ebitda", title: "EBITDA", value: kpiData.ebitda, color: "bg-[#00FFFF]", rotation: "-rotate-3", style: { top: "35%", left: "65%" } },
    { key: "net_income", title: "Net Income", value: kpiData.net_income, color: "bg-[#FF4500]", rotation: "rotate-3", style: { top: "65%", left: "10%" } },
    { key: "op_margin", title: "Op Margin", value: kpiData.op_margin, color: "bg-[#FF69B4]", rotation: "-rotate-4", style: { top: "10%", left: "40%" } },
    { key: "churn", title: "Churn", value: kpiData.churn, color: "bg-[#00FFFF]", rotation: "rotate-1", style: { top: "75%", left: "70%" } },
    { key: "cac", title: "CAC", value: kpiData.cac, color: "bg-[#FFD700]", rotation: "-rotate-2", style: { top: "50%", left: "20%" } },
  ]

  const extraCardPalette = [
    { color: "bg-[#FFD700]", rotation: "rotate-1" },
    { color: "bg-[#00FFFF]", rotation: "-rotate-2" },
    { color: "bg-[#FF69B4]", rotation: "rotate-2" },
    { color: "bg-[#FF4500]", rotation: "-rotate-1" },
  ]
  const extraCardPositions = [
    { top: "18%", left: "74%" },
    { top: "58%", left: "48%" },
    { top: "80%", left: "38%" },
    { top: "28%", left: "22%" },
  ]
  const extraCards = Object.entries(extraKpiData).map(([key, value], idx) => ({
    key,
    title: formatMetricTitle(key),
    value,
    color: extraCardPalette[idx % extraCardPalette.length].color,
    rotation: extraCardPalette[idx % extraCardPalette.length].rotation,
    style: extraCardPositions[idx % extraCardPositions.length],
  }))
  const visibleCards = uploadDone
    ? [...baseCards.filter((card) => hasRealMetricValue(card.value)), ...extraCards]
    : baseCards
  const currentSnapshot = {
    revenue: kpiData.revenue,
    net_income: kpiData.net_income,
    ebitda: kpiData.ebitda,
    op_margin: kpiData.op_margin,
    churn: kpiData.churn,
    cac: kpiData.cac,
    threat_score: riskData.threat_score,
  }



  return (
    <div
      className={"min-h-screen pb-20 cursor-crosshair " + (isDarkMode ? "selection:bg-[#FFD700] selection:text-black" : "selection:bg-black selection:text-[#FF69B4]")}
      style={{
        backgroundColor: isDarkMode ? "#090909" : "#FDFBF7",
        backgroundImage: isDarkMode
          ? "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)"
          : "linear-gradient(#60a5fa 1px, transparent 1px), linear-gradient(90deg, #60a5fa 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        backgroundPosition: "-1px -1px",
      }}
    >
      {/* ERROR TOAST */}
      {error && (
        <m.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="fixed top-4 right-4 z-[999] border-[5px] border-black bg-red-600 px-6 py-4 font-black uppercase text-white shadow-[8px_8px_0px_rgba(0,0,0,1)] max-w-md"
        >
          <p className="text-xs tracking-widest mb-1">! ! SYSTEM ERROR ! !</p>
          <p className="font-mono text-sm font-bold">{error}</p>
        </m.div>
      )}

      {/* UPLOAD PROGRESS MARQUEE */}
      {isUploading && (
        <div className="fixed top-0 left-0 w-full z-[998] overflow-hidden border-b-[4px] border-black bg-[#FF4500] py-2">
          <m.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ ease: "linear", duration: 3, repeat: Infinity }}
            className="flex whitespace-nowrap"
          >
            {[...Array(10)].map((_, i) => (
              <span key={i} className="mx-4 font-black text-xl uppercase text-white flex-none animate-pulse">
                ⚡ UPLOADING ⚡ PARSING ⚡ EMBEDDING ⚡ INDEXING ⚡
              </span>
            ))}
          </m.div>
        </div>
      )}

      {/* MARQUEE HEADER */}
      <div className="w-full overflow-hidden border-b-[6px] border-black bg-[#FFD700] py-4">
        <m.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 10, repeat: Infinity }}
          className="flex whitespace-nowrap"
        >
          {[...Array(6)].map((_, i) => (
            <h1 key={i} className="mx-6 font-black text-2xl md:text-3xl uppercase tracking-tighter text-black flex-none">
              /// SYSTEM ONLINE /// FINANCIAL DATA INGESTION /// DO NOT FEED THE AI ///
            </h1>
          ))}
        </m.div>
      </div>

      <main className="container mx-auto px-4 mt-8 w-full max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT COLUMN: Physical Dropzone & Console */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            {/* DROPZONE */}
            <m.div
              onHoverStart={() => setIsHoveringDrop(true)}
              onHoverEnd={() => setIsHoveringDrop(false)}
              animate={{ scale: isHoveringDrop ? 1.05 : 1, rotate: isHoveringDrop ? 2 : -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="group flex min-h-[220px] w-full flex-col items-center justify-center border-[5px] border-dashed border-black bg-[#FF69B4] shadow-[12px_12px_0px_rgba(0,0,0,1)] p-4 z-10 cursor-pointer"
              onDragOver={(e) => { e.preventDefault(); setIsHoveringDrop(true) }}
              onDragLeave={() => setIsHoveringDrop(false)}
              onDrop={handleDrop}
            >
              <h2 className="text-center font-black text-5xl md:text-6xl uppercase leading-[0.9] text-black">
                {isUploading ? "DIGESTING..." : uploadDone ? "FED ✓" : "THROW PDF HERE"}
              </h2>
              <label className="mt-4 border-[3px] border-black bg-white px-4 py-2 font-mono font-bold text-black shadow-[4px_4px_0px_rgba(0,0,0,1)] cursor-pointer hover:bg-[#FFD700] transition-colors">
                {uploadDone ? "FEED ANOTHER" : "OR CLICK TO UPLOAD"}
                <input type="file" accept=".pdf" onChange={handleFileInput} className="hidden" />
              </label>
            </m.div>

            {/* RISK WARNING CONSOLE */}
            <div className="min-h-[200px] border-[5px] border-black bg-black p-4 shadow-[12px_12px_0px_rgba(0,0,0,1)] rotate-1">
              <div className="mb-4 flex items-center gap-2 border-b-[3px] border-[#00ff00] pb-2">
                <div className="h-4 w-4 bg-red-500 border-2 border-black"></div>
                <div className="h-4 w-4 bg-yellow-400 border-2 border-black"></div>
                <div className="h-4 w-4 bg-green-500 border-2 border-black"></div>
                <span className="font-mono text-sm font-bold text-[#00ff00] ml-2">AI_RISK_TERMINAL.exe</span>
              </div>
              <div className="font-mono text-sm md:text-base leading-loose text-[#00ff00]">
                <p>{">"} BOOTING KERNEL...</p>
                {riskFactors.length > 0 ? (
                  riskFactors.map((risk, idx) => (
                    <p key={idx} className="my-1">{">"} {risk}</p>
                  ))
                ) : (
                  <p className="my-1">{">"} UPLOAD A REPORT TO POPULATE LIVE RISK SIGNALS.</p>
                )}
                <p className="flex items-center gap-1 mt-4">
                  {">"} AWAITING INPUT <m.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }} className="inline-block h-6 w-3 bg-[#00ff00]"></m.span>
                </p>
              </div>
            </div>

            {/* ⚔️ OPEN TERMINAL BUTTON */}
            <m.button
              whileHover={{ x: 4, y: 4, boxShadow: "3px 3px 0px rgba(0,0,0,1)" }}
              whileTap={{ x: 8, y: 8, boxShadow: "0px 0px 0px rgba(0,0,0,1)", rotate: -3 }}
              onClick={() => setIsChatOpen((prev) => !prev)}
              className={`mt-3 w-full border-[5px] border-black p-3 font-black text-2xl md:text-3xl uppercase shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-colors rotate-1 ${isChatOpen ? "bg-red-600 text-white" : "bg-[#FF4500] text-white hover:bg-[#FF6633]"
                }`}
            >
              {isChatOpen ? "✕ KILL TERMINAL" : "⚡ OPEN TERMINAL"}
            </m.button>

            <m.button
              whileHover={{ x: 3, y: 3, boxShadow: "3px 3px 0px rgba(0,0,0,1)" }}
              whileTap={{ x: 6, y: 6, boxShadow: "0px 0px 0px rgba(0,0,0,1)", rotate: 2 }}
              onClick={() => setIsDarkMode((prev) => !prev)}
              className={`mt-2 w-full border-[5px] border-black p-3 font-black text-2xl md:text-3xl uppercase shadow-[8px_8px_0px_rgba(0,0,0,1)] ${isDarkMode ? "bg-[#0f0f0f] text-[#39FF14]" : "bg-[#111111] text-[#FFD700] hover:bg-[#222222]"}`}
            >
              {isDarkMode ? "☀️ LIGHT MODE" : "🌑 DARK MODE"}
            </m.button>

            {/* ⚔️ TRIGGER DEBATE BUTTON */}
            <m.button
              whileHover={{ x: 4, y: 4, boxShadow: "3px 3px 0px rgba(0,0,0,1)" }}
              whileTap={{ x: 8, y: 8, boxShadow: "0px 0px 0px rgba(0,0,0,1)", rotate: 3 }}
              disabled={isDebating || !uploadDone}
              onClick={async () => {
                setIsDebating(true)
                setDebateData({ bull: null, bear: null })
                try {
                  const res = await fetchDebate()
                  if (res.status === "success") setDebateData({ bull: res.bull, bear: res.bear })
                } catch (e) {
                  showError(e?.response?.data?.message || "DEBATE SYSTEM FAILURE")
                } finally { setIsDebating(false) }
              }}
              className="mt-2 w-full border-[5px] border-black p-4 font-black text-2xl md:text-3xl uppercase shadow-[8px_8px_0px_rgba(0,0,0,1)] bg-black text-[#FFD700] hover:bg-[#FFD700] hover:text-black transition-colors -rotate-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isDebating ? "⚔️ FIGHTING..." : "⚔️ TRIGGER DEBATE"}
            </m.button>

            {/* 🔍 REALITY CHECK BUTTON */}
            <m.button
              whileHover={{ x: 4, y: 4, boxShadow: "3px 3px 0px rgba(0,0,0,1)" }}
              whileTap={{ x: 8, y: 8, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
              disabled={isCheckingReality || !uploadDone || riskFactors.length === 0}
              onClick={async () => {
                setIsCheckingReality(true)
                setRealityChecks([])
                try {
                  const res = await fetchRealityCheck(riskFactors)
                  if (res.status === "success") setRealityChecks(res.checks)
                } catch (e) {
                  showError(e?.response?.data?.message || "REALITY CHECK SYSTEM FAILURE")
                } finally { setIsCheckingReality(false) }
              }}
              className="mt-2 w-full border-[5px] border-black p-4 font-black text-2xl md:text-3xl uppercase shadow-[8px_8px_0px_rgba(0,0,0,1)] bg-[#FFD700] text-black hover:bg-[#FF69B4] transition-colors rotate-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isCheckingReality ? "🔍 CHECKING..." : "🔍 REALITY CHECK"}
            </m.button>

            <div className="mt-2 space-y-2 border-[5px] border-black bg-white p-3 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
              <p className="font-black text-sm uppercase tracking-widest text-black">Decision Support</p>
              {[
                { key: "recommendation", label: "📌 RECOMMENDATION", color: "bg-[#00FFFF] hover:bg-[#39FF14]" },
                { key: "swot", label: "🧩 SWOT ANALYSIS", color: "bg-[#FFD700] hover:bg-[#FF69B4]" },
                { key: "benchmarking", label: "🏁 INDUSTRY BENCHMARKING", color: "bg-[#FF69B4] hover:bg-[#FFD700]" },
              ].map((btn) => (
                <m.button
                  key={btn.key}
                  whileHover={{ x: 3, y: 3, boxShadow: "2px 2px 0px rgba(0,0,0,1)" }}
                  whileTap={{ x: 6, y: 6, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                  disabled={isDecisionSupportLoading || !uploadDone}
                  onClick={async () => {
                    setActiveDecisionView(btn.key)
                    setIsDecisionSupportLoading(true)
                    try {
                      if (btn.key === "recommendation") {
                        const res = await fetchRecommendation()
                        if (res.status === "success" && res.recommendation) {
                          setDecisionSupportData((prev) => ({
                            ...(prev || {}),
                            expand_decision: res.recommendation,
                          }))
                        } else {
                          showError(res.message || "RECOMMENDATION FAILED")
                        }
                      } else if (btn.key === "swot") {
                        const res = await fetchSWOT()
                        if (res.status === "success" && res.swot) {
                          setDecisionSupportData((prev) => ({
                            ...(prev || {}),
                            swot: res.swot,
                          }))
                        } else {
                          showError(res.message || "SWOT ANALYSIS FAILED")
                        }
                      } else if (btn.key === "benchmarking") {
                        const res = await fetchIndustryBenchmarking()
                        if (res.status === "success" && res.industry_benchmarking) {
                          setDecisionSupportData((prev) => ({
                            ...(prev || {}),
                            industry_benchmarking: res.industry_benchmarking,
                          }))
                        } else {
                          showError(res.message || "INDUSTRY BENCHMARKING FAILED")
                        }
                      }
                    } catch (e) {
                      showError(e?.response?.data?.message || "DECISION SUPPORT SYSTEM FAILURE")
                    } finally {
                      setIsDecisionSupportLoading(false)
                    }
                  }}
                  className={`w-full border-[4px] border-black p-3 font-black text-lg uppercase text-black shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-colors ${btn.color} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {isDecisionSupportLoading && activeDecisionView === btn.key ? "ANALYZING..." : btn.label}
                </m.button>
              ))}
            </div>
            <m.button
              whileHover={{ x: 3, y: 3, boxShadow: "2px 2px 0px rgba(0,0,0,1)" }}
              whileTap={{ x: 6, y: 6, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
              disabled={isProfessionalPackLoading || !uploadDone}
              onClick={async () => {
                setIsProfessionalPackLoading(true)
                try {
                  const res = await fetchProfessionalPack()
                  if (res.status === "success" && res.professional_pack) {
                    setProfessionalPackData(res.professional_pack)
                  } else {
                    showError(res.message || "PROFESSIONAL PACK FAILED")
                  }
                } catch (e) {
                  showError(e?.response?.data?.message || "PROFESSIONAL PACK SYSTEM FAILURE")
                } finally {
                  setIsProfessionalPackLoading(false)
                }
              }}
              className="w-full border-[5px] border-black bg-[#FF69B4] p-4 font-black text-xl uppercase text-black shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:bg-[#00FFFF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProfessionalPackLoading ? "📚 COMPILING..." : "📚 PROFESSIONAL PACK"}
            </m.button>

            {/* 💥 SMACKDOWN SECTION */}
            <div className="border-[5px] border-black bg-white p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] -rotate-1 mt-2">
              <h4 className="font-black text-xl uppercase border-b-[3px] border-black pb-2 mb-3">💥 SMACKDOWN MODE</h4>
              <p className="font-mono text-xs text-black mb-3 font-bold">Upload TWO company PDFs with names, then clash them.</p>
              <input
                value={companyAName}
                onChange={e => setCompanyAName(e.target.value)}
                placeholder="COMPANY A NAME..."
                className="w-full border-[3px] border-black px-3 py-2 font-mono font-bold text-black outline-none mb-2 focus:bg-[#FFD700]"
              />
              <input
                value={companyBName}
                onChange={e => setCompanyBName(e.target.value)}
                placeholder="COMPANY B NAME..."
                className="w-full border-[3px] border-black px-3 py-2 font-mono font-bold text-black outline-none mb-3 focus:bg-[#FF69B4]"
              />
              <m.button
                whileHover={{ x: 3, y: 3, boxShadow: "2px 2px 0px rgba(0,0,0,1)" }}
                whileTap={{ x: 5, y: 5, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                disabled={isSmacking || !companyAName || !companyBName}
                onClick={async () => {
                  setIsSmacking(true)
                  setSmackdownData(null)
                  try {
                    const res = await compareCompanies(companyAName, companyBName)
                    if (res.status === "success") setSmackdownData({ comparison: res.comparison, companyA: res.company_a, companyB: res.company_b })
                    else showError(res.message)
                  } catch (e) {
                    showError(e?.response?.data?.message || "SMACKDOWN FAILED")
                  } finally { setIsSmacking(false) }
                }}
                className="w-full border-[4px] border-black bg-[#FF4500] p-3 font-black text-xl uppercase text-white shadow-[5px_5px_0px_rgba(0,0,0,1)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSmacking ? "CLASHING..." : "💥 LAUNCH SMACKDOWN"}
              </m.button>
            </div>


          </div>

          {/* RIGHT COLUMN: The UGLY Chart & Sandbox */}
          <div className={`relative w-full lg:w-2/3 min-h-[520px] border-[5px] border-black ${isDarkMode ? "bg-[#111] text-[#f4f4f0]" : "bg-white"} p-4 md:p-6 shadow-[16px_16px_0px_rgba(0,0,0,1)] -rotate-1 hover:rotate-1 hover:-translate-y-2 transition-all duration-500 hover:shadow-[24px_24px_0px_rgba(0,0,0,1)]`}>
            <h2 className={`mb-8 font-black text-4xl md:text-5xl uppercase underline decoration-[6px] underline-offset-8 ${isDarkMode ? "text-[#FFD700]" : "text-black"} hover:text-[#FF4500] transition-colors`}>
              Q4 AGGRESSIVE OUTLOOK
            </h2>

            <div className={`h-[320px] w-full border-[5px] border-black ${isDarkMode ? "bg-[#111]" : "bg-[#FDFBF7]"} p-3 shadow-inner`}>
              {kpiChart.hasRealData ? (
                <Bar data={kpiChart.data} options={chartOptions} />
              ) : (
                <div className="flex h-full items-center justify-center border-[3px] border-dashed border-black bg-white px-4 text-center">
                  <p className="font-mono text-sm font-bold uppercase text-black">
                    Upload a report to render chart values from extracted KPIs.
                  </p>
                </div>
              )}
            </div>

            {/* MARKET PULSE — fills empty space below the chart */}
            <MarketPulse hasData={uploadDone} kpiData={kpiData} riskData={riskData} />

            {/* EXPANDED SIGNALS: extra cards + additional charts */}
            <SignalDeck
              hasData={uploadDone}
              kpiData={kpiData}
              riskData={riskData}
              extraKpiData={extraKpiData}
            />

            {/* DRAGGABLE KPI CARDS - Sandbox Area — NOW LIVE DATA */}
            <div className="absolute inset-0 pointer-events-none overflow-visible">
              <div className="pointer-events-auto" style={{ position: "relative", width: "100%", height: "100%" }}>
                {visibleCards.map((card) => (
                  <div key={card.key} style={card.style} className="absolute">
                    <DraggableCard title={card.title} value={card.value} color={card.color} rotation={card.rotation} />
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* RISK METER - FULL WIDTH BELOW THE MAIN GRID */}
        <RiskMeter
          threatScore={riskData.threat_score}
          criticalWarning={riskData.critical_warning}
          anomalies={riskData.anomalies}
        />

        {/* BULL VS BEAR DEBATE - renders below risk meter */}
        <BullBearDebate
          bull={debateData.bull}
          bear={debateData.bear}
          isLoading={isDebating}
        />

        {/* SMACKDOWN — full-width fighter compare */}
        {(isSmacking || smackdownData) && (
          <Smackdown
            companyA={smackdownData?.companyA}
            companyB={smackdownData?.companyB}
            comparison={smackdownData?.comparison}
            isLoading={isSmacking}
          />
        )}

        {/* REALITY CHECK — live web fact ticker */}
        {(isCheckingReality || realityChecks.length > 0) && (
          <RealityCheck
            checks={realityChecks}
            isLoading={isCheckingReality}
          />
        )}

        {/* DECISION SUPPORT SYSTEM */}
        <DecisionSupport
          data={decisionSupportData}
          isLoading={isDecisionSupportLoading}
          activeView={activeDecisionView}
        />
        <ProfessionalPack
          data={professionalPackData}
          isLoading={isProfessionalPackLoading}
          activeView={activeProfessionalView}
          setActiveView={setActiveProfessionalView}
        />
        <ProFeatureSuite
          uploadDone={uploadDone}
          kpiData={kpiData}
          riskData={riskData}
          riskFactors={riskFactors}
          professionalPack={professionalPackData}
          previousSnapshot={previousSnapshot}
          currentSnapshot={currentSnapshot}
        />
      </main>

      {/* BOTTOM QUIRK MARQUEE */}
      <div className="fixed bottom-0 left-0 w-full overflow-hidden border-t-[6px] border-black bg-[#00FFFF] py-1.5 z-50 pointer-events-none">
        <m.div
          animate={{ x: ["-50%", "0%"] }}
          transition={{ ease: "linear", duration: 7, repeat: Infinity }}
          className="flex whitespace-nowrap"
        >
          {[...Array(8)].map((_, i) => (
            <h1 key={i} className="mx-6 font-black text-xl uppercase tracking-widest text-black flex-none mix-blend-difference text-white">
              ! ! QUIRK MODE ACTIVATED ! ! STONKS GO UP ! !
            </h1>
          ))}
        </m.div>
      </div>

      {/* THE FLOATING BRUTALIST CHAT TERMINAL */}
      <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}

