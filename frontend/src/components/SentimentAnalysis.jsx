import { m } from "framer-motion"

export default function SentimentAnalysis({ data }) {
    if (!data) return null

    const sentiment = data.sentiment_score || 50
    const tone = data.tone_analysis || {}

    const getSentimentColor = (score) => {
        if (score >= 70) return "bg-[#39FF14]"
        if (score >= 50) return "bg-[#FFD700]"
        return "bg-[#FF0000]"
    }

    const getSentimentText = (score) => {
        if (score >= 70) return "text-black"
        if (score >= 50) return "text-black"
        return "text-white"
    }

    const getToneColors = (tone) => {
        if (tone === "Bullish") return { bg: "bg-[#39FF14]", text: "text-black", accent: "text-black" }
        if (tone === "Bearish") return { bg: "bg-[#FF0000]", text: "text-white", accent: "text-white" }
        return { bg: "bg-[#FFD700]", text: "text-black", accent: "text-black" }
    }

    const colors = getToneColors(tone.tone)

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#00FFFF] border-[6px] border-black p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)] rotate-1 mt-10"
        >
            <div className="mb-6 border-b-[5px] border-black pb-4">
                <h2 className="text-4xl font-black text-black uppercase tracking-widest">📊 SENTIMENT 📊</h2>
            </div>

            {/* Main Sentiment Score */}
            <m.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`mb-6 p-8 ${getSentimentColor(sentiment)} ${getSentimentText(sentiment)} border-[5px] border-black shadow-[10px_10px_0px_rgba(0,0,0,1)]`}
            >
                <div className="text-center">
                    <div className="text-6xl font-black mb-2">{Math.round(sentiment)}</div>
                    <p className="font-black text-lg uppercase tracking-widest">
                        {sentiment >= 70 ? "BULLISH 🚀" : sentiment >= 50 ? "NEUTRAL ⚖️" : "BEARISH 📉"}
                    </p>
                </div>
                {/* Visual Bar */}
                <div className="mt-4 bg-black border-[3px] border-white h-8">
                    <div
                        className={`h-full ${getSentimentColor(sentiment)} transition-all`}
                        style={{ width: `${sentiment}%` }}
                    />
                </div>
            </m.div>

            {/* Tone Analysis */}
            {tone.tone && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`p-6 ${colors.bg} ${colors.text} border-[5px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] mb-6 -rotate-1`}
                >
                    <h3 className="font-black text-lg mb-3 uppercase tracking-widest">→ MANAGEMENT TONE</h3>
                    <p className={`text-3xl font-black mb-3 uppercase`}>{tone.tone}</p>
                    {tone.confidence && (
                        <p className="font-mono font-bold">
                            Confidence: <span className="font-black">{tone.confidence}%</span>
                        </p>
                    )}
                    {tone.summary && (
                        <p className="font-mono font-bold mt-3 border-t-[3px] border-current pt-2">{tone.summary}</p>
                    )}
                </m.div>
            )}
        </m.div>
    )
}
