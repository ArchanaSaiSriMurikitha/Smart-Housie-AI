import { Link } from "react-router-dom";import { motion } from "framer-motion";
import { FaDice, FaBolt, FaUsers, FaQrcode, FaVolumeUp, FaTrophy } from "react-icons/fa";
import { PageShell, GlassCard } from "@/components/Layout";


const features = [
  { icon: FaQrcode, title: "Room code + QR", desc: "Share a 6-digit code or QR. No signup required." },
  { icon: FaBolt, title: "Real-time sync", desc: "Every call and claim streams live to all players." },
  { icon: FaVolumeUp, title: "Voice caller", desc: "Numbers are called out loud with speech synthesis." },
  { icon: FaUsers, title: "Unlimited friends", desc: "Play with anyone on any device, anywhere." },
  { icon: FaTrophy, title: "Auto pattern check", desc: "Top line, corners, full house — verified instantly." },
  { icon: FaDice, title: "Fair tickets", desc: "Classic 3×9 Tambola tickets generated per player." },
];

function Index() {
  return (
    <PageShell>
      <section className="relative py-10 md:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass-strong px-4 py-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Real-time multiplayer · No signup
          </div>
          <h1 className="mt-6 text-5xl font-black leading-tight md:text-7xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Play <span className="gradient-text">Housie</span> live<br />with your friends.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Host a private room, share a 6-digit code or QR, and enjoy real-time Tambola with anyone, anywhere.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/organizer" className="rounded-full gradient-brand px-6 py-3 font-medium text-white shadow-xl shadow-brand/40 glow-brand">
              Host a room
            </Link>
            <Link to="/join" className="rounded-full glass-strong px-6 py-3 font-medium">
              Join with code
            </Link>
          </div>
        </motion.div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <GlassCard>
                  <div className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-white shadow-lg shadow-brand/40">
                    <Icon />
                  </div>
                  <div className="mt-4 text-lg font-semibold">{f.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{f.desc}</div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-16">
          <GlassCard className="text-center">
            <h2 className="text-2xl font-bold md:text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>How it works</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {["Host creates a room and shares the 6-digit code or QR",
                "Friends join instantly from any device — no accounts",
                "Numbers are called live and claims are verified automatically"].map((s, i) => (
                <div key={i} className="text-left">
                  <div className="text-3xl font-black gradient-text">{String(i + 1).padStart(2, "0")}</div>
                  <div className="mt-2 text-sm">{s}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>
    </PageShell>
  );
}

export default Index;
