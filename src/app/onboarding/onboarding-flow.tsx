"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const MODES = [
  {
    id: "adaptive",
    label: "Adaptive Rhythm",
    description: "BPM syncs with your cadence in real-time",
  },
  {
    id: "mood",
    label: "Mood Playlist",
    description: "Curated by mood, workout type & running location",
  },
  {
    id: "smart-mix",
    label: "Smart Audio Mix",
    description: "Music, podcasts & coaching by duration & intensity",
  },
]

const TOTAL_STEPS = 3

export default function OnboardingFlow() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const step = 1

  function handleNext() {
    if (!selected) return
    // Next step routing will be added per mode
    router.push("/dashboard")
  }

  return (
    <div
      className="min-h-screen flex flex-col px-6 pb-10"
      style={{
        background: "#0a0a0a",
        paddingTop: "calc(env(safe-area-inset-top) + 3rem)",
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => router.push("/")}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
          style={{ background: "#18181b" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span
          className="text-sm tabular-nums"
          style={{ fontFamily: "var(--font-geist-mono)", color: "#C8FF00" }}
        >
          {String(step).padStart(2, "0")} / {String(TOTAL_STEPS).padStart(2, "0")}
        </span>
      </div>

      {/* Progress bars */}
      <div className="flex gap-1.5 mb-9">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className="h-[3px] flex-1 rounded-full transition-colors"
            style={{ background: i < step ? "#C8FF00" : "#27272a" }}
          />
        ))}
      </div>

      {/* Question */}
      <div className="mb-8">
        <h1
          className="text-white uppercase leading-[0.88] mb-3"
          style={{
            fontFamily: "var(--font-oswald)",
            fontWeight: 700,
            fontSize: "clamp(48px, 15vw, 72px)",
          }}
        >
          What do you want to explore today?
        </h1>
        <p
          className="text-sm"
          style={{ fontFamily: "var(--font-geist-mono)", color: "rgba(255,255,255,0.4)" }}
        >
          Choose your experience mode.
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3 flex-1">
        {MODES.map((mode) => {
          const isSelected = selected === mode.id
          return (
            <button
              key={mode.id}
              onClick={() => setSelected(mode.id)}
              className="rounded-2xl p-5 text-left transition-all active:scale-[0.98]"
              style={{ background: isSelected ? "#C8FF00" : "#111111" }}
            >
              <div
                className="uppercase leading-tight text-xl"
                style={{
                  fontFamily: "var(--font-oswald)",
                  fontWeight: 700,
                  color: isSelected ? "#0a0a0a" : "#ffffff",
                }}
              >
                {mode.label}
              </div>
              <div
                className="text-xs mt-1"
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  color: isSelected ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.35)",
                }}
              >
                {mode.description}
              </div>
            </button>
          )
        })}
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={!selected}
        className="mt-8 w-full py-4 rounded-full font-bold text-base transition-all active:scale-[0.98] disabled:opacity-25 disabled:cursor-not-allowed"
        style={{
          fontFamily: "var(--font-oswald)",
          fontWeight: 700,
          fontSize: "1.1rem",
          background: "#ffffff",
          color: "#0a0a0a",
        }}
      >
        Next →
      </button>
    </div>
  )
}
