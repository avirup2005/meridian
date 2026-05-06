import { m } from "framer-motion"

export default function RedFlags({ data }) {
    if (!data) return null

    const severityBg = {
        HIGH: "bg-red-600",
        MEDIUM: "bg-[#FFD700]",
        LOW: "bg-[#39FF14]"
    }
    const severityText = {
        HIGH: "text-white",
        MEDIUM: "text-black",
        LOW: "text-black"
    }

    const severity = data.detailed_analysis?.severity || "UNKNOWN"
    const bgClass = severityBg[severity] || "bg-[#FF4500]"
    const textClass = severityText[severity] || "text-white"

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${bgClass} ${textClass} border-[6px] border-black p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)] rotate-2 mt-10`}
        >
            <div className="flex items-center justify-between mb-6 border-b-[5px] border-black pb-4">
                <h2 className="text-4xl font-black uppercase tracking-widest">🚩 RED FLAGS 🚩</h2>
                <div className="border-[4px] border-black bg-black px-4 py-2 font-mono font-black text-sm">
                    <span className={`${bgClass === "bg-red-600" ? "text-red-500" : bgClass === "bg-[#FFD700]" ? "text-[#FFD700]" : "text-[#39FF14]"}`}>
                        {severity}
                    </span>
                </div>
            </div>

            {data.detected_flags && data.detected_flags.length > 0 && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6 border-[4px] border-black bg-black p-4"
                >
                    <h3 className="text-[#FF0000] font-black text-lg uppercase mb-3 tracking-wide">AUTOMATED DETECTION</h3>
                    <ul className="space-y-2">
                        {data.detected_flags.map((flag, i) => (
                            <li key={i} className="font-mono text-sm font-bold text-[#FFD700] border-l-[4px] border-[#FF0000] pl-2">
                                ▸ {flag}
                            </li>
                        ))}
                    </ul>
                </m.div>
            )}

            {data.detailed_analysis && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="border-[4px] border-black bg-black p-4"
                >
                    <h3 className="text-[#FF0000] font-black text-lg uppercase mb-3 tracking-wide">DETAILED ANALYSIS</h3>
                    <div className="space-y-3">
                        {data.detailed_analysis.flags && (
                            <div>
                                <p className="text-[#FFD700] font-black text-sm uppercase mb-2">Specific Flags:</p>
                                <ul className="space-y-1">
                                    {data.detailed_analysis.flags.map((flag, i) => (
                                        <li key={i} className="text-[#00ff00] font-mono text-sm border-l-[3px] border-[#FFD700] pl-2">
                                            → {flag}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {data.detailed_analysis.summary && (
                            <p className="font-mono font-bold text-[#FF0000] uppercase mt-3 border-[3px] border-[#FF0000] p-2">{data.detailed_analysis.summary}</p>
                        )}
                    </div>
                </m.div>
            )}
        </m.div>
    )
}
