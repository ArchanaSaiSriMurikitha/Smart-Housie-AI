import { motion } from "framer-motion";
import type { Ticket } from "@/lib/tambola";

type Props = {
  ticket: Ticket;
  marked: Set<number>;
  called: Set<number>;
  onMark?: (n: number) => void;
  compact?: boolean;
  playerName?: string;
};

export function TicketCard({ ticket, marked, called, onMark, compact, playerName }: Props) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] p-4 shadow-xl backdrop-blur ${compact ? "" : "glow-brand"} border border-white/15`}>
      {playerName && (
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
          <span>{playerName}</span>
          <span className="text-brand-glow">TAMBOLA</span>
        </div>
      )}
      <div className="grid grid-cols-9 gap-1.5">
        {ticket.flatMap((row, r) =>
          row.map((n, c) => {
            const isCalled = n !== null && called.has(n);
            const isMarked = n !== null && marked.has(n);
            return (
              <motion.button key={`${r}-${c}`} whileTap={{ scale: 0.9 }}
                disabled={n === null || !onMark}
                onClick={() => n !== null && onMark?.(n)}
                className={`aspect-square rounded-lg text-sm font-bold transition-all ${
                  n === null ? "bg-white/[0.02]"
                  : isMarked ? "gradient-brand text-white shadow-lg shadow-brand/40 scale-95"
                  : isCalled ? "bg-gold/20 text-gold ring-1 ring-gold/50"
                  : "bg-white/10 text-foreground hover:bg-white/20"
                } ${compact ? "text-[10px]" : ""}`}>
                {n ?? ""}
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}