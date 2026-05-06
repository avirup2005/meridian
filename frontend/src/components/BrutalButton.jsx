import { m } from "framer-motion"

export default function BrutalButton({ children, onClick, className = "", color = "bg-[#FFD700]" }) {
  return (
    <m.button
      whileHover={{ x: 4, y: 4, boxShadow: "2px 2px 0px rgba(0,0,0,1)" }}
      whileTap={{ x: 8, y: 8, boxShadow: "0px 0px 0px rgba(0,0,0,1)", scale: 0.95, rotate: -2 }}
      onClick={onClick}
      className={`relative border-[4px] border-black font-black uppercase tracking-wider px-6 py-3 shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all hover:bg-black hover:text-white ${color} ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-0 hover:opacity-100 pointer-events-none transition-opacity" />
    </m.button>
  )
}
