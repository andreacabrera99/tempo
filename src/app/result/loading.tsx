"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

// ── Label maps ───────────────────────────────────────────────────────────────

const LOCATION_LABELS: Record<string, string> = {
  street: "CITY ROUTE",
  park: "PARK",
  treadmill: "TREADMILL",
  trail: "TRAIL RUN",
}

const CONTENT_LABELS: Record<string, string> = {
  podcasts: "PODCAST MIX",
  coaching: "AUDIO COACHING",
}

const MOOD_INTENSITY: Record<string, string> = {
  hyped:      "HIGH INTENSITY",
  "locked-in":"DEEP FOCUS",
  floaty:     "LIGHT RUN",
  heavy:      "GRIND MODE",
  chill:      "RECOVERY",
  angry:      "RAGE MODE",
}

// ── Waveform config ──────────────────────────────────────────────────────────

const BARS = [
  { color: "#C8FF00", delay: "0s",     dur: "0.65s" },
  { color: "#ff4488", delay: "0.12s",  dur: "0.72s" },
  { color: "#a855f7", delay: "0.28s",  dur: "0.58s" },
  { color: "#6366f1", delay: "0.08s",  dur: "0.80s" },
  { color: "#22d3ee", delay: "0.22s",  dur: "0.68s" },
  { color: "#C8FF00", delay: "0.04s",  dur: "0.75s" },
  { color: "#C8FF00", delay: "0.18s",  dur: "0.62s" },
]

// ── Icons ────────────────────────────────────────────────────────────────────

function BoltIcon() {
  return (
    <svg width="44" height="60" viewBox="0 0 18 26" fill="none">
      <path d="M10.5 0L0 15h7.5L7 26L18 11h-7.5L10.5 0Z" fill="#0a0a0a" />
    </svg>
  )
}

// ── Main UI ──────────────────────────────────────────────────────────────────

interface P {
  mode: string | null
  bpm: string | null
  goalType: string | null
  goalValue: string | null
  mood: string | null
  location: string | null
  content: string | null
}

function LoadingUI({ p }: { p: P }) {
  const [progress, setProgress] = useState(10)

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) { clearInterval(id); return prev }
        return Math.min(88, prev + Math.random() * 8 + 2)
      })
    }, 380)
    return () => clearInterval(id)
  }, [])

  // Subtitle line
  const subtitle: string[] = []
  if (p.bpm) subtitle.push(`${p.bpm} SPM`)
  if (p.goalValue && p.goalType) subtitle.push(`${p.goalValue} ${p.goalType === "time" ? "MIN" : "KM"}`)
  if (p.mood) subtitle.push(MOOD_INTENSITY[p.mood] ?? "")
  else if (p.bpm) {
    const n = parseInt(p.bpm)
    if (n >= 175)     subtitle.push("HIGH INTENSITY")
    else if (n >= 160) subtitle.push("TEMPO RUN")
    else if (n >= 140) subtitle.push("STEADY PACE")
    else               subtitle.push("EASY PACE")
  }

  // Tags
  const tags: { label: string; accent: boolean }[] = []
  if (p.mood) tags.push({ label: p.mood.replace("-", " ").toUpperCase(), accent: true })
  if (p.location) tags.push({ label: LOCATION_LABELS[p.location] ?? p.location.toUpperCase(), accent: false })
  if (p.content) {
    p.content.split(",").forEach((c) => {
      const label = CONTENT_LABELS[c]
      if (label) tags.push({ label, accent: false })
    })
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-6"
      style={{
        background: "#0a0a0a",
        paddingTop: "calc(env(safe-area-inset-top) + 2.5rem)",
        paddingBottom: "2.5rem",
      }}
    >
      <style>{`
        @keyframes tempo-bar {
          0%, 100% { transform: scaleY(0.25); }
          50%       { transform: scaleY(1); }
        }
      `}</style>

      {/* ── Visual ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-7">
        {/* Concentric rings + bolt */}
        <div className="relative flex items-center justify-center" style={{ width: 270, height: 270 }}>
          <div
            className="absolute rounded-full"
            style={{ width: 270, height: 270, border: "1px solid rgba(200,255,0,0.15)" }}
          />
          <div
            className="absolute rounded-full"
            style={{ width: 190, height: 190, border: "1px solid rgba(200,255,0,0.25)" }}
          />
          <div
            className="rounded-full flex items-center justify-center"
            style={{ width: 118, height: 118, background: "#C8FF00" }}
          >
            <BoltIcon />
          </div>
        </div>

        {/* Waveform bars */}
        <div className="flex items-end gap-[5px]" style={{ height: 34 }}>
          {BARS.map((bar, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 32,
                background: bar.color,
                borderRadius: 4,
                transformOrigin: "bottom",
                animation: `tempo-bar ${bar.dur} ease-in-out ${bar.delay} infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Text ── */}
      <div className="w-full flex flex-col items-center gap-4">
        <h1
          className="text-white text-center leading-none"
          style={{
            fontFamily: "var(--font-barlow)",
            fontWeight: 900,
            fontSize: "clamp(58px, 18vw, 90px)",
            textTransform: "uppercase",
          }}
        >
          CURATING
          <br />
          YOUR RUN
        </h1>

        {subtitle.filter(Boolean).length > 0 && (
          <p
            className="text-center"
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "#C8FF00",
            }}
          >
            {subtitle.filter(Boolean).join(" · ")}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {tags.map((tag, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  padding: "0.35rem 0.85rem",
                  borderRadius: 999,
                  background: tag.accent ? "#C8FF00" : "#1a1a1a",
                  color: tag.accent ? "#0a0a0a" : "rgba(255,255,255,0.7)",
                }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full mt-2">
          <div className="flex justify-between mb-2">
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: "0.62rem",
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.28)",
              }}
            >
              BUILDING PLAYLIST
            </span>
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: "0.62rem",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.28)",
              }}
            >
              {Math.round(progress)}%
            </span>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 4, background: "#1a1a1a" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(to right, #a855f7, #C8FF00)",
                transition: "width 0.5s ease-out",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Wrapper that reads URL params ─────────────────────────────────────────────

function LoadingWithParams() {
  const sp = useSearchParams()
  return (
    <LoadingUI
      p={{
        mode:       sp.get("mode"),
        bpm:        sp.get("bpm"),
        goalType:   sp.get("goalType"),
        goalValue:  sp.get("goalValue"),
        mood:       sp.get("mood"),
        location:   sp.get("location"),
        content:    sp.get("content"),
      }}
    />
  )
}

const EMPTY: P = { mode: null, bpm: null, goalType: null, goalValue: null, mood: null, location: null, content: null }

export default function Loading() {
  return (
    <Suspense fallback={<LoadingUI p={EMPTY} />}>
      <LoadingWithParams />
    </Suspense>
  )
}
