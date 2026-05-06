import { m } from "framer-motion"

function RatioCard({ title, metrics, color }) {
    return (
        <m.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`${color} border-[5px] border-black p-6 mb-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] rotate-1`}
        >
            <h3 className="text-2xl font-black text-white uppercase mb-4 border-b-[4px] border-black pb-2">{title}</h3>
            <div className="space-y-2">
                {Object.entries(metrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between border-[3px] border-black bg-black px-3 py-2 font-mono text-sm font-bold">
                        <span className="text-[#FFD700]">{key.replace(/_/g, " ").toUpperCase()}</span>
                        <span className="text-[#00ff00]">{value}</span>
                    </div>
                ))}
            </div>
        </m.div>
    )
}

export default function FinancialRatios({ data }) {
    if (!data) return null

    return (
        <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 bg-black border-[6px] border-black shadow-[12px_12px_0px_rgba(0,0,0,1)] -rotate-1"
        >
            <div className="overflow-hidden border-[5px] border-[#FFD700] bg-[#FFD700] mb-6">
                <m.div
                    animate={{ x: ["100%", "-100%"] }}
                    transition={{ ease: "linear", duration: 6, repeat: Infinity }}
                    className="whitespace-nowrap py-3 px-4"
                >
                    <span className="font-black text-lg text-black uppercase tracking-widest">
            /// FINANCIAL RATIOS /// RATIO ANALYSIS /// LEVERAGE METRICS /// PROFITABILITY ///
                    </span>
                </m.div>
            </div>
            {data.extracted_metrics && (
                <RatioCard title="EXTRACTED METRICS" metrics={data.extracted_metrics} color="bg-[#00FFFF]" />
            )}
            {data.calculated_ratios && (
                <>
                    <RatioCard title="PROFITABILITY RATIOS" metrics={data.calculated_ratios.profitability} color="bg-[#FF4500]" />
                    <RatioCard title="LEVERAGE RATIOS" metrics={data.calculated_ratios.leverage} color="bg-[#FF69B4]" />
                </>
            )}
        </m.div>
    )
}
