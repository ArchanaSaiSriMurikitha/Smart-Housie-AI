import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FaDice, FaHome, FaTrophy, FaCog, FaUserShield } from "react-icons/fa";
import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

const nav = [
  { to: "/", label: "Home", icon: FaHome },
  { to: "/organizer", label: "Host", icon: FaUserShield },
  { to: "/join", label: "Join", icon: FaDice },
  { to: "/winners", label: "Winners", icon: FaTrophy },
  { to: "/settings", label: "Settings", icon: FaCog },
] as const;

export function BackgroundOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      <motion.div className="floating-orb bg-brand" style={{ width: 500, height: 500, top: "-10%", left: "-10%" }}
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="floating-orb bg-accent" style={{ width: 600, height: 600, bottom: "-20%", right: "-15%" }}
        animate={{ x: [0, -80, 0], y: [0, -50, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="floating-orb" style={{ width: 400, height: 400, top: "40%", right: "20%", background: "var(--color-accent-cyan)" }}
        animate={{ x: [0, 40, 0], y: [0, 60, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} />
    </div>
  );
}

export function Navbar() {
  const pathname = useLocation().pathname;
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-brand shadow-lg shadow-brand/40">
            <FaDice className="text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-bold tracking-tight">Digital Housie</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Real-time multiplayer</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => {
            const active = pathname === n.to;
            return (
              <Link key={n.to} to={n.to}
                className={`rounded-full px-4 py-2 text-sm transition ${active ? "gradient-brand text-white shadow-lg shadow-brand/30" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <Link to="/join" className="rounded-full gradient-brand px-4 py-2 text-sm font-medium text-white shadow-lg shadow-brand/40 hover:opacity-90 md:hidden">
          Play
        </Link>
      </div>
    </header>
  );
}

export function MobileTabs() {
  const pathname = useLocation().pathname;
  return (
    <nav className="fixed inset-x-0 bottom-3 z-40 mx-auto flex w-[min(96%,520px)] items-center justify-around rounded-2xl glass-strong px-2 py-2 md:hidden">
      {nav.slice(0, 5).map((n) => {
        const Icon = n.icon;
        const active = pathname === n.to;
        return (
          <Link key={n.to} to={n.to} className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] ${active ? "text-white" : "text-muted-foreground"}`}>
            <Icon className={active ? "text-brand-glow" : ""} />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <BackgroundOrbs />
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-6 md:pb-10">
        {children}
      </motion.main>
      <MobileTabs />
      <Toaster position="top-center" toastOptions={{
        style: { background: "rgba(30, 20, 50, 0.95)", color: "white", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" },
      }} />
    </>
  );
}

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl glass p-5 shadow-2xl shadow-black/30 ${className}`}>{children}</div>;
}