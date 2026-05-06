import { m } from "framer-motion"

export default function CashFlowAnalysis({ data }) {
    if (!data?.cash_flow) return null

    const cf = data.cash_flow
    const flows = [
        { label: "Operating", value: cf.operating_cash_flow, color: "bg-[#00FFFF]", text: "text-black" },
        { label: "Investing", value: cf.investing_cash_flow, color: "bg-[#FF4500]", text: "text-white" },
        { label: "Financing", value: cf.financing_cash_flow, color: "bg-[#FF69B4]", text: "text-white" },
        { label: "Free Cash Flow", value: cf.free_cash_flow, color: "bg-[#39FF14]", text: "text-black" }
    ]

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#FFD700] border-[6px] border-black p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)] -rotate-1 mt-10"
        >
            <div className="mb-6 border-b-[5px] border-black pb-4">
                <h2 className="text-4xl font-black text-black uppercase tracking-widest">💰 CASH FLOWS 💰</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                {flows.map((flow, i) => (
                    <m.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-6 ${flow.color} ${flow.text} border-[5px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] ${i % 2 === 0 ? "rotate-1" : "-rotate-1"}`}
                    >
                        <p className="font-black mb-2 uppercase tracking-wide text-sm">{flow.label}</p>
                        <p className="text-2xl font-black">{flow.value || "N/A"}</p>
                    </m.div>
                ))}
            </div>

            {cf.analysis && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 bg-black border-[5px] border-[#00FFFF] shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                >
                    <h3 className="text-[#00FFFF] font-black mb-3 uppercase tracking-widest">▸ CASH HEALTH</h3>
                    <p className="text-[#39FF14] font-mono font-bold">{cf.analysis}</p>
                </m.div>
            )}
        </m.div>
    )
}
