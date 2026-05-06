import { useState } from "react"
import { m } from "framer-motion"
import { addToWatchlist, removeFromWatchlist } from "../api"

export default function Watchlist({ onUpdate }) {
    const [watchlist, setWatchlist] = useState([])
    const [inputTicker, setInputTicker] = useState("")
    const [inputCompany, setInputCompany] = useState("")

    const handleAddToWatchlist = async () => {
        if (inputTicker && inputCompany) {
            await addToWatchlist(inputTicker, inputCompany)
            setWatchlist([...watchlist, { ticker: inputTicker, company_name: inputCompany }])
            setInputTicker("")
            setInputCompany("")
            onUpdate?.()
        }
    }

    const handleRemove = async (ticker) => {
        await removeFromWatchlist(ticker)
        setWatchlist(watchlist.filter((item) => item.ticker !== ticker))
        onUpdate?.()
    }

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#FFD700] border-[6px] border-black p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)] -rotate-1 mt-10"
        >
            <div className="mb-6 border-b-[5px] border-black pb-4">
                <h2 className="text-4xl font-black text-black uppercase tracking-widest">⭐ WATCHLIST ⭐</h2>
            </div>

            {/* Add to Watchlist Form */}
            <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-6 p-4 bg-black border-[4px] border-[#FFD700]"
            >
                <h3 className="text-[#FFD700] font-black mb-4 uppercase tracking-wide">+ ADD TICKER</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="TICKER"
                        value={inputTicker}
                        onChange={(e) => setInputTicker(e.target.value.toUpperCase())}
                        className="flex-1 px-4 py-2 bg-[#FFD700] border-[3px] border-black font-mono font-black text-black placeholder-gray-600"
                    />
                    <input
                        type="text"
                        placeholder="CO. NAME"
                        value={inputCompany}
                        onChange={(e) => setInputCompany(e.target.value)}
                        className="flex-1 px-4 py-2 bg-[#00FFFF] border-[3px] border-black font-mono font-black text-black placeholder-gray-600"
                    />
                    <button
                        onClick={handleAddToWatchlist}
                        className="px-6 py-2 bg-[#39FF14] text-black border-[3px] border-black font-black uppercase tracking-widest hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition"
                    >
                        ADD
                    </button>
                </div>
            </m.div>

            {/* Watchlist Items */}
            <div className="space-y-3">
                {watchlist.length === 0 ? (
                    <p className="text-black font-mono font-bold bg-white border-[2px] border-black p-3">// EMPTY WATCHLIST //</p>
                ) : (
                    watchlist.map((item, i) => (
                        <m.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`flex justify-between items-center p-4 bg-white border-[4px] border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] ${i % 2 === 0 ? "rotate-1" : "-rotate-1"}`}
                        >
                            <div className="flex-1">
                                <div className="text-black font-black text-lg uppercase">{item.ticker}</div>
                                <div className="text-black font-mono font-bold text-sm">{item.company_name}</div>
                            </div>
                            <button
                                onClick={() => handleRemove(item.ticker)}
                                className="p-3 bg-[#FF0000] border-[3px] border-black text-white font-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition uppercase text-sm"
                            >
                                ✕ DEL
                            </button>
                        </m.div>
                    ))
                )}
            </div>
        </m.div>
    )
}
