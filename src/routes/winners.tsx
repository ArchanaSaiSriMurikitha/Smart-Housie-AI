import { motion } from "framer-motion";
import { PageShell, GlassCard } from "@/components/Layout";
import { useRoom } from "@/lib/room";
import { PATTERN_LABELS } from "@/lib/tambola";
import { useDocumentMeta } from "@/lib/head";


function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.span key={i} className="absolute h-2 w-2 rounded-sm"
          style={{ left: `${Math.random() * 100}%`, background: ["#a855f7", "#3b82f6", "#eab308", "#ec4899"][i % 4] }}
          initial={{ y: -20, rotate: 0, opacity: 0 }}
          animate={{ y: "120%", rotate: 720, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }} />
      ))}
    </div>
  );
}

function Winners() {
  useDocumentMeta("Winners — Digital Housie", "Winners of each pattern and the current leaderboard.");
  const { state } = useRoom();
  const leaderboard = [...state.players].sort((a, b) => b.wins.length - a.wins.length || b.marked.length - a.marked.length);
  return (
    <PageShell>
      <div className="relative">
        {state.winners.length > 0 && <Confetti />}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black md:text-5xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <span className="gradient-text">Winners</span> 🏆
          </h1>
          <p className="mt-2 text-muted-foreground">Legends of the round.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {state.winners.map((w, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <GlassCard className="text-center">
                <div className="text-4xl">🏆</div>
                <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{PATTERN_LABELS[w.pattern]}</div>
                <div className="mt-1 text-2xl font-bold">{w.playerName}</div>
                <div className="mt-1 text-sm text-muted-foreground">{new Date(w.ts).toLocaleTimeString()}</div>
              </GlassCard>
            </motion.div>
          ))}
          {state.winners.length === 0 && (
            <GlassCard className="md:col-span-2 lg:col-span-3 text-center">
              <div className="text-muted-foreground">No winners yet — the game is heating up.</div>
            </GlassCard>
          )}
        </div>
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Leaderboard</h2>
          <GlassCard>
            <div className="space-y-2">
              {leaderboard.length === 0 && <div className="text-sm text-muted-foreground">No players yet.</div>}
              {leaderboard.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${i < 3 ? "gradient-brand text-white" : "bg-white/10"}`}>{i + 1}</div>
                    <div className="text-2xl">{p.avatar}</div>
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.wins.map((w) => PATTERN_LABELS[w]).join(" · ") || "—"}</div>
                    </div>
                  </div>
                  <div className="text-sm"><span className="font-bold">{p.wins.length}</span> wins</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
}

export default Winners;
