"use client"

import { useState } from "react"

interface SpotifyResult {
  external_urls: { spotify: string }
  name: string
  type: "playlist" | "show" | "episode"
  tracks?: { total: number }
  duration_ms?: number
}

function BoltIcon() {
  return (
    <svg width="28" height="40" viewBox="0 0 18 26" fill="none">
      <path d="M10.5 0L0 15h7.5L7 26L18 11h-7.5L10.5 0Z" fill="#0a0a0a" />
    </svg>
  )
}

function toSpotifyUri(webUrl: string, type: "playlist" | "show" | "episode"): string {
  const id = webUrl.split("/").pop()?.split("?")[0] ?? ""
  return `spotify:${type}:${id}`
}

export default function ResultReveal({ result, sharing = "solo" }: { result: SpotifyResult | null; sharing?: "solo" | "crew" }) {
  const [loading, setLoading] = useState(false)
  const spotifyUri = result
    ? toSpotifyUri(result.external_urls.spotify, result.type)
    : null

  async function tryPlay(): Promise<boolean> {
    if (!spotifyUri) return false
    try {
      const res = await fetch("/api/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contextUri: spotifyUri }),
      })
      const data = await res.json()
      return Boolean(data.ok)
    } catch {
      return false
    }
  }

  async function handleStart() {
    if (!spotifyUri) return
    setLoading(true)

    // If a Spotify device is already active, start playback right away.
    let played = await tryPlay()

    // Open the Spotify app — this registers it as a device and shows the player.
    window.location.href = spotifyUri

    // The app may have just come online; retry the play command a few times
    // until the device registers (stop once we've switched away from this tab).
    for (let i = 0; i < 5 && !played && !document.hidden; i++) {
      await new Promise((r) => setTimeout(r, 1000))
      played = await tryPlay()
    }
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
          {result ? (
            <>
              ALL
              <br />
              SET UP.
            </>
          ) : (
            <>
              NO
              <br />
              MATCH.
            </>
          )}
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
            {result.type === "episode" && result.duration_ms != null ? (
              <p
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.08em",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                {Math.round(result.duration_ms / 60000)} min · guided run
              </p>
            ) : result.tracks?.total != null ? (
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
            ) : null}
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
                {loading ? "Opening Spotify…" : "Start my run"}
              </span>
            </button>
            {sharing === "crew" && (
              <div
                className="w-full flex flex-col gap-3"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(200,255,0,0.18)",
                  borderRadius: 18,
                  padding: "1.1rem 1.2rem",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: "0.68rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#C8FF00",
                  }}
                >
                  Invite your crew
                </p>
                {[
                  "Tap ··· on the Spotify player",
                  "Choose “Start a Jam” ⚡",
                  "Share the link with your friends",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        background: "#C8FF00",
                        fontFamily: "var(--font-barlow)",
                        fontWeight: 900,
                        fontSize: "0.75rem",
                        color: "#0a0a0a",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-geist-sans)",
                        fontSize: "0.85rem",
                        color: "rgba(255,255,255,0.72)",
                      }}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
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
