import { m } from "framer-motion"

export default function PortfolioAnalysis({ data }) {
    if (!data?.portfolio) return null

    const portfolio = data.portfolio

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#FF69B4] border-[6px] border-black p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)] -rotate-2 mt-10"
        >
            <div className="mb-6 border-b-[5px] border-black pb-4">
                <h2 className="text-4xl font-black text-white uppercase tracking-widest">💼 PORTFOLIO 💼</h2>
            </div>

            {/* Portfolio Overview */}
            <m.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="mb-6 p-8 bg-black border-[5px] border-[#FFD700] shadow-[10px_10px_0px_rgba(0,0,0,1)]"
            >
                <div className="text-center">
                    <div className="text-5xl font-black text-[#FFD700] mb-2">
                        {portfolio.num_companies}
                    </div>
                    <p className="text-[#00FFFF] font-black text-lg uppercase tracking-widest">Companies Tracked</p>
                </div>
            </m.div>

            {/* Companies List */}
            <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6 p-6 bg-black border-[4px] border-[#00FFFF]"
            >
                <h3 className="text-[#00FFFF] font-black mb-4 uppercase tracking-widest">▸ HOLDINGS</h3>
                <div className="grid grid-cols-2 gap-3">
                    {portfolio.companies.map((company, i) => (
                        <m.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`p-3 bg-[#39FF14] text-black border-[3px] border-black font-mono font-bold ${i % 2 === 0 ? "rotate-1" : "-rotate-1"}`}
                        >
                            {company}
                        </m.div>
                    ))}
                </div>
            </m.div>

            {/* Analysis Summary */}
            {portfolio.analysis && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 bg-black border-[4px] border-[#FF0000] shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                >
                    <h3 className="text-[#FF0000] font-black mb-3 uppercase tracking-widest">→ SUMMARY</h3>
                    <p className="text-[#39FF14] font-mono font-bold">{portfolio.analysis}</p>
                </m.div>
            )}
        </m.div>
    )
}
