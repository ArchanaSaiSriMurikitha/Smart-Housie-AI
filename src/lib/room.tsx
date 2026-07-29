import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateTicket, checkPattern, PATTERN_LABELS, PATTERNS, type PatternKey, type Ticket } from "@/lib/tambola";

export type Player = {
  id: string;
  name: string;
  avatar: string;
  ticket: Ticket;
  marked: number[];
  wins: PatternKey[];
};

export type ChatMessage = { id: string; from: string; text: string; ts: number };
export type Winner = { pattern: PatternKey; playerId: string; playerName: string; ts: number };

export type Status = "idle" | "lobby" | "running" | "paused" | "ended";

export type RoomState = {
  code: string;
  status: Status;
  called: number[];
  players: Player[];
  winners: Winner[];
  chat: ChatMessage[];
  autoCall: boolean;
  voiceOn: boolean;
  role: "organizer" | "player" | null;
  me?: Player;
  connected: boolean;
};

const AVATARS = ["🦊", "🐼", "🦄", "🐸", "🦁", "🐯", "🐨", "🐵", "🦉", "🐙", "🐳", "🦋"];
const BOT_NAMES = ["Aarav", "Priya", "Rohan", "Meera", "Kabir", "Isha", "Vikram", "Ananya", "Rahul", "Sneha"];

function randCode() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function uid() { return Math.random().toString(36).slice(2, 10); }

function speak(text: string, on: boolean) {
  if (!on || typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

const STORAGE_KEY = "housie:session";

type Persisted = {
  code: string; role: "organizer" | "player"; me: Player;
  status: Status; called: number[]; players: Player[]; winners: Winner[];
  chat: ChatMessage[]; autoCall: boolean; voiceOn: boolean;
};

function loadPersisted(): Persisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function savePersisted(p: Persisted | null) {
  if (typeof window === "undefined") return;
  if (p) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  else sessionStorage.removeItem(STORAGE_KEY);
}

type Ctx = {
  state: RoomState;
  createGame: (organizerName?: string) => string;
  joinGame: (code: string, name: string) => void;
  leaveGame: () => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  restartGame: () => void;
  callNext: () => void;
  toggleAuto: () => void;
  toggleVoice: () => void;
  markNumber: (n: number) => void;
  sendChat: (text: string) => void;
  broadcast: (text: string) => void;
  claimPattern: (p: PatternKey) => void;
  addBots: (n: number) => void;
};

const RoomCtx = createContext<Ctx | null>(null);

function makePlayer(name: string): Player {
  return {
    id: uid(),
    name,
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    ticket: generateTicket(),
    marked: [],
    wins: [],
  };
}

export function RoomProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RoomState>({
    code: "", status: "idle", called: [], players: [], winners: [],
    chat: [], autoCall: false, voiceOn: true, role: null, connected: false,
  });
  const stateRef = useRef(state);
  stateRef.current = state;
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const closingIntentionally = useRef(false);

  // ---- helpers to send messages
  const send = (event: string, payload: unknown) => {
    const ch = channelRef.current;
    if (!ch) return;
    ch.send({ type: "broadcast", event, payload });
  };

  const broadcastState = (s: RoomState) => {
    // Host-only: broadcast authoritative snapshot minus role/me/connected
    const snap = {
      code: s.code, status: s.status, called: s.called,
      players: s.players, winners: s.winners, chat: s.chat,
      autoCall: s.autoCall,
    };
    send("state", snap);
  };

  // ---- host-side pattern check + updates
  const hostApply = (updater: (s: RoomState) => RoomState) => {
    setState((s) => {
      if (s.role !== "organizer") return s;
      const next = updater(s);
      // schedule broadcast after render
      queueMicrotask(() => broadcastState(next));
      return next;
    });
  };

  const checkWinners = (players: Player[], called: Set<number>, winners: Winner[]) => {
    const wonPatterns = new Set(winners.map((w) => w.pattern));
    const newWinners = [...winners];
    const updated = players.map((p) => {
      const marked = new Set(p.marked.filter((n) => called.has(n)));
      const newWins = [...p.wins];
      for (const pat of PATTERNS) {
        if (wonPatterns.has(pat) || newWins.includes(pat)) continue;
        if (checkPattern(p.ticket, marked, pat)) {
          newWins.push(pat);
          wonPatterns.add(pat);
          newWinners.push({ pattern: pat, playerId: p.id, playerName: p.name, ts: Date.now() });
        }
      }
      return { ...p, wins: newWins };
    });
    return { updated, newWinners };
  };

  // ---- connect to a room channel
  const connectChannel = (code: string, role: "organizer" | "player", me: Player) => {
    closingIntentionally.current = false;
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const ch = supabase.channel(`room-${code}`, { config: { broadcast: { self: false } } });
    channelRef.current = ch;

    ch.on("broadcast", { event: "state" }, ({ payload }) => {
      // Players (and organizer receiving own echo not received due to self:false) apply snapshot
      if (stateRef.current.role !== "player") return;
      const snap = payload as {
        code: string; status: Status; called: number[];
        players: Player[]; winners: Winner[]; chat: ChatMessage[]; autoCall: boolean;
      };
      setState((s) => {
        // keep my own marked list authoritative locally, but merge server's copy of me
        const serverMe = snap.players.find((p) => p.id === s.me?.id);
        const me = serverMe ?? s.me;
        // detect new called number for voice
        const newest = snap.called[snap.called.length - 1];
        if (newest && !s.called.includes(newest)) speak(`Number ${newest}`, s.voiceOn);
        return { ...s, ...snap, me };
      });
    });

    ch.on("broadcast", { event: "join" }, ({ payload }) => {
      // Host receives; add player if not present, then rebroadcast state
      const p = payload as Player;
      hostApply((s) => {
        if (s.players.find((x) => x.id === p.id)) return s;
        toast.success(`${p.name} joined`);
        return { ...s, players: [...s.players, p] };
      });
    });

    ch.on("broadcast", { event: "hello" }, () => {
      // A player asked for a fresh snapshot
      if (stateRef.current.role === "organizer") {
        broadcastState(stateRef.current);
      }
    });

    ch.on("broadcast", { event: "mark" }, ({ payload }) => {
      const { playerId, n } = payload as { playerId: string; n: number };
      hostApply((s) => {
        if (!s.called.includes(n)) return s;
        const players = s.players.map((p) =>
          p.id === playerId && !p.marked.includes(n) ? { ...p, marked: [...p.marked, n] } : p
        );
        const { updated, newWinners } = checkWinners(players, new Set(s.called), s.winners);
        if (newWinners.length !== s.winners.length) {
          const w = newWinners[newWinners.length - 1];
          toast.success(`${w.playerName} won ${PATTERN_LABELS[w.pattern]}! 🎉`);
        }
        return { ...s, players: updated, winners: newWinners };
      });
    });

    ch.on("broadcast", { event: "chat" }, ({ payload }) => {
      const msg = payload as ChatMessage;
      if (stateRef.current.role === "organizer") {
        hostApply((s) => ({ ...s, chat: [...s.chat, msg].slice(-100) }));
      } else {
        // players will also get chat via state snapshot, but show immediately
        setState((s) => ({ ...s, chat: [...s.chat, msg].slice(-100) }));
      }
    });

    ch.on("broadcast", { event: "claim" }, ({ payload }) => {
      const { playerId, pattern } = payload as { playerId: string; pattern: PatternKey };
      hostApply((s) => {
        const p = s.players.find((x) => x.id === playerId);
        if (!p) return s;
        const marked = new Set(p.marked.filter((n) => s.called.includes(n)));
        if (!checkPattern(p.ticket, marked, pattern)) {
          toast.error(`${p.name} made an invalid claim on ${PATTERN_LABELS[pattern]}`);
          return s;
        }
        if (s.winners.find((w) => w.pattern === pattern)) return s;
        const winners = [...s.winners, { pattern, playerId: p.id, playerName: p.name, ts: Date.now() }];
        toast.success(`${p.name} won ${PATTERN_LABELS[pattern]}! 🎉`);
        return { ...s, winners };
      });
    });

    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        reconnectAttempts.current = 0;
        if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
        setState((s) => ({ ...s, connected: true }));
        if (role === "player") {
          send("join", me);
          send("hello", {});
        } else {
          // organizer: broadcast initial/current authoritative state
          // (also covers reconnects, so already-joined players get resynced)
          setTimeout(() => broadcastState(stateRef.current), 100);
        }
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        // Connection dropped or failed to establish. Reflect that in the UI
        // and retry with exponential backoff instead of getting stuck forever.
        setState((s) => ({ ...s, connected: false }));
        if (closingIntentionally.current) return;
        if (reconnectTimer.current) return; // a retry is already scheduled
        const attempt = reconnectAttempts.current++;
        const delay = Math.min(1000 * 2 ** attempt, 10000);
        reconnectTimer.current = setTimeout(() => {
          reconnectTimer.current = null;
          if (closingIntentionally.current) return;
          connectChannel(code, role, me);
        }, delay);
      }
    });
  };

  // ---- restore session on mount
  useEffect(() => {
    const p = loadPersisted();
    if (p) {
      setState((s) => ({
        ...s, code: p.code, role: p.role, me: p.me,
        status: p.status ?? "lobby",
        called: p.called ?? [],
        players: p.players ?? [p.me],
        winners: p.winners ?? [],
        chat: p.chat ?? [],
        autoCall: p.autoCall ?? false,
        voiceOn: p.voiceOn ?? true,
      }));
      // connect on next tick so state is set
      setTimeout(() => connectChannel(p.code, p.role, p.me), 0);
    }
    const tryResync = () => {
      const s = stateRef.current;
      if (!s.code || !s.role || !s.me) return;
      if (s.connected) return; // already fine
      connectChannel(s.code, s.role, s.me);
    };
    const onVisibility = () => { if (document.visibilityState === "visible") tryResync(); };
    window.addEventListener("online", tryResync);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      closingIntentionally.current = true;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (autoTimer.current) clearInterval(autoTimer.current);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      window.removeEventListener("online", tryResync);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- API
  const createGame = (organizerName = "Organizer") => {
    const code = randCode();
    const me = makePlayer(organizerName);
    savePersisted({
      code, role: "organizer", me, status: "lobby", called: [], players: [me],
      winners: [], chat: [], autoCall: false, voiceOn: true,
    });
    setState({
      code, status: "lobby", called: [], players: [me], winners: [], chat: [],
      autoCall: false, voiceOn: true, role: "organizer", me, connected: false,
    });
    connectChannel(code, "organizer", me);
    return code;
  };

  const joinGame = (code: string, name: string) => {
    const me = makePlayer(name || "Player");
    savePersisted({
      code, role: "player", me, status: "lobby", called: [], players: [me],
      winners: [], chat: [], autoCall: false, voiceOn: true,
    });
    setState({
      code, status: "lobby", called: [], players: [me], winners: [], chat: [],
      autoCall: false, voiceOn: true, role: "player", me, connected: false,
    });
    connectChannel(code, "player", me);
    toast.success(`Joining room ${code}…`);
  };

  const leaveGame = () => {
    closingIntentionally.current = true;
    if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = null;
    savePersisted(null);
    setState({
      code: "", status: "idle", called: [], players: [], winners: [],
      chat: [], autoCall: false, voiceOn: true, role: null, connected: false,
    });
  };

  const startGame = () => hostApply((s) => {
    speak("The game has started. Get ready!", s.voiceOn);
    return { ...s, status: "running" };
  });
  const pauseGame = () => hostApply((s) => ({ ...s, status: "paused", autoCall: false }));
  const resumeGame = () => hostApply((s) => ({ ...s, status: "running" }));
  const endGame = () => hostApply((s) => ({ ...s, status: "ended", autoCall: false }));
  const restartGame = () => hostApply((s) => ({
    ...s, called: [], winners: [], status: "lobby", autoCall: false,
    players: s.players.map((p) => ({ ...p, marked: [], wins: [], ticket: generateTicket() })),
    me: s.me ? { ...s.me, marked: [], wins: [], ticket: generateTicket() } : s.me,
  }));

  const callNext = () => hostApply((s) => {
    if (s.status !== "running") return s;
    const remaining: number[] = [];
    for (let i = 1; i <= 90; i++) if (!s.called.includes(i)) remaining.push(i);
    if (remaining.length === 0) return { ...s, status: "ended", autoCall: false };
    const n = remaining[Math.floor(Math.random() * remaining.length)];
    speak(`Number ${n}`, s.voiceOn);
    const called = [...s.called, n];
    return { ...s, called };
  });

  useEffect(() => {
    if (autoTimer.current) { clearInterval(autoTimer.current); autoTimer.current = null; }
    if (state.role === "organizer" && state.autoCall && state.status === "running") {
      autoTimer.current = setInterval(() => callNext(), 3500);
    }
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.autoCall, state.status, state.role]);

  useEffect(() => {
    if (!state.role || !state.code || !state.me) return;
    savePersisted({
      code: state.code, role: state.role, me: state.me, status: state.status,
      called: state.called, players: state.players, winners: state.winners,
      chat: state.chat, autoCall: state.autoCall, voiceOn: state.voiceOn,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.role, state.code, state.me, state.status, state.called, state.players, state.winners, state.chat, state.autoCall, state.voiceOn]);

  const toggleAuto = () => hostApply((s) => ({ ...s, autoCall: !s.autoCall }));
  const toggleVoice = () => setState((s) => ({ ...s, voiceOn: !s.voiceOn }));

  const markNumber = (n: number) => {
    setState((s) => {
      if (!s.me) return s;
      if (!s.called.includes(n)) { toast.error("Not called yet"); return s; }
      const meMarked = s.me.marked.includes(n) ? s.me.marked : [...s.me.marked, n];
      const me = { ...s.me, marked: meMarked };
      if (s.role === "organizer") {
        const players = s.players.map((p) => p.id === me.id ? me : p);
        const { updated, newWinners } = checkWinners(players, new Set(s.called), s.winners);
        const next = { ...s, me: updated.find((p) => p.id === me.id) ?? me, players: updated, winners: newWinners };
        queueMicrotask(() => broadcastState(next));
        return next;
      } else {
        // player: send to host and update local optimistic view
        send("mark", { playerId: me.id, n });
        return { ...s, me };
      }
    });
  };

  const sendChat = (text: string) => {
    if (!text.trim()) return;
    const msg: ChatMessage = { id: uid(), from: state.me?.name ?? "Guest", text, ts: Date.now() };
    send("chat", msg);
    if (state.role === "organizer") {
      hostApply((s) => ({ ...s, chat: [...s.chat, msg].slice(-100) }));
    } else {
      setState((s) => ({ ...s, chat: [...s.chat, msg].slice(-100) }));
    }
  };

  const broadcastMsg = (text: string) => {
    const msg: ChatMessage = { id: uid(), from: "📢 Organizer", text, ts: Date.now() };
    send("chat", msg);
    hostApply((s) => ({ ...s, chat: [...s.chat, msg].slice(-100) }));
    toast(text, { icon: "📢" });
  };

  const claimPattern = (p: PatternKey) => {
    if (!state.me) return;
    if (state.role === "organizer") {
      hostApply((s) => {
        if (!s.me) return s;
        const marked = new Set(s.me.marked.filter((n) => s.called.includes(n)));
        if (!checkPattern(s.me.ticket, marked, p)) {
          toast.error("Invalid claim — bogey!");
          return s;
        }
        if (s.winners.find((w) => w.pattern === p)) return s;
        toast.success(`Claim verified: ${PATTERN_LABELS[p]}`);
        return { ...s, winners: [...s.winners, { pattern: p, playerId: s.me.id, playerName: s.me.name, ts: Date.now() }] };
      });
    } else {
      send("claim", { playerId: state.me.id, pattern: p });
      toast("Claim sent to organizer…", { icon: "📨" });
    }
  };

  const addBots = (n: number) => {
    hostApply((s) => {
      const bots = Array.from({ length: n }).map((_, i) =>
        makePlayer(BOT_NAMES[(s.players.length + i) % BOT_NAMES.length])
      );
      return { ...s, players: [...s.players, ...bots] };
    });
  };

  const value = useMemo<Ctx>(() => ({
    state, createGame, joinGame, leaveGame,
    startGame, pauseGame, resumeGame, endGame, restartGame,
    callNext, toggleAuto, toggleVoice, markNumber, sendChat,
    broadcast: broadcastMsg, claimPattern, addBots,
  }), [state]);

  return <RoomCtx.Provider value={value}>{children}</RoomCtx.Provider>;
}

export function useRoom() {
  const ctx = useContext(RoomCtx);
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
  return ctx;
}