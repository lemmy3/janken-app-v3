"use client";

import { useState, useEffect, useCallback } from "react";

type Hand = "rock" | "scissors" | "paper";
type Result = "win" | "lose" | "draw" | null;

const HANDS: { type: Hand; emoji: string; label: string }[] = [
  { type: "rock", emoji: "✊", label: "グー" },
  { type: "scissors", emoji: "✌️", label: "チョキ" },
  { type: "paper", emoji: "🖐️", label: "パー" },
];

function judge(player: Hand, cpu: Hand): Result {
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

export default function Home() {
  const [playerHand, setPlayerHand] = useState<Hand | null>(null);
  const [cpuHand, setCpuHand] = useState<Hand | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [score, setScore] = useState({ win: 0, lose: 0, draw: 0 });
  const [shakeIndex, setShakeIndex] = useState(0);

  useEffect(() => {
    if (!isAnimating) return;
    const interval = setInterval(() => {
      setShakeIndex((prev) => (prev + 1) % 3);
    }, 120);
    return () => clearInterval(interval);
  }, [isAnimating]);

  const play = useCallback((hand: Hand) => {
    if (isAnimating) return;
    setResult(null);
    setPlayerHand(null);
    setCpuHand(null);
    setIsAnimating(true);

    setTimeout(() => {
      const cpuChoice = HANDS[Math.floor(Math.random() * 3)].type;
      const gameResult = judge(hand, cpuChoice);
      setPlayerHand(hand);
      setCpuHand(cpuChoice);
      setResult(gameResult);
      setIsAnimating(false);
      if (gameResult) {
        setScore((prev) => ({ ...prev, [gameResult]: prev[gameResult] + 1 }));
      }
    }, 1000);
  }, [isAnimating]);

  const reset = () => {
    setPlayerHand(null);
    setCpuHand(null);
    setResult(null);
    setScore({ win: 0, lose: 0, draw: 0 });
  };

  const cpuDisplayEmoji = isAnimating ? HANDS[shakeIndex].emoji : cpuHand ? HANDS.find((h) => h.type === cpuHand)!.emoji : "❓";
  const playerDisplayEmoji = playerHand ? HANDS.find((h) => h.type === playerHand)!.emoji : "❓";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-8 selection:bg-purple-500/30">
      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 animate-pulse rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 animate-pulse rounded-full bg-blue-600/20 blur-3xl" style={{ animationDelay: "1s" }} />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-pink-600/10 blur-3xl" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-5xl font-bold tracking-tight text-transparent">
            じゃんけん
          </h1>
          <p className="mt-2 text-sm text-white/40">CPUと対戦しよう</p>
        </div>

        {/* Scoreboard */}
        <div className="flex gap-4">
          {[
            { label: "勝ち", value: score.win, color: "text-emerald-400" },
            { label: "負け", value: score.lose, color: "text-rose-400" },
            { label: "あいこ", value: score.draw, color: "text-amber-400" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2 text-center backdrop-blur-xl"
            >
              <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-xs text-white/50">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Battle Arena */}
        <div className="flex w-full items-center justify-center gap-6">
          {/* Player side */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-widest text-white/40">あなた</span>
            <div
              className={`flex h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-5xl backdrop-blur-xl transition-all duration-500 ${
                playerHand ? "scale-100 opacity-100" : "scale-90 opacity-60"
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
            <span className="text-xs font-medium uppercase tracking-widest text-white/40">CPU</span>
            <div
              className={`flex h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-5xl backdrop-blur-xl transition-all duration-500 ${
                isAnimating ? "animate-bounce" : cpuHand ? "scale-100 opacity-100" : "scale-90 opacity-60"
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
              className={`rounded-2xl bg-gradient-to-r ${RESULT_CONFIG[result].bg} border border-white/10 px-8 py-3 text-center backdrop-blur-xl animate-[fadeInUp_0.5s_ease-out]`}
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
              {/* Glow effect on hover */}
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-b from-purple-500/0 to-purple-500/0 transition-all duration-300 group-hover:from-purple-500/10 group-hover:to-blue-500/10" />
            </button>
          ))}
        </div>

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
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
