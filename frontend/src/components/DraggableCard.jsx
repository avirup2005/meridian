import { m } from "framer-motion"
import { Pin } from "lucide-react"

export default function DraggableCard({ title, value, rotation = "-rotate-1", color = "bg-[#00FFFF]" }) {
  return (
    <m.div
      drag
      dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
      whileDrag={{ scale: 1.15, zIndex: 100, rotate: 5 }}
      whileHover={{ rotate: 3 }}
      className={`absolute w-64 border-[4px] border-black p-5 shadow-[8px_8px_0px_rgba(0,0,0,1)] ${color} ${rotation} cursor-grab active:cursor-grabbing hover:z-50 group hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-shadow duration-200`}
    >
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-white p-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] border-[3px] border-black group-hover:-translate-y-2 transition-transform duration-200">
        <Pin className="h-5 w-5 text-red-600 fill-current animate-pulse" />
      </div>
      <h3 className="mb-3 font-black uppercase tracking-widest text-black text-xl border-b-[4px] border-black pb-2 group-hover:tracking-[0.3em] transition-all duration-300">{title}</h3>
      <p className="font-mono text-4xl font-extrabold text-black transform group-hover:scale-110 origin-left transition-transform duration-300">{value}</p>
    </m.div>
  )
}
