import { useState } from "react";
import { PageShell, GlassCard } from "@/components/Layout";
import { useRoom } from "@/lib/room";
import { useDocumentMeta } from "@/lib/head";


function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-3 last:border-b-0">
      <div className="text-sm">{label}</div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`h-7 w-12 rounded-full p-1 transition ${on ? "gradient-brand" : "bg-white/15"}`}>
      <div className={`h-5 w-5 rounded-full bg-white transition ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

function Settings() {
  useDocumentMeta("Settings — Digital Housie", "Toggle voice caller and preferences.");
  const { state, toggleVoice, leaveGame } = useRoom();
  const [sound, setSound] = useState(true);
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl py-6">
        <h1 className="mb-6 text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Settings</h1>
        <div className="space-y-6">
          <GlassCard>
            <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Audio</div>
            <Row label="Voice caller"><Toggle on={state.voiceOn} onChange={toggleVoice} /></Row>
            <Row label="Sound effects"><Toggle on={sound} onChange={() => setSound(!sound)} /></Row>
          </GlassCard>
          {state.code && (
            <GlassCard>
              <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Room</div>
              <Row label={`Currently in room ${state.code}`}>
                <button onClick={leaveGame} className="rounded-lg bg-destructive/20 px-3 py-1.5 text-xs text-destructive">Leave room</button>
              </Row>
            </GlassCard>
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default Settings;
