import { m } from "framer-motion"

export default function Anomalies({ data }) {
    if (!data?.anomalies) return null

    const anomalies = data.anomalies

    const getSeverityColor = (severity) => {
        if (severity === "HIGH") return "bg-[#FF0000]"
        if (severity === "MEDIUM") return "bg-[#FFD700]"
        return "bg-[#39FF14]"
    }

    const getSeverityText = (severity) => {
        if (severity === "HIGH") return "text-white"
        if (severity === "MEDIUM") return "text-black"
        return "text-black"
    }

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#FF4500] border-[6px] border-black p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)] rotate-2 mt-10"
        >
            <div className="mb-6 border-b-[5px] border-black pb-4">
                <h2 className="text-4xl font-black text-white uppercase tracking-widest">⚡ ANOMALIES ⚡</h2>
            </div>

            {/* Severity Badge */}
            {anomalies.severity && (
                <m.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`mb-6 p-6 ${getSeverityColor(anomalies.severity)} ${getSeverityText(anomalies.severity)} border-[5px] border-black shadow-[10px_10px_0px_rgba(0,0,0,1)]`}
                >
                    <p className="font-black text-center text-xl uppercase tracking-widest">
                        SEVERITY: {anomalies.severity}
                    </p>
                </m.div>
            )}

            {/* Anomalies List */}
            {anomalies.anomalies && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6 p-6 bg-black border-[4px] border-[#FF0000]"
                >
                    <h3 className="text-[#FF0000] font-black mb-4 uppercase tracking-widest">▸ DETECTED</h3>
                    <ul className="space-y-3">
                        {anomalies.anomalies.map((anomaly, i) => (
                            <li key={i} className="text-[#00ff00] font-mono border-l-[4px] border-[#FFD700] pl-4 font-bold">
                                ▹ {anomaly}
                            </li>
                        ))}
                    </ul>
                </m.div>
            )}

            {/* Recommended Action */}
            {anomalies.recommended_action && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 bg-black border-[4px] border-[#39FF14] shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                >
                    <h3 className="text-[#39FF14] font-black mb-3 uppercase tracking-widest">→ NEXT STEPS</h3>
                    <p className="text-[#00FFFF] font-mono font-bold">{anomalies.recommended_action}</p>
                </m.div>
            )}
        </m.div>
    )
}
