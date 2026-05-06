import { m } from "framer-motion"

function ListBlock({ title, items = [], color = "bg-white" }) {
  return (
    <div className={`border-[4px] border-black ${color} p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]`}>
      <h4 className="mb-3 border-b-[3px] border-black pb-2 font-black text-lg uppercase tracking-wide text-black">
        {title}
      </h4>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={`${title}-${idx}`} className="font-mono text-sm font-bold text-black">
              ▸ {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-mono text-xs font-bold uppercase text-black/70">No signals yet.</p>
      )}
    </div>
  )
}

export default function DecisionSupport({ data, isLoading, activeView = "recommendation" }) {
  if (isLoading) {
    return (
      <div className="mt-10 border-[5px] border-black bg-[#FFD700] p-6 shadow-[10px_10px_0px_rgba(0,0,0,1)]">
        <m.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 3.5, repeat: Infinity }}
          className="flex whitespace-nowrap"
        >
          {[...Array(8)].map((_, i) => (
            <span key={i} className="mx-5 font-black text-xl uppercase text-black flex-none">
              DECISION ENGINE RUNNING • SWOT COMPILING • BENCHMARKING MARKET •
            </span>
          ))}
        </m.div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mt-10 space-y-4">
        <div className="border-[5px] border-black bg-[#00FFFF] px-5 py-4 shadow-[10px_10px_0px_rgba(0,0,0,1)] -rotate-1">
          <h2 className="font-black text-3xl md:text-4xl uppercase text-black">Decision Support System</h2>
        </div>
        <div className="border-[5px] border-black bg-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <h3 className="font-black text-2xl uppercase text-black">Should company expand?</h3>
          <p className="mt-2 font-mono text-sm font-bold uppercase text-black/70">
            Upload report and run decision support to generate pros, cons, risks, recommendation, SWOT, and benchmarking.
          </p>
        </div>
      </div>
    )
  }

  const expand = data.expand_decision || {}
  const swot = data.swot || {}
  const benchmark = data.industry_benchmarking || {}
  const showRecommendation = activeView === "recommendation"
  const showSwot = activeView === "swot"
  const showBenchmarking = activeView === "benchmarking"

  return (
    <div className="mt-10 space-y-4">
      <div className="border-[5px] border-black bg-[#00FFFF] px-5 py-4 shadow-[10px_10px_0px_rgba(0,0,0,1)] -rotate-1">
        <h2 className="font-black text-3xl md:text-4xl uppercase text-black">Decision Support System</h2>
      </div>

      <div className="border-[5px] border-black bg-white px-5 py-4 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <h3 className="font-black text-2xl uppercase text-black">Should company expand?</h3>
      </div>

      {showRecommendation && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <ListBlock title="Pros" items={expand.pros} color="bg-[#39FF14]" />
            <ListBlock title="Cons" items={expand.cons} color="bg-[#FF69B4]" />
          </div>

          <ListBlock title="Risks" items={expand.risks} color="bg-[#FFD700]" />

          <div className="border-[5px] border-black bg-black px-5 py-4 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
            <h3 className="mb-2 font-black text-xl uppercase tracking-wide text-[#FFD700]">Recommendation</h3>
            <p className="font-mono text-sm font-bold text-[#00ff00]">
              {expand.recommendation || "No recommendation generated yet."}
            </p>
          </div>
        </>
      )}

      {showSwot && (
        <div className="border-[5px] border-black bg-white p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] rotate-1">
          <h3 className="mb-4 border-b-[4px] border-black pb-2 font-black text-2xl uppercase text-black">
            SWOT Analysis
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <ListBlock title="Strengths" items={swot.strengths} color="bg-[#E6FF9A]" />
            <ListBlock title="Weaknesses" items={swot.weaknesses} color="bg-[#FFD6E8]" />
            <ListBlock title="Opportunities" items={swot.opportunities} color="bg-[#C9F9FF]" />
            <ListBlock title="Threats" items={swot.threats} color="bg-[#FFE8A3]" />
          </div>
      </div>
      )}

      {showBenchmarking && (
        <div className="border-[5px] border-black bg-[#FDFBF7] p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] -rotate-1">
          <h3 className="mb-4 border-b-[4px] border-black pb-2 font-black text-2xl uppercase text-black">
            Industry Benchmarking
          </h3>

          <div className="mb-4 space-y-2">
            <h4 className="font-black text-lg uppercase text-black">Vs Industry Average</h4>
            {(benchmark.industry_average || []).map((row, idx) => (
              <div key={`avg-${idx}`} className="grid grid-cols-4 border-[3px] border-black bg-white">
                <div className="border-r-[3px] border-black p-2 font-mono text-xs font-black uppercase">{row.metric}</div>
                <div className="border-r-[3px] border-black p-2 font-mono text-xs font-bold">{row.company_value}</div>
                <div className="border-r-[3px] border-black p-2 font-mono text-xs font-bold">{row.industry_average}</div>
                <div className="p-2 font-mono text-xs font-black uppercase">{row.position}</div>
              </div>
            ))}
            {(benchmark.industry_average || []).length === 0 && (
              <p className="font-mono text-xs font-bold uppercase text-black/70">No industry average rows yet.</p>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="font-black text-lg uppercase text-black">Vs Competitors</h4>
            {(benchmark.competitors || []).map((comp, idx) => (
              <div key={`comp-${idx}`} className="border-[3px] border-black bg-[#FFD700] p-3">
                <p className="font-black text-sm uppercase text-black">{comp.name}</p>
                <p className="font-mono text-xs font-bold text-black">{comp.summary}</p>
                <p className="mt-1 inline-block border-[2px] border-black bg-black px-2 py-1 font-mono text-[10px] font-black uppercase text-[#39FF14]">
                  {comp.position}
                </p>
              </div>
            ))}
            {(benchmark.competitors || []).length === 0 && (
              <p className="font-mono text-xs font-bold uppercase text-black/70">No competitor comparisons yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
