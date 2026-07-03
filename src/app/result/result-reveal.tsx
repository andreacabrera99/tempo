"use client"

import { useState } from "react"

interface SpotifyResult {
  external_urls: { spotify: string }
  name: string
  type: "playlist" | "show"
  tracks?: { total: number }
}

function BoltIcon() {
  return (
    <svg width="28" height="40" viewBox="0 0 18 26" fill="none">
      <path d="M10.5 0L0 15h7.5L7 26L18 11h-7.5L10.5 0Z" fill="#0a0a0a" />
    </svg>
  )
}

function toSpotifyUri(webUrl: string, type: "playlist" | "show"): string {
  const id = webUrl.split("/").pop()?.split("?")[0] ?? ""
  return `spotify:${type}:${id}`
}

export default function ResultReveal({ result, sharing = "solo" }: { result: SpotifyResult | null; sharing?: "solo" | "crew" }) {
  const [loading, setLoading] = useState(false)
  const spotifyUri = result
    ? toSpotifyUri(result.external_urls.spotify, result.type)
    : null

  async function handleStart() {
    if (!spotifyUri) return
    setLoading(true)
    try {
      // Trigger playback via API so Spotify opens to the now-playing screen
      await fetch("/api/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contextUri: spotifyUri }),
      })
    } catch {}
    // Open Spotify — if play API succeeded it shows the player, otherwise opens the playlist
    window.location.href = spotifyUri
  }

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

      {/* Headline */}
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
            fontSize: "clamp(62px, 19vw, 96px)",
            textTransform: "uppercase",
          }}
        >
          ALL
          <br />
          SET UP.
        </h1>

        {result?.name && (
          <div className="flex flex-col items-center gap-1">
            <p
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: "0.78rem",
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              {result.name}
            </p>
            {result.tracks?.total != null && (
              <p
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.08em",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                ~{Math.round(result.tracks.total * 4)} min · {result.tracks.total} songs
              </p>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="w-full flex flex-col gap-3">
        {spotifyUri ? (
          <>
            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full py-4 rounded-full flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: "#C8FF00", border: "none", cursor: "pointer" }}
            >
              <BoltIcon />
              <span
                style={{
                  fontFamily: "var(--font-barlow)",
                  fontWeight: 900,
                  fontSize: "1.15rem",
                  color: "#0a0a0a",
                }}
              >
                {loading ? "Opening Spotify…" : sharing === "crew" ? "Start the Jam" : "Start my run"}
              </span>
            </button>
            {sharing === "crew" && (
              <p
                className="text-center"
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.08em",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                In Spotify: tap ··· → Start a Jam to invite your crew
              </p>
            )}
          </>
        ) : (
          <p
            className="text-center"
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            No playlist found. Try again with different answers.
          </p>
        )}

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
          ← Try again
        </a>
      </div>
    </div>
  )
}
