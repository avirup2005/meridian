import { m } from "framer-motion"

export default function AnalysisHistory({ history }) {
    if (!history || history.length === 0) {
        return (
            <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 bg-black border-[5px] border-[#00ff00]"
            >
                <p className="text-[#00ff00] font-mono font-bold">// NO HISTORY AVAILABLE //</p>
            </m.div>
        )
    }

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black border-[6px] border-[#00ff00] p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)] rotate-1 mt-10"
        >
            <div className="mb-6 border-b-[5px] border-[#00ff00] pb-4">
                <h2 className="text-4xl font-black text-[#00ff00] uppercase tracking-widest">📚 HISTORY 📚</h2>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((item, i) => (
                    <m.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.05, 0.3) }}
                        className="p-4 bg-black border-[3px] border-[#00ff00]"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                                <p className="text-[#00ff00] font-black text-sm uppercase tracking-wide">{item.company}</p>
                                <p className="text-[#FFD700] font-mono text-xs mt-1 border-l-[2px] border-[#FF0000] pl-2">
                                    → {item.analysis_type.replace(/_/g, " ").toUpperCase()}
                                </p>
                            </div>
                            <p className="text-[#00FFFF] font-mono text-xs">
                                {new Date(item.timestamp).toLocaleString()}
                            </p>
                        </div>
                        <details className="text-[#39FF14] font-mono text-xs">
                            <summary className="cursor-pointer hover:text-[#FFD700] font-bold">▸ EXPAND</summary>
                            <pre className="mt-2 bg-black p-2 overflow-x-auto text-xs border-[2px] border-[#00ff00] text-[#00ff00] font-mono">
                                {JSON.stringify(item.data, null, 2).substring(0, 500)}...
                            </pre>
                        </details>
                    </m.div>
                ))}
            </div>
        </m.div>
    )
}
