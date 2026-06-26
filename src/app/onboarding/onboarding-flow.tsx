"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// ── Icons ────────────────────────────────────────────────────────────────────

function BoltIcon({ color = "#C8FF00", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M10.5 2L3.5 10.5H9L7.5 16L14.5 7.5H9L10.5 2Z" fill={color} />
    </svg>
  )
}

function MoodIcon({ color = "white" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7.5" stroke={color} strokeWidth="1.5" />
      <path d="M9 1.5a7.5 7.5 0 0 1 0 15V1.5z" fill={color} />
    </svg>
  )
}

function MusicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M7 14V5.5L15 3.5V12" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5.5" cy="14" r="2" fill="#a855f7" />
      <circle cx="13.5" cy="12" r="2" fill="#a855f7" />
    </svg>
  )
}

function CardIcon({ icon, selected }: { icon: "lightning" | "mood" | "music"; selected: boolean }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl shrink-0"
      style={{
        width: 48,
        height: 48,
        background: selected ? "rgba(0,0,0,0.15)" : "#1a1a1a",
      }}
    >
      {icon === "lightning" && <BoltIcon color={selected ? "#0a0a0a" : "#C8FF00"} size={20} />}
      {icon === "mood" && <MoodIcon color={selected ? "#0a0a0a" : "white"} />}
      {icon === "music" && <MusicIcon />}
    </div>
  )
}

// ── Shared header (back + step counter + progress bars) ──────────────────────

function StepHeader({
  onBack,
  step,
  total,
}: {
  onBack: () => void
  step: number
  total: number
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
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
          {String(step).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      <div className="flex gap-1.5 mb-9">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="h-[3px] flex-1 rounded-full transition-colors"
            style={{ background: i < step ? "#C8FF00" : "#27272a" }}
          />
        ))}
      </div>
    </>
  )
}

// ── Step 0: Mode selection ───────────────────────────────────────────────────

const MODES = [
  {
    id: "cadence",
    label: "MATCH MY CADENCE",
    description: "set a pace, we find the BPM",
    icon: "lightning" as const,
  },
  {
    id: "mood",
    label: "MATCH MY MOOD",
    description: "pick how you feel right now",
    icon: "mood" as const,
  },
  {
    id: "mix",
    label: "BUILD AN AUDIO MIX",
    description: "blend podcasts, music & talk",
    icon: "music" as const,
  },
]

function ModeStep({ onNext }: { onNext: (mode: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div
      className="min-h-screen flex flex-col px-5 pb-10"
      style={{
        background: "#0a0a0a",
        paddingTop: "calc(env(safe-area-inset-top) + 2rem)",
      }}
    >
      <div className="flex items-center gap-2 mb-8">
        <BoltIcon color="#C8FF00" size={18} />
        <span
          className="uppercase"
          style={{
            fontFamily: "var(--font-oswald)",
            fontWeight: 700,
            fontSize: "1.15rem",
            letterSpacing: "0.18em",
            color: "#C8FF00",
          }}
        >
          TEMPO
        </span>
      </div>

      <h1
        className="text-white leading-[0.92] mb-10"
        style={{
          fontFamily: "var(--font-barlow)",
          fontWeight: 900,
          fontSize: "clamp(52px, 16vw, 80px)",
        }}
      >
        What do you want to do today?
      </h1>

      <div className="flex flex-col gap-3 flex-1">
        {MODES.map((mode) => {
          const isSelected = selected === mode.id
          return (
            <button
              key={mode.id}
              onClick={() => { setSelected(mode.id); onNext(mode.id) }}
              className="flex items-center gap-4 rounded-2xl px-4 py-6 text-left transition-all active:scale-[0.98]"
              style={{ background: isSelected ? "#C8FF00" : "#111111" }}
            >
              <CardIcon icon={mode.icon} selected={isSelected} />
              <div className="flex-1 min-w-0">
                <div
                  className="uppercase leading-tight"
                  style={{
                    fontFamily: "var(--font-oswald)",
                    fontWeight: 700,
                    fontSize: "1.15rem",
                    color: isSelected ? "#0a0a0a" : "#ffffff",
                  }}
                >
                  {mode.label}
                </div>
                <div
                  className="text-xs mt-0.5 leading-snug"
                  style={{
                    fontFamily: "var(--font-geist-sans)",
                    color: isSelected ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {mode.description}
                </div>
              </div>
              {!isSelected && (
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem" }}>→</span>
              )}
            </button>
          )
        })}
      </div>

    </div>
  )
}

// ── Cadence step 1: BPM picker ───────────────────────────────────────────────

function CadenceBpmStep({
  onBack,
  onNext,
}: {
  onBack: () => void
  onNext: (bpm: number) => void
}) {
  const [bpm, setBpm] = useState(100)

  const decrease = () => setBpm((v) => Math.max(100, v - 10))
  const increase = () => setBpm((v) => Math.min(200, v + 10))

  return (
    <div
      className="min-h-screen flex flex-col px-5 pb-10"
      style={{
        background: "#0a0a0a",
        paddingTop: "calc(env(safe-area-inset-top) + 2rem)",
      }}
    >
      <StepHeader onBack={onBack} step={1} total={3} />

      <h1
        className="text-white leading-[0.92] mb-10"
        style={{
          fontFamily: "var(--font-barlow)",
          fontWeight: 900,
          fontSize: "clamp(48px, 15vw, 72px)",
        }}
      >
        What cadence do you want?
      </h1>

      {/* BPM display */}
      <div className="mb-2 text-center">
        <span
          className="text-white leading-none tabular-nums"
          style={{
            fontFamily: "var(--font-barlow)",
            fontWeight: 900,
            fontSize: "clamp(96px, 28vw, 140px)",
          }}
        >
          {bpm}
        </span>
      </div>

      <p
        className="mb-12 tracking-widest text-xs uppercase text-center"
        style={{ fontFamily: "var(--font-geist-mono)", color: "#C8FF00" }}
      >
        SPM · STEPS PER MIN
      </p>

      <PlusMinusControls
        onDecrease={decrease}
        onIncrease={increase}
        disableMinus={bpm <= 100}
        disablePlus={bpm >= 200}
      />

      <button
        onClick={() => onNext(bpm)}
        className="mt-8 w-full py-4 rounded-full transition-all active:scale-[0.98]"
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

// ── Mix step 1: content picker ───────────────────────────────────────────────

const MIX_CONTENT = [
  {
    id: "podcasts",
    label: "Podcasts",
    description: "your shows, between tracks",
    icon: (
      <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
        <rect x="6" y="1" width="8" height="13" rx="4" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
        <path d="M2 10a8 8 0 0 0 16 0" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="10" y1="18" x2="10" y2="21" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="21" x2="13" y2="21" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "music",
    label: "Music",
    description: "tracks from your library",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M8 16V6l9-2.5V13" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6" cy="16" r="2.5" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
        <circle cx="15" cy="13" r="2.5" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "coaching",
    label: "Audio coaching",
    description: "pace & form cues",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" fill="#7c3aed" opacity="0.3" />
        <circle cx="10" cy="10" r="4" fill="#7c3aed" />
      </svg>
    ),
  },
]

function MixContentStep({
  onBack,
  onNext,
}: {
  onBack: () => void
  onNext: (content: string[]) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(["music"]))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div
      className="min-h-screen flex flex-col px-5 pb-10"
      style={{
        background: "#0a0a0a",
        paddingTop: "calc(env(safe-area-inset-top) + 2rem)",
      }}
    >
      <StepHeader onBack={onBack} step={1} total={3} />

      <h1
        className="text-white leading-[0.92] mb-8"
        style={{
          fontFamily: "var(--font-barlow)",
          fontWeight: 900,
          fontSize: "clamp(48px, 15vw, 72px)",
        }}
      >
        What do you want to hear?
      </h1>

      <div className="flex flex-col gap-3 flex-1">
        {MIX_CONTENT.map((item) => {
          const isSelected = selected.has(item.id)
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className="flex items-center gap-4 rounded-2xl px-4 py-5 text-left transition-all active:scale-[0.98]"
              style={{
                background: "#111111",
                border: isSelected ? "2px solid #C8FF00" : "2px solid transparent",
              }}
            >
              <div
                className="flex items-center justify-center rounded-xl shrink-0"
                style={{ width: 48, height: 48, background: "#1a1a1a" }}
              >
                {item.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className="leading-tight text-white mb-0.5"
                  style={{
                    fontFamily: "var(--font-barlow)",
                    fontWeight: 900,
                    fontSize: "1.1rem",
                  }}
                >
                  {item.label}
                </div>
                <div
                  className="text-xs leading-snug"
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {item.description}
                </div>
              </div>

              {/* Checkbox */}
              <div
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: isSelected ? "#C8FF00" : "transparent",
                  border: isSelected ? "none" : "2px solid rgba(255,255,255,0.2)",
                }}
              >
                {isSelected && (
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5l3.5 3.5L11 1" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={() => selected.size > 0 && onNext(Array.from(selected))}
        disabled={selected.size === 0}
        className="mt-8 w-full py-4 rounded-full transition-all active:scale-[0.98] disabled:opacity-25 disabled:cursor-not-allowed"
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

// ── Mood step 1: feeling ─────────────────────────────────────────────────────

const MOODS = [
  { id: "hyped",     label: "HYPED",     description: "max energy" },
  { id: "locked-in", label: "LOCKED IN", description: "deep focus" },
  { id: "floaty",   label: "FLOATY",    description: "easy & light" },
  { id: "heavy",    label: "HEAVY",     description: "grind mode" },
  { id: "chill",    label: "CHILL",     description: "recovery" },
  { id: "angry",    label: "ANGRY",     description: "rage run" },
]

function MoodFeelingStep({
  onBack,
  onNext,
}: {
  onBack: () => void
  onNext: (mood: string) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div
      className="min-h-screen flex flex-col px-5 pb-10"
      style={{
        background: "#0a0a0a",
        paddingTop: "calc(env(safe-area-inset-top) + 2rem)",
      }}
    >
      <StepHeader onBack={onBack} step={1} total={4} />

      <h1
        className="text-white leading-[0.92] mb-8"
        style={{
          fontFamily: "var(--font-barlow)",
          fontWeight: 900,
          fontSize: "clamp(48px, 15vw, 72px)",
        }}
      >
        How do you feel?
      </h1>

      {/* 2-column mood grid */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {MOODS.map((mood) => {
          const isSelected = selected === mood.id
          return (
            <button
              key={mood.id}
              onClick={() => setSelected(mood.id)}
              className="rounded-2xl p-4 text-left transition-all active:scale-[0.97]"
              style={{ background: isSelected ? "#C8FF00" : "#111111" }}
            >
              <div
                className="uppercase leading-tight mb-1"
                style={{
                  fontFamily: "var(--font-oswald)",
                  fontWeight: 700,
                  fontSize: "1.25rem",
                  color: isSelected ? "#0a0a0a" : "#ffffff",
                }}
              >
                {mood.label}
              </div>
              <div
                className="text-xs leading-snug"
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  color: isSelected ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.4)",
                }}
              >
                {mood.description}
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={() => selected && onNext(selected)}
        disabled={!selected}
        className="mt-8 w-full py-4 rounded-full transition-all active:scale-[0.98] disabled:opacity-25 disabled:cursor-not-allowed"
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

// ── Mood step 3: location ────────────────────────────────────────────────────

const LOCATIONS = [
  { id: "street",    label: "STREET",    description: "city route",    emoji: "🏙️" },
  { id: "park",      label: "PARK",      description: "green & open",  emoji: "🌳" },
  { id: "treadmill", label: "TREADMILL", description: "steady indoor", emoji: "🏃" },
  { id: "trail",     label: "TRAIL",     description: "off-road",      emoji: "⛰️" },
]

function MoodLocationStep({
  onBack,
  onNext,
}: {
  onBack: () => void
  onNext: (location: string) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div
      className="min-h-screen flex flex-col px-5 pb-10"
      style={{
        background: "#0a0a0a",
        paddingTop: "calc(env(safe-area-inset-top) + 2rem)",
      }}
    >
      <StepHeader onBack={onBack} step={3} total={4} />

      <h1
        className="text-white leading-[0.92] mb-8"
        style={{
          fontFamily: "var(--font-barlow)",
          fontWeight: 900,
          fontSize: "clamp(48px, 15vw, 72px)",
        }}
      >
        Where are you running?
      </h1>

      {/* 2x2 grid */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {LOCATIONS.map((loc) => {
          const isSelected = selected === loc.id
          return (
            <button
              key={loc.id}
              onClick={() => setSelected(loc.id)}
              className="rounded-2xl p-4 text-left flex flex-col transition-all active:scale-[0.97]"
              style={{ background: isSelected ? "#C8FF00" : "#111111", minHeight: 160 }}
            >
              <span className="text-2xl mb-auto">{loc.emoji}</span>
              <div>
                <div
                  className="uppercase leading-tight mb-0.5"
                  style={{
                    fontFamily: "var(--font-oswald)",
                    fontWeight: 700,
                    fontSize: "1.2rem",
                    color: isSelected ? "#0a0a0a" : "#ffffff",
                  }}
                >
                  {loc.label}
                </div>
                <div
                  className="text-xs leading-snug"
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    color: isSelected ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {loc.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={() => selected && onNext(selected)}
        disabled={!selected}
        className="mt-8 w-full py-4 rounded-full transition-all active:scale-[0.98] disabled:opacity-25 disabled:cursor-not-allowed"
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

// ── Cadence step 3: sharing ──────────────────────────────────────────────────

function CadenceSharingStep({
  onBack,
  onNext,
}: {
  onBack: () => void
  onNext: (sharing: "crew" | "solo") => void
}) {
  const [selected, setSelected] = useState<"crew" | "solo">("solo")

  const options = [
    {
      id: "crew" as const,
      label: "With my crew",
      description: "your friends can tune in",
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="8" cy="7" r="3" fill="rgba(100,140,200,0.9)" />
          <circle cx="15" cy="7" r="2.5" fill="rgba(100,140,200,0.7)" />
          <path d="M1 18c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="rgba(100,140,200,0.9)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M15 12c2.761 0 5 1.79 5 4" stroke="rgba(100,140,200,0.7)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "solo" as const,
      label: "Just me",
      description: "private session",
      icon: (
        <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
          <rect x="2" y="9" width="16" height="12" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          <path d="M6 9V6a4 4 0 0 1 8 0v3" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="15" r="2" fill="rgba(255,255,255,0.6)" />
        </svg>
      ),
    },
  ]

  return (
    <div
      className="min-h-screen flex flex-col px-5 pb-10"
      style={{
        background: "#0a0a0a",
        paddingTop: "calc(env(safe-area-inset-top) + 2rem)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "#18181b" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span
          className="text-sm tracking-widest uppercase"
          style={{ fontFamily: "var(--font-geist-mono)", color: "#C8FF00" }}
        >
          LAST STEP
        </span>
      </div>

      {/* Single full progress bar */}
      <div className="h-[3px] w-full rounded-full mb-9" style={{ background: "#C8FF00" }} />

      <h1
        className="text-white leading-[0.92] mb-8"
        style={{
          fontFamily: "var(--font-barlow)",
          fontWeight: 900,
          fontSize: "clamp(48px, 15vw, 72px)",
        }}
      >
        Want to share your session?
      </h1>

      {/* Options */}
      <div className="flex flex-col gap-3 flex-1">
        {options.map((opt) => {
          const isSelected = selected === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className="flex items-center gap-4 rounded-2xl px-4 py-5 text-left transition-all active:scale-[0.98]"
              style={{
                background: "#111111",
                border: isSelected ? "2px solid #C8FF00" : "2px solid transparent",
              }}
            >
              {/* Icon */}
              <div
                className="flex items-center justify-center rounded-xl shrink-0"
                style={{ width: 48, height: 48, background: "#1a1a1a" }}
              >
                {opt.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div
                  className="leading-tight text-white"
                  style={{
                    fontFamily: "var(--font-barlow)",
                    fontWeight: 900,
                    fontSize: "1.15rem",
                  }}
                >
                  {opt.label}
                </div>
                <div
                  className="text-xs mt-0.5 leading-snug"
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {opt.description}
                </div>
              </div>

              {/* Radio */}
              <div
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: isSelected ? "#C8FF00" : "transparent",
                  border: isSelected ? "none" : "2px solid rgba(255,255,255,0.2)",
                }}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#0a0a0a" }} />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* CTA */}
      <button
        onClick={() => onNext(selected)}
        className="mt-8 w-full py-4 rounded-full flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        style={{
          background: "#C8FF00",
          color: "#0a0a0a",
        }}
      >
        <BoltIcon color="#0a0a0a" size={16} />
        <span
          style={{
            fontFamily: "var(--font-barlow)",
            fontWeight: 900,
            fontSize: "1.15rem",
          }}
        >
          Start my run
        </span>
      </button>
    </div>
  )
}

// ── Shared +/- button pair ───────────────────────────────────────────────────

function PlusMinusControls({
  onDecrease,
  onIncrease,
  disableMinus,
  disablePlus,
}: {
  onDecrease: () => void
  onIncrease: () => void
  disableMinus: boolean
  disablePlus: boolean
}) {
  return (
    <div className="flex gap-6 justify-center mb-auto">
      <button
        onClick={onDecrease}
        disabled={disableMinus}
        className="w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all active:scale-[0.95] disabled:opacity-30"
        style={{ background: "#18181b", color: "#ffffff", fontFamily: "var(--font-barlow)", fontWeight: 900 }}
      >
        −
      </button>
      <button
        onClick={onIncrease}
        disabled={disablePlus}
        className="w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all active:scale-[0.95] disabled:opacity-30"
        style={{ background: "#C8FF00", color: "#0a0a0a", fontFamily: "var(--font-barlow)", fontWeight: 900 }}
      >
        +
      </button>
    </div>
  )
}

// ── Cadence step 2: distance/time picker ─────────────────────────────────────

function CadenceGoalStep({
  onBack,
  onNext,
  step = 2,
  total = 3,
}: {
  onBack: () => void
  onNext: (goal: { type: "time" | "distance"; value: number }) => void
  step?: number
  total?: number
}) {
  const [tab, setTab] = useState<"time" | "distance">("time")
  const [minutes, setMinutes] = useState(20)
  const [km, setKm] = useState(1)

  const value = tab === "time" ? minutes : km
  const label = tab === "time" ? "MINUTES" : "KILOMETERS"

  return (
    <div
      className="min-h-screen flex flex-col px-5 pb-10"
      style={{
        background: "#0a0a0a",
        paddingTop: "calc(env(safe-area-inset-top) + 2rem)",
      }}
    >
      <StepHeader onBack={onBack} step={step} total={total} />

      <h1
        className="text-white leading-[0.92] mb-8"
        style={{
          fontFamily: "var(--font-barlow)",
          fontWeight: 900,
          fontSize: "clamp(48px, 15vw, 72px)",
        }}
      >
        How far are you going?
      </h1>

      {/* TIME / DISTANCE toggle */}
      <div
        className="flex rounded-full p-1 mb-8"
        style={{ background: "#18181b" }}
      >
        {(["time", "distance"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 rounded-full uppercase text-sm font-bold transition-all"
            style={{
              fontFamily: "var(--font-oswald)",
              fontWeight: 700,
              letterSpacing: "0.08em",
              background: tab === t ? "#C8FF00" : "transparent",
              color: tab === t ? "#0a0a0a" : "rgba(255,255,255,0.35)",
            }}
          >
            {t === "time" ? "TIME" : "DISTANCE"}
          </button>
        ))}
      </div>

      {/* Value display */}
      <div className="mb-2 text-center">
        <span
          className="text-white leading-none tabular-nums"
          style={{
            fontFamily: "var(--font-barlow)",
            fontWeight: 900,
            fontSize: "clamp(96px, 28vw, 140px)",
          }}
        >
          {value}
        </span>
      </div>

      <p
        className="mb-12 tracking-widest text-xs uppercase text-center"
        style={{ fontFamily: "var(--font-geist-mono)", color: "#C8FF00" }}
      >
        {label}
      </p>

      <PlusMinusControls
        onDecrease={() =>
          tab === "time"
            ? setMinutes((v) => Math.max(1, v - 1))
            : setKm((v) => Math.max(1, v - 1))
        }
        onIncrease={() =>
          tab === "time" ? setMinutes((v) => v + 1) : setKm((v) => v + 1)
        }
        disableMinus={value <= 1}
        disablePlus={false}
      />

      <button
        onClick={() => onNext({ type: tab, value })}
        className="mt-8 w-full py-4 rounded-full transition-all active:scale-[0.98]"
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

// ── Root orchestrator ────────────────────────────────────────────────────────

type FlowStep = "mode" | "cadence-bpm" | "cadence-goal" | "cadence-sharing" | "mood-feeling" | "mood-goal" | "mood-location" | "mood-sharing" | "mix-content" | "mix-goal" | "mix-sharing"

export default function OnboardingFlow() {
  const router = useRouter()
  const [flowStep, setFlowStep] = useState<FlowStep>("mode")
  const [mode, setMode] = useState<string | null>(null)

  useEffect(() => {
    const pin = () => {
      document.documentElement.style.backgroundColor = "#0a0a0a"
      document.body.style.backgroundColor = "#0a0a0a"
    }
    pin()
    window.addEventListener("scroll", pin, { passive: true })
    return () => window.removeEventListener("scroll", pin)
  }, [])

  function handleModeNext(selectedMode: string) {
    setMode(selectedMode)
    if (selectedMode === "cadence") setFlowStep("cadence-bpm")
    else if (selectedMode === "mood") setFlowStep("mood-feeling")
    else if (selectedMode === "mix") setFlowStep("mix-content")
    else router.push("/dashboard")
  }


  if (flowStep === "cadence-bpm") {
    return (
      <CadenceBpmStep
        onBack={() => setFlowStep("mode")}
        onNext={() => setFlowStep("cadence-goal")}
      />
    )
  }

  if (flowStep === "cadence-goal") {
    return (
      <CadenceGoalStep
        onBack={() => setFlowStep("cadence-bpm")}
        onNext={() => setFlowStep("cadence-sharing")}
      />
    )
  }

  if (flowStep === "mood-feeling") {
    return (
      <MoodFeelingStep
        onBack={() => setFlowStep("mode")}
        onNext={() => setFlowStep("mood-goal")}
      />
    )
  }

  if (flowStep === "mood-goal") {
    return (
      <CadenceGoalStep
        onBack={() => setFlowStep("mood-feeling")}
        onNext={() => setFlowStep("mood-location")}
        step={2}
        total={4}
      />
    )
  }

  if (flowStep === "mood-location") {
    return (
      <MoodLocationStep
        onBack={() => setFlowStep("mood-goal")}
        onNext={() => setFlowStep("mood-sharing")}
      />
    )
  }

  if (flowStep === "mix-content") {
    return (
      <MixContentStep
        onBack={() => setFlowStep("mode")}
        onNext={() => setFlowStep("mix-goal")}
      />
    )
  }

  if (flowStep === "mix-goal") {
    return (
      <CadenceGoalStep
        onBack={() => setFlowStep("mix-content")}
        onNext={() => setFlowStep("mix-sharing")}
        step={2}
        total={3}
      />
    )
  }

  if (flowStep === "mix-sharing") {
    return (
      <CadenceSharingStep
        onBack={() => setFlowStep("mix-goal")}
        onNext={() => router.push("/dashboard")}
      />
    )
  }

  if (flowStep === "mood-sharing") {
    return (
      <CadenceSharingStep
        onBack={() => setFlowStep("mood-location")}
        onNext={() => router.push("/dashboard")}
      />
    )
  }

  if (flowStep === "cadence-sharing") {
    return (
      <CadenceSharingStep
        onBack={() => setFlowStep("cadence-goal")}
        onNext={() => router.push("/dashboard")}
      />
    )
  }

  return <ModeStep onNext={handleModeNext} />
}
