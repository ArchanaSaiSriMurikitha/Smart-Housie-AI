import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FaVolumeUp, FaVolumeMute, FaHandPaper, FaMagic } from "react-icons/fa";
import { PageShell, GlassCard } from "@/components/Layout";
import { NumberBoard } from "@/components/NumberBoard";
import { TicketCard } from "@/components/TicketCard";
import { useRoom } from "@/lib/room";
import { PATTERN_LABELS, PATTERNS } from "@/lib/tambola";
import { useDocumentMeta } from "@/lib/head";


function Game() {
  useDocumentMeta("Live Game — Digital Housie", "Mark your ticket and claim patterns live.");
  const { state, callNext, markNumber, toggleVoice, claimPattern } = useRoom();
  const [autoMark, setAutoMark] = useState(false);
  const you = state.me;
  const called = new Set(state.called);
  const latest = state.called.at(-1);

  const effectiveMarked = new Set(
    you ? (autoMark ? you.ticket.flat().filter((v): v is number => v !== null && called.has(v)) : you.marked) : []
  );

  return (
    <PageShell>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <GlassCard>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Latest number</div>
                <AnimatePresence mode="wait">
                  <motion.div key={latest ?? "none"} initial={{ scale: 0.5, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ opacity: 0 }} className="font-mono text-6xl font-black gradient-text">
                    {latest ?? "—"}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex flex-wrap gap-2">
                {state.role === "organizer" && (
                  <button onClick={callNext} disabled={state.status !== "running"} className="rounded-xl gradient-brand px-5 py-3 font-medium text-white shadow-lg shadow-brand/40 disabled:opacity-40">Call Next</button>
                )}
                <button onClick={toggleVoice} className="rounded-xl glass-strong px-4 py-3">{state.voiceOn ? <FaVolumeUp /> : <FaVolumeMute />}</button>
                <button onClick={() => setAutoMark(v => !v)} className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${autoMark ? "gradient-brand text-white" : "glass-strong"}`}>
                  {autoMark ? <FaMagic /> : <FaHandPaper />} {autoMark ? "Auto" : "Manual"}
                </button>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-3 text-sm text-muted-foreground">Number board · {state.called.length}/90</div>
            <NumberBoard called={state.called} />
          </GlassCard>

          {you && (
            <GlassCard>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full gradient-brand text-lg">{you.avatar}</div>
                  <div>
                    <div className="font-semibold">{you.name}</div>
                    <div className="text-xs text-muted-foreground">{effectiveMarked.size} marked · Room {state.code}</div>
                  </div>
                </div>
              </div>
              <TicketCard ticket={you.ticket} marked={effectiveMarked} called={called}
                onMark={autoMark ? undefined : (n) => markNumber(n)} playerName={you.name} />
              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                {PATTERNS.map((p) => {
                  const won = state.winners.find((w) => w.pattern === p);
                  return (
                    <button key={p} onClick={() => claimPattern(p)} disabled={!!won}
                      className={`rounded-xl px-3 py-2 text-xs font-medium ${won ? "bg-gold/20 text-gold" : "glass-strong hover:bg-white/10"}`}>
                      {PATTERN_LABELS[p]}{won ? ` · ${won.playerName}` : ""}
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          )}
        </div>

        <div className="space-y-6">
          <GlassCard>
            <div className="mb-3 font-semibold">Leaderboard</div>
            <div className="space-y-2">
              {[...state.players].sort((a, b) => b.wins.length - a.wins.length || b.marked.length - a.marked.length).slice(0, 8).map((p, i) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-white/5 p-2.5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs font-bold">{i + 1}</div>
                    <div className="text-lg">{p.avatar}</div>
                    <div className="text-sm">{p.name}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{p.wins.length}🏆 · {p.marked.length}</div>
                </div>
              ))}
              {state.players.length === 0 && <div className="text-sm text-muted-foreground">No players yet.</div>}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-3 font-semibold">Recent calls</div>
            <div className="flex flex-wrap gap-1.5">
              {state.called.slice(-24).reverse().map((n) => (
                <span key={n} className="rounded-lg bg-white/10 px-2.5 py-1 font-mono text-sm">{n}</span>
              ))}
              {state.called.length === 0 && <div className="text-sm text-muted-foreground">Awaiting first call…</div>}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
}

export default Game;
