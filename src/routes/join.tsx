import { useNavigate , useSearchParams} from "react-router-dom";import { useState } from "react";
import { FaDice } from "react-icons/fa";
import { PageShell, GlassCard } from "@/components/Layout";
import { useRoom } from "@/lib/room";
import { useDocumentMeta } from "@/lib/head";
import { z } from "zod";

const searchSchema = z.object({ code: z.string().optional() });


function Join() {
  useDocumentMeta("Join a Housie Room — Digital Housie", "Enter a 6-digit code or scan a QR to join a live Housie room.");
  const [searchParams] = useSearchParams();
  const initial = searchParams.get("code") ?? "";
  const [code, setCode] = useState(initial);
  const [name, setName] = useState("");
  const { joinGame } = useRoom();
  const nav = useNavigate();

  const submit = () => {
    if (code.length !== 6 || !name.trim()) return;
    joinGame(code, name.trim());
    nav("/lobby");
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-md py-10">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-brand shadow-xl shadow-brand/40">
            <FaDice className="text-2xl text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Join a room</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter the 6-digit code from your organizer.</p>
        </div>
        <GlassCard>
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Room code</label>
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000" inputMode="numeric"
            className="mt-1 w-full rounded-xl bg-white/5 px-4 py-4 text-center font-mono text-3xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-brand" />
          <label className="mt-4 block text-xs uppercase tracking-widest text-muted-foreground">Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Anaya"
            className="mt-1 w-full rounded-xl bg-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-brand" />
          <button onClick={submit} className="mt-5 w-full rounded-xl gradient-brand py-3 font-medium text-white shadow-lg shadow-brand/40 disabled:opacity-40"
            disabled={code.length !== 6 || !name.trim()}>
            Enter Lobby
          </button>
        </GlassCard>
      </div>
    </PageShell>
  );
}

export default Join;
