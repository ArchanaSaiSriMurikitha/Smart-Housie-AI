import { useNavigate } from "react-router-dom";import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaPlay, FaPause, FaStop, FaRedo, FaBullhorn, FaUserPlus, FaDownload, FaCopy, FaVolumeUp, FaVolumeMute, FaRobot, FaSignOutAlt } from "react-icons/fa";
import { PageShell, GlassCard } from "@/components/Layout";
import { NumberBoard } from "@/components/NumberBoard";
import { useRoom } from "@/lib/room";
import { PATTERN_LABELS } from "@/lib/tambola";
import { useDocumentMeta } from "@/lib/head";


function Organizer() {
  useDocumentMeta("Host a Room — Digital Housie", "Create a private Housie room and invite friends by code or QR.");
  const { state, createGame, startGame, pauseGame, resumeGame, endGame, restartGame, callNext, toggleAuto, toggleVoice, broadcast, addBots, leaveGame } = useRoom();
  const nav = useNavigate();
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");
  const joinUrl = typeof window !== "undefined" && state.code ? `${window.location.origin}/join?code=${state.code}` : "";

  const create = () => { const c = createGame(name.trim() || "Organizer"); toast.success(`Room ${c} created`); };

  if (!state.code || state.role !== "organizer") {
    return (
      <PageShell>
        <div className="mx-auto max-w-xl py-10 text-center">
          <h1 className="text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Host a new room</h1>
          <p className="mt-3 text-muted-foreground">We'll generate a 6-digit code and a QR for friends to join instantly — no signup required.</p>
          <GlassCard className="mt-6 text-left">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Your name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Organizer" className="mt-1 mb-4 w-full rounded-xl bg-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-brand" />
            <button onClick={create} className="w-full rounded-xl gradient-brand py-3 font-medium text-white shadow-lg shadow-brand/40">Create Room</button>
          </GlassCard>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <GlassCard>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Join code</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="font-mono text-4xl font-black gradient-text">{state.code}</div>
              <button onClick={() => { navigator.clipboard.writeText(state.code); toast.success("Copied"); }} className="rounded-full glass-strong p-2 hover:bg-white/10"><FaCopy /></button>
            </div>
            <div className="mt-4 grid place-items-center rounded-xl bg-white p-4">
              {joinUrl && <QRCodeSVG value={joinUrl} size={180} bgColor="#ffffff" fgColor="#1a0b2e" />}
            </div>
            <div className="mt-3 text-center text-xs text-muted-foreground break-all">{joinUrl}</div>
            <button onClick={() => { navigator.clipboard.writeText(joinUrl); toast.success("Link copied"); }} className="mt-3 w-full rounded-xl glass-strong py-2 text-sm">Copy invite link</button>
          </GlassCard>

          <GlassCard>
            <div className="mb-3 flex items-center justify-between">
              <div className="font-semibold">Game controls</div>
              <span className={`rounded-full px-3 py-1 text-xs ${state.status === "running" ? "bg-emerald-500/20 text-emerald-300" : state.status === "paused" ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-muted-foreground"}`}>{state.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {state.status === "lobby" && <button onClick={startGame} className="col-span-2 flex items-center justify-center gap-2 rounded-xl gradient-brand py-3 font-medium text-white"><FaPlay /> Start Game</button>}
              {state.status === "running" && <button onClick={pauseGame} className="flex items-center justify-center gap-2 rounded-xl glass-strong py-2.5 text-sm"><FaPause /> Pause</button>}
              {state.status === "paused" && <button onClick={resumeGame} className="flex items-center justify-center gap-2 rounded-xl gradient-brand py-2.5 text-sm text-white"><FaPlay /> Resume</button>}
              <button onClick={endGame} className="flex items-center justify-center gap-2 rounded-xl bg-destructive/20 py-2.5 text-sm text-destructive"><FaStop /> End</button>
              <button onClick={restartGame} className="flex items-center justify-center gap-2 rounded-xl glass-strong py-2.5 text-sm"><FaRedo /> Restart</button>
              <button onClick={() => nav("/game")} className="flex items-center justify-center gap-2 rounded-xl glass-strong py-2.5 text-sm">Open Game</button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={callNext} disabled={state.status !== "running"} className="flex items-center justify-center gap-2 rounded-xl gradient-brand py-2.5 text-sm font-medium text-white disabled:opacity-40">Call Next</button>
              <button onClick={toggleAuto} className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm ${state.autoCall ? "gradient-brand text-white" : "glass-strong"}`}><FaRobot /> Auto {state.autoCall ? "On" : "Off"}</button>
              <button onClick={toggleVoice} className="col-span-2 flex items-center justify-center gap-2 rounded-xl glass-strong py-2.5 text-sm">{state.voiceOn ? <FaVolumeUp /> : <FaVolumeMute />} Voice {state.voiceOn ? "On" : "Off"}</button>
            </div>
            <button onClick={() => { leaveGame(); toast("Left room"); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2 text-xs text-muted-foreground hover:bg-white/10"><FaSignOutAlt /> Close room</button>
          </GlassCard>

          <GlassCard>
            <div className="mb-3 flex items-center justify-between">
              <div className="font-semibold">Broadcast</div>
              <button onClick={() => addBots(3)} className="flex items-center gap-1.5 rounded-full glass-strong px-3 py-1 text-xs"><FaUserPlus /> Add bots</button>
            </div>
            <div className="flex gap-2">
              <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Say hi to the room…" className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand" />
              <button onClick={() => { if (msg) { broadcast(msg); setMsg(""); } }} className="rounded-lg gradient-brand px-4 text-white"><FaBullhorn /></button>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <GlassCard>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Number board</div>
                <div className="text-2xl font-bold">Last called: <span className="gradient-text font-mono">{state.called.at(-1) ?? "—"}</span></div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div><span className="text-foreground font-bold">{state.called.length}</span> called</div>
                <div><span className="text-foreground font-bold">{90 - state.called.length}</span> remaining</div>
              </div>
            </div>
            <NumberBoard called={state.called} />
          </GlassCard>

          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard>
              <div className="mb-3 font-semibold">Players ({state.players.length})</div>
              <div className="max-h-80 space-y-2 overflow-auto pr-1">
                {state.players.length === 0 && <div className="text-sm text-muted-foreground">Waiting for players to join…</div>}
                {state.players.map((p) => (
                  <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full gradient-brand text-lg">{p.avatar}</div>
                      <div>
                        <div className="text-sm font-semibold">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.marked.length} marked · {p.wins.length} wins</div>
                      </div>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">Winners</div>
                <button onClick={() => {
                  const data = state.winners.map((w) => `${PATTERN_LABELS[w.pattern]},${w.playerName}`).join("\n");
                  const blob = new Blob([`Pattern,Player\n${data}`], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = `housie-${state.code}.csv`; a.click();
                }} className="flex items-center gap-1.5 rounded-full glass-strong px-3 py-1 text-xs"><FaDownload /> Export</button>
              </div>
              <div className="space-y-2">
                {state.winners.length === 0 && <div className="text-sm text-muted-foreground">No winners yet.</div>}
                {state.winners.map((w, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-between rounded-xl bg-gradient-to-r from-gold/20 to-transparent p-3">
                    <div>
                      <div className="text-sm font-semibold">{PATTERN_LABELS[w.pattern]}</div>
                      <div className="text-xs text-muted-foreground">{w.playerName}</div>
                    </div>
                    <span className="text-2xl">🏆</span>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default Organizer;
