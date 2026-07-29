import { useNavigate } from "react-router-dom";import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PageShell, GlassCard } from "@/components/Layout";
import { useRoom } from "@/lib/room";
import { TicketCard } from "@/components/TicketCard";
import { useDocumentMeta } from "@/lib/head";


function Lobby() {
  useDocumentMeta("Lobby — Digital Housie", "Wait for the organizer, chat and preview your ticket.");
  const { state, sendChat } = useRoom();
  const nav = useNavigate();
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (state.status === "running") nav("/game");
  }, [state.status, nav]);

  const you = state.me;

  return (
    <PageShell>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <GlassCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Room</div>
                <div className="font-mono text-3xl font-black gradient-text">{state.code || "—"}</div>
              </div>
              <div className="rounded-full glass-strong px-4 py-2 text-sm">
                {state.connected ? (state.status === "lobby" ? "Waiting for organizer…" : state.status) : "Connecting…"}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <motion.div initial={{ width: 0 }} animate={{ width: "70%" }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }} className="h-full gradient-brand" />
              </div>
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          </GlassCard>

          {you && (
            <GlassCard>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full gradient-brand text-lg">{you.avatar}</div>
                  <div>
                    <div className="font-semibold">{you.name}</div>
                    <div className="text-xs text-muted-foreground">Your ticket · ready</div>
                  </div>
                </div>
              </div>
              <TicketCard ticket={you.ticket} marked={new Set()} called={new Set()} playerName={you.name} />
            </GlassCard>
          )}
        </div>

        <div className="space-y-6">
          <GlassCard>
            <div className="mb-3 font-semibold">Players ({state.players.length})</div>
            <div className="max-h-64 space-y-2 overflow-auto pr-1">
              {state.players.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-2">
                  <div className="grid h-8 w-8 place-items-center rounded-full gradient-brand">{p.avatar}</div>
                  <div className="flex-1 text-sm">{p.name}</div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-3 font-semibold">Live chat</div>
            <div className="mb-2 h-48 space-y-2 overflow-auto rounded-xl bg-black/20 p-3 text-sm">
              {state.chat.length === 0 && <div className="text-muted-foreground">Say hello…</div>}
              {state.chat.map((c) => (
                <div key={c.id}><span className="text-brand-glow">{c.from}:</span> {c.text}</div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (sendChat(msg), setMsg(""))}
                placeholder="Message…" className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand" />
              <button onClick={() => { sendChat(msg); setMsg(""); }} className="rounded-lg gradient-brand px-4 text-sm text-white">Send</button>
            </div>
            <div className="mt-2 flex gap-2 text-xl">
              {["👍", "🎉", "❤️", "🔥", "😂"].map((e) => (
                <button key={e} onClick={() => sendChat(e)} className="rounded-full glass-strong px-2 py-1 hover:bg-white/10">{e}</button>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
}

export default Lobby;
