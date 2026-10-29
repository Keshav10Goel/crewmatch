import { Boxes } from "lucide-react";
export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="inline-flex items-center gap-2 font-semibold tracking-tight">
    <span className="grid h-9 w-9 place-items-center rounded-xl border border-violet-300/20 bg-violet-400/10 text-violet-200"><Boxes size={19} /></span>
    {!compact && <span>Crew<span className="gradient-text">Match</span></span>}
  </span>;
}
