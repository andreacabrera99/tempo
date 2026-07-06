"use client"

import { useEffect } from "react"

function BoltIcon() {
  return (
    <svg width="28" height="40" viewBox="0 0 18 26" fill="none">
      <path d="M10.5 0L0 15h7.5L7 26L18 11h-7.5L10.5 0Z" fill="#0a0a0a" />
    </svg>
  )
}

export default function ResultError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between px-6"
      style={{
        background: "#0a0a0a",
        paddingTop: "calc(env(safe-area-inset-top) + 3rem)",
        paddingBottom: "3rem",
      }}
    >
      <div />

      <div className="flex flex-col items-center gap-6 text-center">
        <div
          className="rounded-full flex items-center justify-center"
          style={{ width: 80, height: 80, background: "#C8FF00" }}
        >
          <BoltIcon />
        </div>

        <h1
          className="text-white leading-none"
          style={{
            fontFamily: "var(--font-barlow)",
            fontWeight: 900,
            fontSize: "clamp(48px, 14vw, 72px)",
            textTransform: "uppercase",
          }}
        >
          COULDN'T
          <br />
          FIND YOUR MIX
        </h1>

        <p
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: "0.82rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.5)",
            maxWidth: "32ch",
          }}
        >
          Spotify didn't respond in time. Give it another shot.
        </p>
      </div>

      <div className="w-full flex flex-col gap-3">
        <button
          onClick={() => unstable_retry()}
          className="w-full py-4 rounded-full flex items-center justify-center transition-all active:scale-[0.98]"
          style={{ background: "#C8FF00", border: "none", cursor: "pointer" }}
        >
          <span
            style={{
              fontFamily: "var(--font-barlow)",
              fontWeight: 900,
              fontSize: "1.15rem",
              color: "#0a0a0a",
            }}
          >
            Try again
          </span>
        </button>

        <a
          href="/onboarding"
          style={{
            display: "block",
            textAlign: "center",
            fontFamily: "var(--font-geist-sans)",
            fontSize: "0.82rem",
            color: "rgba(255,255,255,0.3)",
            textDecoration: "none",
          }}
        >
          ← Start over
        </a>
      </div>
    </div>
  )
}
