import { useState, useRef, useEffect } from "react"
import { m, AnimatePresence } from "framer-motion"
import { askQuestion } from "../api"

export default function Chat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const viewportRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 300)
    }
  }, [isOpen])

  const scrollToBottom = () => {
    if (!viewportRef.current) return
    viewportRef.current.scrollTop = viewportRef.current.scrollHeight
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    setMessages((prev) => [...prev, { id: Date.now(), role: "user", text: trimmed }])
    setInput("")
    setIsLoading(true)
    setTimeout(scrollToBottom, 20)

    try {
      const data = await askQuestion(trimmed)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          text: data.answer || data.message || "ZERO SIGNAL RECOVERED.",
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          text: `TRANSMISSION FAILURE: ${err?.response?.data?.message || err.message || "UNKNOWN FAULT"}`,
        },
      ])
    } finally {
      setIsLoading(false)
      setTimeout(scrollToBottom, 50)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
          animate={{ scale: 1, opacity: 1, rotate: 1 }}
          exit={{ scale: 0.3, opacity: 0, rotate: 10, y: 200 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="fixed bottom-20 right-6 z-[900] w-[95vw] max-w-[480px] border-[5px] border-black bg-white shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col"
          style={{ maxHeight: "70vh" }}
        >
          {/* ========= HEADER BAR ========= */}
          <div className="flex items-center justify-between border-b-[5px] border-black bg-[#FFD700] px-4 py-3">
            <h2 className="font-black text-lg md:text-xl uppercase tracking-tight text-black leading-none">
              /// TERMINAL: GEMINI-2.0-FLASH-LITE ///
            </h2>
            <m.button
              whileHover={{ scale: 1.15, rotate: 5 }}
              whileTap={{ scale: 0.9, rotate: -10 }}
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center border-[4px] border-black bg-red-600 font-black text-2xl text-white shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:bg-red-700"
            >
              ✕
            </m.button>
          </div>

          {/* ========= MESSAGE FEED ========= */}
          <div
            ref={viewportRef}
            className="flex-1 space-y-4 overflow-y-auto p-4"
            style={{ minHeight: "250px", maxHeight: "45vh" }}
          >
            {messages.length === 0 && (
              <div className="border-[3px] border-dashed border-black bg-[#FDFBF7] p-4 font-mono font-bold text-black">
                <p>{">"} GEMINI TERMINAL v2.0-FLASH-LITE</p>
                <p>{">"} RAG PIPELINE: <span className="bg-[#00ff00] text-black px-1 font-black">ONLINE</span></p>
                <p className="mt-2">{">"} TYPE QUERY TO BEGIN INTERROGATION...</p>
              </div>
            )}

            {messages.map((msg) => (
              <m.div
                key={msg.id}
                initial={{ opacity: 0, x: msg.role === "user" ? 40 : -40, rotate: msg.role === "user" ? 3 : -3 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] border-[4px] border-black p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] ${
                    msg.role === "user"
                      ? "bg-[#FF69B4] text-black font-bold"
                      : "bg-[#00FFFF] text-black font-mono font-bold"
                  }`}
                >
                  <div className="mb-1.5 border-b-[3px] border-black pb-1 text-[10px] font-black uppercase tracking-[0.2em]">
                    {msg.role === "user" ? "OPERATOR" : "AI_OUTPUT"}
                  </div>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </m.div>
            ))}

            {isLoading && (
              <m.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-start"
              >
                <div className="max-w-[85%] border-[4px] border-black bg-[#00FFFF] p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <div className="mb-1.5 border-b-[3px] border-black pb-1 text-[10px] font-black uppercase tracking-[0.2em]">
                    AI_OUTPUT
                  </div>
                  <p className="font-mono font-bold text-sm animate-pulse flex items-center gap-2">
                    <m.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
                      className="inline-block h-4 w-2 bg-black"
                    />
                    CRUNCHING DATA...
                  </p>
                </div>
              </m.div>
            )}
          </div>

          {/* ========= INPUT AREA ========= */}
          <div className="border-t-[5px] border-black bg-[#FDFBF7] p-3 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="ENTER QUERY..."
              className="flex-1 border-[4px] border-black px-3 py-2.5 font-mono font-extrabold text-black outline-none placeholder:text-black/40 focus:bg-yellow-100 transition-colors"
            />
            <m.button
              whileHover={{ x: 3, y: 3, boxShadow: "2px 2px 0px rgba(0,0,0,1)" }}
              whileTap={{ x: 6, y: 6, boxShadow: "0px 0px 0px rgba(0,0,0,1)", scale: 0.95 }}
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="border-[4px] border-black bg-[#FF4500] px-5 py-2.5 font-black uppercase text-white shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-colors hover:bg-[#FF6633] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              TRANSMIT
            </m.button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
