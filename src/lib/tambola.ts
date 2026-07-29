// Tambola ticket generator & utilities

export type Cell = number | null;
export type Ticket = Cell[][]; // 3 rows x 9 cols

const COL_RANGES: [number, number][] = [
  [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
  [50, 59], [60, 69], [70, 79], [80, 90],
];

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateTicket(): Ticket {
  while (true) {
    const colCounts = Array(9).fill(1);
    let remaining = 15 - 9;
    while (remaining > 0) {
      const c = Math.floor(Math.random() * 9);
      if (colCounts[c] < 3) { colCounts[c]++; remaining--; }
    }
    const rowCounts = [0, 0, 0];
    const grid: Ticket = [Array(9).fill(null), Array(9).fill(null), Array(9).fill(null)];
    let ok = true;
    for (let c = 0; c < 9; c++) {
      const rows = shuffled([0, 1, 2]).filter((r) => rowCounts[r] < 5);
      if (rows.length < colCounts[c]) { ok = false; break; }
      const chosen = rows.slice(0, colCounts[c]);
      for (const r of chosen) { grid[r][c] = -1; rowCounts[r]++; }
    }
    if (!ok || rowCounts.some((r) => r !== 5)) continue;
    for (let c = 0; c < 9; c++) {
      const [lo, hi] = COL_RANGES[c];
      const pool: number[] = [];
      for (let n = lo; n <= hi; n++) pool.push(n);
      const nums = shuffled(pool).slice(0, colCounts[c]).sort((a, b) => a - b);
      let idx = 0;
      for (let r = 0; r < 3; r++) {
        if (grid[r][c] === -1) grid[r][c] = nums[idx++];
      }
    }
    return grid;
  }
}

export type PatternKey =
  | "earlyFive"
  | "topLine"
  | "middleLine"
  | "bottomLine"
  | "fourCorners"
  | "fullHouse";

export const PATTERN_LABELS: Record<PatternKey, string> = {
  earlyFive: "Early Five",
  topLine: "Top Line",
  middleLine: "Middle Line",
  bottomLine: "Bottom Line",
  fourCorners: "Four Corners",
  fullHouse: "Full House",
};

export const PATTERNS: PatternKey[] = ["earlyFive", "topLine", "middleLine", "bottomLine", "fourCorners", "fullHouse"];

function rowNums(t: Ticket, r: number): number[] {
  return t[r].filter((v): v is number => v !== null);
}

export function checkPattern(ticket: Ticket, marked: Set<number>, pattern: PatternKey): boolean {
  const allMarked = (nums: number[]) => nums.every((n) => marked.has(n));
  switch (pattern) {
    case "earlyFive":
      return [...marked].filter((n) => ticket.flat().includes(n)).length >= 5;
    case "topLine": return allMarked(rowNums(ticket, 0));
    case "middleLine": return allMarked(rowNums(ticket, 1));
    case "bottomLine": return allMarked(rowNums(ticket, 2));
    case "fourCorners": {
      const r0 = rowNums(ticket, 0);
      const r2 = rowNums(ticket, 2);
      return marked.has(r0[0]) && marked.has(r0[r0.length - 1]) &&
             marked.has(r2[0]) && marked.has(r2[r2.length - 1]);
    }
    case "fullHouse":
      return allMarked(ticket.flat().filter((v): v is number => v !== null));
  }
}