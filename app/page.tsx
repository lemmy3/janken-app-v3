"use client";

import { useState, useEffect, useCallback } from "react";

type Hand = "rock" | "scissors" | "paper";
type Result = "win" | "lose" | "draw" | null;

type Character = {
  name: string;
  emoji: string;
  description: string;
  getHand: (history: HistoryEntry[]) => Hand;
};

type HistoryEntry = {
  playerHand: Hand;
  cpuHand: Hand;
  result: "win" | "lose" | "draw";
  character: string;
  timestamp: number;
};

const HANDS: { type: Hand; emoji: string; label: string }[] = [
  { type: "rock", emoji: "✊", label: "グー" },
  { type: "scissors", emoji: "✌️", label: "チョキ" },
  { type: "paper", emoji: "🖐️", label: "パー" },
];

const HAND_TYPES: Hand[] = ["rock", "scissors", "paper"];

const CHARACTERS: Character[] = [
  {
    name: "さくら",
    emoji: "🌸",
    description: "グーが好き",
    getHand: () => {
      const r = Math.random();
      if (r < 0.5) return "rock";
      if (r < 0.75) return "scissors";
      return "paper";
    },
  },
  {
    name: "あおい",
    emoji: "💎",
    description: "相手の裏を読む",
    getHand: (history) => {
      if (history.length === 0) return HAND_TYPES[Math.floor(Math.random() * 3)];
      const lastPlayerHand = history[0].playerHand;
      // Player's last hand に勝てる手を出す傾向
      const counter: Record<Hand, Hand> = { rock: "paper", scissors: "rock", paper: "scissors" };
      const r = Math.random();
      if (r < 0.6) return counter[lastPlayerHand];
      return HAND_TYPES[Math.floor(Math.random() * 3)];
    },
  },
  {
    name: "ひなた",
    emoji: "☀️",
    description: "ランダムだけど偏る",
    getHand: (history) => {
      // 直近の結果に応じて戦略を変える
      if (history.length > 0 && history[0].result === "lose") {
        // 負けたら同じ手を出しがち
        const r = Math.random();
        if (r < 0.5) return history[0].cpuHand;
      }
      return HAND_TYPES[Math.floor(Math.random() * 3)];
    },
  },
];

function judge(player: Hand, cpu: Hand): "win" | "lose" | "draw" {
  if (player === cpu) return "draw";
  if (
    (player === "rock" && cpu === "scissors") ||
    (player === "scissors" && cpu === "paper") ||
    (player === "paper" && cpu === "rock")
  )
    return "win";
  return "lose";
}

const RESULT_CONFIG = {
  win: { text: "あなたの勝ち！", color: "text-emerald-300", bg: "from-emerald-500/20 to-emerald-500/5" },
  lose: { text: "あなたの負け…", color: "text-rose-300", bg: "from-rose-500/20 to-rose-500/5" },
  draw: { text: "あいこ！", color: "text-amber-300", bg: "from-amber-500/20 to-amber-500/5" },
};

const RESULT_LABEL: Record<string, string> = { win: "勝ち", lose: "負け", draw: "あいこ" };
const HAND_LABEL: Record<Hand, string> = { rock: "グー", scissors: "チョキ", paper: "パー" };

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("janken-history");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: HistoryEntry[]) {
  try {
    localStorage.setItem("janken-history", JSON.stringify(history.slice(0, 10)));
  } catch { /* ignore */ }
}

function loadMaxStreak(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem("janken-max-streak")) || 0;
  } catch {
    return 0;
  }
}

function saveMaxStreak(streak: number) {
  try {
    localStorage.setItem("janken-max-streak", String(streak));
  } catch { /* ignore */ }
}

function WinRateChart({ wins, losses, draws }: { wins: number; losses: number; draws: number }) {
  const total = wins + losses + draws;
  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-1">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <text x="40" y="44" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="12">--%</text>
        </svg>
        <span className="text-xs text-white/40">勝率</span>
      </div>
    );
  }

  const winRate = Math.round((wins / total) * 100);
  const winAngle = (wins / total) * 360;
  const lossAngle = (losses / total) * 360;
  const drawAngle = (draws / total) * 360;

  function arc(startAngle: number, angle: number, color: string) {
    if (angle === 0) return null;
    if (angle >= 360) {
      return <circle cx="40" cy="40" r="35" fill="none" stroke={color} strokeWidth="8" />;
    }
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((startAngle + angle - 90) * Math.PI) / 180;
    const x1 = 40 + 35 * Math.cos(startRad);
    const y1 = 40 + 35 * Math.sin(startRad);
    const x2 = 40 + 35 * Math.cos(endRad);
    const y2 = 40 + 35 * Math.sin(endRad);
    const large = angle > 180 ? 1 : 0;
    return (
      <path
        d={`M ${x1} ${y1} A 35 35 0 ${large} 1 ${x2} ${y2}`}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        {arc(0, winAngle, "#6ee7b7")}
        {arc(winAngle, lossAngle, "#fda4af")}
        {arc(winAngle + lossAngle, drawAngle, "#fcd34d")}
        <text x="40" y="44" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
          {winRate}%
        </text>
      </svg>
      <span className="text-xs text-white/40">勝率</span>
    </div>
  );
}

export default function Home() {
  const [playerHand, setPlayerHand] = useState<Hand | null>(null);
  const [cpuHand, setCpuHand] = useState<Hand | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [score, setScore] = useState({ win: 0, lose: 0, draw: 0 });
  const [shakeIndex, setShakeIndex] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHistory(loadHistory());
    setMaxStreak(loadMaxStreak());
  }, []);

  useEffect(() => {
    if (!isAnimating) return;
    const interval = setInterval(() => {
      setShakeIndex((prev) => (prev + 1) % 3);
    }, 120);
    return () => clearInterval(interval);
  }, [isAnimating]);

  const play = useCallback(
    (hand: Hand) => {
      if (isAnimating) return;
      setResult(null);
      setPlayerHand(null);
      setCpuHand(null);
      setIsAnimating(true);

      setTimeout(() => {
        const character = CHARACTERS[selectedCharacter];
        const cpuChoice = character.getHand(history);
        const gameResult = judge(hand, cpuChoice);
        setPlayerHand(hand);
        setCpuHand(cpuChoice);
        setResult(gameResult);
        setIsAnimating(false);
        setScore((prev) => ({ ...prev, [gameResult]: prev[gameResult] + 1 }));

        const entry: HistoryEntry = {
          playerHand: hand,
          cpuHand: cpuChoice,
          result: gameResult,
          character: character.name,
          timestamp: Date.now(),
        };
        const newHistory = [entry, ...history].slice(0, 10);
        setHistory(newHistory);
        saveHistory(newHistory);

        if (gameResult === "win") {
          setCurrentStreak((prev) => {
            const next = prev + 1;
            setMaxStreak((prevMax) => {
              const newMax = Math.max(prevMax, next);
              saveMaxStreak(newMax);
              return newMax;
            });
            return next;
          });
        } else {
          setCurrentStreak(0);
        }
      }, 1000);
    },
    [isAnimating, selectedCharacter, history]
  );

  const reset = () => {
    setPlayerHand(null);
    setCpuHand(null);
    setResult(null);
    setScore({ win: 0, lose: 0, draw: 0 });
    setCurrentStreak(0);
    setHistory([]);
    saveHistory([]);
    setMaxStreak(0);
    saveMaxStreak(0);
  };

  const cpuDisplayEmoji = isAnimating
    ? HANDS[shakeIndex].emoji
    : cpuHand
    ? HANDS.find((h) => h.type === cpuHand)!.emoji
    : "❓";
  const playerDisplayEmoji = playerHand ? HANDS.find((h) => h.type === playerHand)!.emoji : "❓";

  const resultAnimation = result === "win" ? "animate-[winPulse_0.6s_ease-out]" : result === "lose" ? "animate-[loseDrop_0.5s_ease-out]" : result === "draw" ? "animate-[drawSpin_0.5s_ease-out]" : "";

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-8 selection:bg-purple-500/30">
      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 animate-pulse rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 animate-pulse rounded-full bg-blue-600/20 blur-3xl" style={{ animationDelay: "1s" }} />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-pink-600/10 blur-3xl" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-6">
        {/* Title */}
        <div className="text-center">
          <h1 className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-5xl font-bold tracking-tight text-transparent">
            じゃんけん
          </h1>
          <p className="mt-2 text-sm text-white/40">キャラクターを選んで対戦しよう</p>
        </div>

        {/* Character selection */}
        <div className="flex gap-3">
          {CHARACTERS.map((char, i) => (
            <button
              key={char.name}
              onClick={() => setSelectedCharacter(i)}
              disabled={isAnimating}
              className={`flex flex-col items-center gap-1 rounded-2xl border px-4 py-3 backdrop-blur-xl transition-all duration-300 ${
                selectedCharacter === i
                  ? "border-purple-400/50 bg-purple-500/20 shadow-lg shadow-purple-500/10"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
              } disabled:pointer-events-none`}
            >
              <span className="text-2xl">{char.emoji}</span>
              <span className={`text-sm font-medium ${selectedCharacter === i ? "text-purple-200" : "text-white/60"}`}>
                {char.name}
              </span>
              <span className="text-[10px] text-white/30">{char.description}</span>
            </button>
          ))}
        </div>

        {/* Scoreboard + Chart + Streak */}
        <div className="flex items-center gap-4">
          <div className="flex gap-3">
            {[
              { label: "勝ち", value: score.win, color: "text-emerald-400" },
              { label: "負け", value: score.lose, color: "text-rose-400" },
              { label: "あいこ", value: score.draw, color: "text-amber-400" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-center backdrop-blur-xl"
              >
                <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
                <div className="text-xs text-white/50">{s.label}</div>
              </div>
            ))}
          </div>
          {mounted && <WinRateChart wins={score.win} losses={score.lose} draws={score.draw} />}
        </div>

        {/* Streak display */}
        {mounted && (maxStreak > 0 || currentStreak > 0) && (
          <div className="flex gap-4 text-sm">
            {currentStreak > 0 && (
              <span className="text-emerald-400">
                🔥 {currentStreak}連勝中
              </span>
            )}
            {maxStreak > 0 && (
              <span className="text-yellow-400/70">
                👑 最高{maxStreak}連勝
              </span>
            )}
          </div>
        )}

        {/* Battle Arena */}
        <div className="flex w-full items-center justify-center gap-6">
          {/* Player side */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-widest text-white/40">あなた</span>
            <div
              className={`flex h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-5xl backdrop-blur-xl transition-all duration-500 ${
                playerHand ? `scale-100 opacity-100 ${resultAnimation}` : "scale-90 opacity-60"
              }`}
            >
              {playerDisplayEmoji}
            </div>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center">
            <span
              className={`text-2xl font-black transition-all duration-300 ${
                isAnimating
                  ? "animate-bounce text-white/80"
                  : result
                  ? "scale-110 text-white/60"
                  : "text-white/30"
              }`}
            >
              VS
            </span>
          </div>

          {/* CPU side */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium tracking-widest text-white/40">
              {CHARACTERS[selectedCharacter].emoji} {CHARACTERS[selectedCharacter].name}
            </span>
            <div
              className={`flex h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-5xl backdrop-blur-xl transition-all duration-500 ${
                isAnimating ? "animate-bounce" : cpuHand ? `scale-100 opacity-100 ${result === "lose" ? "animate-[winPulse_0.6s_ease-out]" : ""}` : "scale-90 opacity-60"
              }`}
            >
              {cpuDisplayEmoji}
            </div>
          </div>
        </div>

        {/* Result display */}
        <div className="h-16 flex items-center justify-center">
          {result && (
            <div
              className={`rounded-2xl bg-gradient-to-r ${RESULT_CONFIG[result].bg} border border-white/10 px-8 py-3 text-center backdrop-blur-xl ${
                result === "win" ? "animate-[winBanner_0.5s_ease-out]" : result === "lose" ? "animate-[loseBanner_0.5s_ease-out]" : "animate-[drawBanner_0.6s_ease-out]"
              }`}
            >
              <span className={`text-2xl font-bold ${RESULT_CONFIG[result].color}`}>
                {RESULT_CONFIG[result].text}
              </span>
            </div>
          )}
        </div>

        {/* Hand selection buttons */}
        <div className="flex gap-4">
          {HANDS.map((hand) => (
            <button
              key={hand.type}
              onClick={() => play(hand.type)}
              disabled={isAnimating}
              className="group relative flex flex-col items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-white/25 hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/20 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              <span className="text-5xl transition-transform duration-300 group-hover:-translate-y-1">
                {hand.emoji}
              </span>
              <span className="text-sm font-medium text-white/60 transition-colors group-hover:text-white/90">
                {hand.label}
              </span>
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-b from-purple-500/0 to-purple-500/0 transition-all duration-300 group-hover:from-purple-500/10 group-hover:to-blue-500/10" />
            </button>
          ))}
        </div>

        {/* History */}
        {mounted && history.length > 0 && (
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <h2 className="mb-3 text-sm font-medium text-white/50">対戦履歴（直近10戦）</h2>
            <div className="flex flex-col gap-1.5">
              {history.map((entry, i) => (
                <div
                  key={entry.timestamp}
                  className={`flex items-center justify-between rounded-xl px-3 py-1.5 text-sm ${
                    i === 0 ? "bg-white/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-12 rounded-full px-2 py-0.5 text-center text-xs font-medium ${
                        entry.result === "win"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : entry.result === "lose"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {RESULT_LABEL[entry.result]}
                    </span>
                    <span className="text-white/50">
                      {HAND_LABEL[entry.playerHand]} vs {HAND_LABEL[entry.cpuHand]}
                    </span>
                  </div>
                  <span className="text-xs text-white/30">{entry.character}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reset button */}
        {(score.win + score.lose + score.draw > 0) && (
          <button
            onClick={reset}
            className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm text-white/40 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white/70"
          >
            リセット
          </button>
        )}
      </div>

      {/* Custom animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes winPulse {
          0% { transform: scale(1); }
          30% { transform: scale(1.15); }
          60% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes loseDrop {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          40% { transform: translateY(-8px) rotate(-3deg); }
          100% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
        }
        @keyframes drawSpin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(10deg) scale(1.05); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes winBanner {
          0% { transform: scale(0.5) translateY(10px); opacity: 0; }
          50% { transform: scale(1.1) translateY(-4px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes loseBanner {
          0% { transform: translateY(-20px); opacity: 0; }
          60% { transform: translateY(4px); opacity: 1; }
          100% { transform: translateY(0); }
        }
        @keyframes drawBanner {
          0% { transform: scale(0.8); opacity: 0; }
          40% { transform: scale(1.05); }
          70% { transform: scale(0.97); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
