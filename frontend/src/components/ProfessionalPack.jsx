import { m } from "framer-motion"
import { Bar, Line, Radar, Doughnut } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Filler,
  Tooltip,
  Legend
)

function Strip({ title, items }) {
  return (
    <div className="border-[4px] border-black bg-white p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
      <h4 className="mb-2 border-b-[3px] border-black pb-1 font-black text-sm uppercase tracking-wider text-black">{title}</h4>
      {items?.length ? (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={`${title}-${i}`} className="font-mono text-xs font-bold text-black">▸ {typeof item === "string" ? item : JSON.stringify(item)}</li>
          ))}
        </ul>
      ) : (
        <p className="font-mono text-xs font-bold uppercase text-black/60">No data yet.</p>
      )}
    </div>
  )
}

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function chartBaseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#000", font: { family: "monospace", weight: "bold", size: 11 } } },
      tooltip: { backgroundColor: "#000", titleFont: { family: "monospace" }, bodyFont: { family: "monospace" }, cornerRadius: 0 },
    },
  }
}

function ScorePill({ label, score, color }) {
  return (
    <div className={`border-[3px] border-black ${color} px-3 py-2 shadow-[3px_3px_0px_rgba(0,0,0,1)]`}>
      <p className="font-mono text-[10px] font-black uppercase text-black">{label}</p>
      <p className="font-black text-xl text-black">{score}</p>
    </div>
  )
}

export default function ProfessionalPack({ data, isLoading, activeView, setActiveView }) {
  const tabs = [
    { key: "executive_view", label: "EXECUTIVE" },
    { key: "strategy_view", label: "STRATEGY (MBA)" },
    { key: "finance_view", label: "FINANCE" },
    { key: "benchmark_view", label: "BENCHMARK" },
  ]

  return (
    <div className="mt-10 space-y-3">
      <div className="border-[5px] border-black bg-[#FF69B4] p-4 shadow-[10px_10px_0px_rgba(0,0,0,1)] -rotate-1">
        <h2 className="font-black text-3xl uppercase text-black">Professional Pack</h2>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        {tabs.map((tab, idx) => (
          <m.button
            key={tab.key}
            whileHover={{ x: 3, y: 3, boxShadow: "2px 2px 0px rgba(0,0,0,1)" }}
            whileTap={{ x: 6, y: 6, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
            onClick={() => setActiveView(tab.key)}
            className={`border-[5px] border-black px-2 py-2 font-black text-[11px] uppercase tracking-wider shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-colors ${
              activeView === tab.key
                ? "bg-[#FFD700] text-black"
                : idx % 2 === 0
                  ? "bg-white text-black hover:bg-[#00FFFF]"
                  : "bg-[#FDFBF7] text-black hover:bg-[#FF69B4]"
            } ${idx % 2 === 0 ? "rotate-1" : "-rotate-1"}`}
          >
            {tab.label}
          </m.button>
        ))}
      </div>

      {isLoading ? (
        <div className="border-[5px] border-black bg-[#FFD700] p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <m.div animate={{ x: ["0%", "-50%"] }} transition={{ ease: "linear", duration: 4, repeat: Infinity }} className="flex whitespace-nowrap">
            {[...Array(6)].map((_, i) => (
              <span key={i} className="mx-4 font-black text-lg uppercase text-black flex-none">
                BOARD MEMO COMPILING • MBA ENGINE THINKING • BENCHMARKING PEERS •
              </span>
            ))}
          </m.div>
        </div>
      ) : !data ? (
        <div className="border-[5px] border-black bg-white p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <p className="font-mono text-sm font-bold uppercase text-black">Run professional pack to generate board-level detailed analysis.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {activeView === "executive_view" && (
            <>
              <div className="grid gap-2 md:grid-cols-3">
                <ScorePill label="Confidence Score" score={toNumber(data.executive_view?.confidence_score)} color="bg-[#FFD700]" />
                <ScorePill label="Benchmark Score" score={toNumber(data.benchmark_view?.benchmark_score)} color="bg-[#00FFFF]" />
                <ScorePill
                  label="Risk Load"
                  score={Math.min(100, (data.executive_view?.key_risks || []).length * 12)}
                  color="bg-[#FF69B4]"
                />
              </div>
              <div className="border-[4px] border-black bg-black p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                <h3 className="mb-2 font-black text-lg uppercase text-[#FFD700]">Board Summary</h3>
                <p className="font-mono text-sm font-bold text-[#00ff00]">{data.executive_view?.board_summary || "No summary yet."}</p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="border-[4px] border-black bg-white p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)] -rotate-1">
                  <h4 className="mb-2 border-b-[3px] border-black pb-1 font-black text-xs uppercase text-black">Executive Balance</h4>
                  <div className="h-[220px]">
                    <Doughnut
                      data={{
                        labels: ["Thesis Density", "Risk Density", "Gate Readiness"],
                        datasets: [
                          {
                            data: [
                              (data.executive_view?.investment_thesis || []).length * 12,
                              (data.executive_view?.key_risks || []).length * 12,
                              (data.executive_view?.decision_gates || []).length * 12,
                            ],
                            backgroundColor: ["#39FF14", "#FF4500", "#FFD700"],
                            borderColor: "#000",
                            borderWidth: 3,
                          },
                        ],
                      }}
                      options={{ ...chartBaseOptions(), cutout: "58%" }}
                    />
                  </div>
                </div>
                <div className="border-[4px] border-black bg-[#FDFBF7] p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)] rotate-1">
                  <h4 className="mb-2 border-b-[3px] border-black pb-1 font-black text-xs uppercase text-black">Readiness Radar</h4>
                  <div className="h-[220px]">
                    <Radar
                      data={{
                        labels: ["Conviction", "Risk Control", "Execution", "Optionality", "Timing"],
                        datasets: [
                          {
                            data: [
                              toNumber(data.executive_view?.confidence_score, 50),
                              Math.max(0, 100 - (data.executive_view?.key_risks || []).length * 12),
                              (data.executive_view?.decision_gates || []).length * 16,
                              (data.executive_view?.investment_thesis || []).length * 14,
                              toNumber(data.benchmark_view?.benchmark_score, 50),
                            ],
                            backgroundColor: "rgba(255,105,180,0.25)",
                            borderColor: "#FF69B4",
                            borderWidth: 3,
                            pointBackgroundColor: "#FFD700",
                            pointBorderColor: "#000",
                            pointBorderWidth: 2,
                          },
                        ],
                      }}
                      options={{
                        ...chartBaseOptions(),
                        scales: {
                          r: {
                            min: 0,
                            max: 100,
                            ticks: { display: false },
                            pointLabels: { color: "#000", font: { family: "monospace", weight: "bold", size: 10 } },
                            grid: { color: "#00000022", lineWidth: 2 },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
              <Strip title="Investment Thesis" items={data.executive_view?.investment_thesis} />
              <Strip title="Key Risks" items={data.executive_view?.key_risks} />
              <Strip title="Decision Gates" items={data.executive_view?.decision_gates} />
            </>
          )}

          {activeView === "strategy_view" && (
            <>
              <div className="border-[4px] border-black bg-white p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                <h4 className="mb-2 border-b-[3px] border-black pb-1 font-black text-xs uppercase text-black">Five Forces Intensity Map</h4>
                <div className="h-[230px]">
                  <Bar
                    data={{
                      labels: (data.strategy_view?.porters_five_forces || []).map((x) => x.force || "Force"),
                      datasets: [
                        {
                          label: "Intensity Score",
                          data: (data.strategy_view?.porters_five_forces || []).map((x) => toNumber(x.score, x.intensity === "High" ? 80 : x.intensity === "Medium" ? 55 : 30)),
                          backgroundColor: "#FF69B4",
                          borderColor: "#000",
                          borderWidth: 3,
                        },
                      ],
                    }}
                    options={{
                      ...chartBaseOptions(),
                      scales: {
                        x: { ticks: { color: "#000", font: { family: "monospace", weight: "bold", size: 10 } }, grid: { color: "#00000022" } },
                        y: { min: 0, max: 100, ticks: { color: "#000", font: { family: "monospace", weight: "bold" } }, grid: { color: "#00000022" } },
                      },
                    }}
                  />
                </div>
              </div>
              <Strip
                title="TAM / SAM / SOM"
                items={[
                  `TAM: ${data.strategy_view?.tam_sam_som?.tam || "Not Disclosed"}`,
                  `SAM: ${data.strategy_view?.tam_sam_som?.sam || "Not Disclosed"}`,
                  `SOM: ${data.strategy_view?.tam_sam_som?.som || "Not Disclosed"}`,
                ]}
              />
              <Strip title="Porter's Five Forces" items={data.strategy_view?.porters_five_forces?.map((x) => `${x.force}: ${x.intensity} — ${x.note}`)} />
              <Strip title="Value Chain" items={data.strategy_view?.value_chain} />
              <Strip title="Moat Durability" items={[data.strategy_view?.moat_durability]} />
              <Strip title="Scenario Planning" items={data.strategy_view?.scenarios?.map((x) => `${x.case}: ${x.assumption} => ${x.impact}`)} />
              <Strip title="Strategy Scorecard" items={data.strategy_view?.strategy_scorecard?.map((x) => `${x.dimension}: ${x.score} (${x.note})`)} />
            </>
          )}

          {activeView === "finance_view" && (
            <>
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="border-[4px] border-black bg-white p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)] -rotate-1">
                  <h4 className="mb-2 border-b-[3px] border-black pb-1 font-black text-xs uppercase text-black">Financial Health Scorecard</h4>
                  <div className="h-[220px]">
                    <Bar
                      data={{
                        labels: (data.finance_view?.financial_health_scorecard || []).map((x) => x.dimension || "Metric"),
                        datasets: [
                          {
                            label: "Score",
                            data: (data.finance_view?.financial_health_scorecard || []).map((x) => toNumber(x.score, 50)),
                            backgroundColor: ["#39FF14", "#FFD700", "#00FFFF", "#FF4500", "#FF69B4"],
                            borderColor: "#000",
                            borderWidth: 3,
                          },
                        ],
                      }}
                      options={{
                        ...chartBaseOptions(),
                        scales: {
                          x: { ticks: { color: "#000", font: { family: "monospace", weight: "bold", size: 10 } }, grid: { color: "#00000022" } },
                          y: { min: 0, max: 100, ticks: { color: "#000", font: { family: "monospace", weight: "bold" } }, grid: { color: "#00000022" } },
                        },
                      }}
                    />
                  </div>
                </div>
                <div className="border-[4px] border-black bg-[#FDFBF7] p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)] rotate-1">
                  <h4 className="mb-2 border-b-[3px] border-black pb-1 font-black text-xs uppercase text-black">3-Period Trend</h4>
                  <div className="h-[220px]">
                    <Line
                      data={{
                        labels: (data.finance_view?.three_period_trend || []).map((x) => x.period || "T"),
                        datasets: [
                          {
                            label: "Growth",
                            data: (data.finance_view?.three_period_trend || []).map((x) => toNumber(x.growth, 50)),
                            borderColor: "#39FF14",
                            backgroundColor: "#39FF1433",
                            borderWidth: 3,
                            tension: 0.35,
                          },
                          {
                            label: "Profitability",
                            data: (data.finance_view?.three_period_trend || []).map((x) => toNumber(x.profitability, 50)),
                            borderColor: "#FFD700",
                            backgroundColor: "#FFD70033",
                            borderWidth: 3,
                            tension: 0.35,
                          },
                          {
                            label: "Risk",
                            data: (data.finance_view?.three_period_trend || []).map((x) => toNumber(x.risk, 50)),
                            borderColor: "#FF4500",
                            backgroundColor: "#FF450033",
                            borderWidth: 3,
                            tension: 0.35,
                          },
                        ],
                      }}
                      options={{
                        ...chartBaseOptions(),
                        scales: {
                          x: { ticks: { color: "#000", font: { family: "monospace", weight: "bold", size: 10 } }, grid: { color: "#00000022" } },
                          y: { min: 0, max: 100, ticks: { color: "#000", font: { family: "monospace", weight: "bold" } }, grid: { color: "#00000022" } },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
              <Strip title="Driver Tree" items={data.finance_view?.driver_tree} />
              <Strip title="Unit Economics" items={data.finance_view?.unit_economics?.map((x) => `${x.metric}: ${x.value} (${x.comment})`)} />
              <Strip title="Margin Bridge" items={data.finance_view?.margin_bridge} />
              <Strip title="Sensitivity Analysis" items={data.finance_view?.sensitivity?.map((x) => `${x.variable} ${x.change}: ${x.effect}`)} />
            </>
          )}

          {activeView === "benchmark_view" && (
            <>
              <div className="border-[4px] border-black bg-white p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                <h4 className="mb-2 border-b-[3px] border-black pb-1 font-black text-xs uppercase text-black">Percentile Ranking Curve</h4>
                <div className="h-[220px]">
                  <Line
                    data={{
                      labels: (data.benchmark_view?.normalized_comparison || []).map((x) => x.metric || "Metric"),
                      datasets: [
                        {
                          label: "Percentile Rank",
                          data: (data.benchmark_view?.normalized_comparison || []).map((x) => toNumber(x.percentile_rank, 50)),
                          borderColor: "#00FFFF",
                          backgroundColor: "#00FFFF33",
                          borderWidth: 3,
                          tension: 0.35,
                        },
                      ],
                    }}
                    options={{
                      ...chartBaseOptions(),
                      scales: {
                        x: { ticks: { color: "#000", font: { family: "monospace", weight: "bold", size: 10 } }, grid: { color: "#00000022" } },
                        y: { min: 0, max: 100, ticks: { color: "#000", font: { family: "monospace", weight: "bold" } }, grid: { color: "#00000022" } },
                      },
                    }}
                  />
                </div>
              </div>
              <Strip title="Peer Set Methodology" items={[data.benchmark_view?.peer_set_methodology]} />
              <Strip title="Normalized Comparison" items={data.benchmark_view?.normalized_comparison?.map((x) => `${x.metric}: Co ${x.company} | Peer ${x.peer_median} | Rank ${x.percentile_rank}`)} />
              <Strip title="Gap To Best" items={data.benchmark_view?.gap_to_best?.map((x) => `${x.metric}: Best ${x.best_in_class} | Co ${x.company} | Gap ${x.gap}`)} />
              <Strip title="Recommended Action Plan" items={data.recommended_actions?.map((x) => `${x.horizon} | ${x.priority} | ${x.owner}: ${x.action}`)} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

