import { m } from "framer-motion"

export default function ESGScore({ data }) {
    if (!data?.esg) return null

    const esg = data.esg
    const scores = [
        { label: "Environment", value: esg.environmental_score, color: "bg-[#39FF14]", textColor: "text-black" },
        { label: "Social", value: esg.social_score, color: "bg-[#00FFFF]", textColor: "text-black" },
        { label: "Governance", value: esg.governance_score, color: "bg-[#FF4500]", textColor: "text-white" },
    ]

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#FF4500] border-[6px] border-black p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)] -rotate-1 mt-10"
        >
            <div className="mb-6 border-b-[5px] border-black pb-4">
                <h2 className="text-4xl font-black text-white uppercase tracking-widest">🌱 ESG SCORE 🌱</h2>
            </div>

            {/* Overall Score Highlight */}
            <m.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="mb-6 p-6 bg-black border-[5px] border-[#FFD700] text-center shadow-[8px_8px_0px_rgba(0,0,0,1)]"
            >
                <div className="text-6xl font-black text-[#FFD700] mb-2">
                    {esg.overall_esg || "N/A"}
                </div>
                <p className="text-[#39FF14] text-lg font-black uppercase tracking-widest">Overall ESG Rating</p>
            </m.div>

            {/* Individual Scores */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {scores.map((score, i) => (
                    <m.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`${score.color} ${score.textColor} p-4 border-[5px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] ${i === 0 ? "rotate-1" : i === 1 ? "-rotate-1" : "rotate-2"}`}
                    >
                        <div className="text-3xl font-black mb-2">{score.value || "N/A"}</div>
                        <p className="font-black uppercase tracking-wide">{score.label}</p>
                    </m.div>
                ))}
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-2 gap-4">
                {esg.strengths && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="p-4 bg-black border-[4px] border-[#39FF14]"
                    >
                        <h3 className="text-[#39FF14] font-black mb-3 uppercase tracking-wide">✓ STRENGTHS</h3>
                        <ul className="space-y-2">
                            {esg.strengths.map((strength, i) => (
                                <li key={i} className="text-[#00FFFF] font-mono text-sm font-bold border-l-[3px] border-[#39FF14] pl-2">
                                    • {strength}
                                </li>
                            ))}
                        </ul>
                    </m.div>
                )}
                {esg.weaknesses && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="p-4 bg-black border-[4px] border-[#FF0000]"
                    >
                        <h3 className="text-[#FF0000] font-black mb-3 uppercase tracking-wide">✗ WEAKNESSES</h3>
                        <ul className="space-y-2">
                            {esg.weaknesses.map((weakness, i) => (
                                <li key={i} className="text-[#FFD700] font-mono text-sm font-bold border-l-[3px] border-[#FF0000] pl-2">
                                    • {weakness}
                                </li>
                            ))}
                        </ul>
                    </m.div>
                )}
            </div>
        </m.div>
    )
}
