import { motion } from "framer-motion";

export function NumberBoard({ called }: { called: number[] }) {
  const latest = called[called.length - 1];
  return (
    <div className="grid grid-cols-10 gap-1.5">
      {Array.from({ length: 90 }).map((_, i) => {
        const n = i + 1;
        const done = called.includes(n);
        const isLatest = n === latest;
        return (
          <motion.div key={n} initial={false} animate={isLatest ? { scale: [1, 1.25, 1] } : {}} transition={{ duration: 0.5 }}
            className={`grid aspect-square place-items-center rounded-lg text-xs font-bold ${
              isLatest ? "gradient-brand text-white shadow-xl shadow-brand/60 ring-2 ring-brand-glow"
              : done ? "bg-white/15 text-foreground"
              : "bg-white/[0.03] text-muted-foreground"}`}>
            {n}
          </motion.div>
        );
      })}
    </div>
  );
}