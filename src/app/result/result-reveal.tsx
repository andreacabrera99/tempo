"use client"

import { useState } from "react"

interface SpotifyImage { url: string }
interface SpotifyResult {
  id: string
  name: string
  description: string
  images: SpotifyImage[]
  external_urls: { spotify: string }
  tracks?: { total: number }
  owner?: { display_name: string }
  publisher?: string
  total_episodes?: number
  type: "playlist" | "show"
}

function BoltIcon({ color = "#0a0a0a", size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 1.44)} viewBox="0 0 18 26" fill="none">
      <path d="M10.5 0L0 15h7.5L7 26L18 11h-7.5L10.5 0Z" fill={color} />
    </svg>
  )
}

function SpotifyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

// ── ALL SET UP screen ─────────────────────────────────────────────────────────

function AllSetScreen({ onStart }: { onStart: () => void }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between px-6"
      style={{
        background: "#0a0a0a",
        paddingTop: "calc(env(safe-area-inset-top) + 3rem)",
        paddingBottom: "3rem",
      }}
    >
      {/* Bolt mark */}
      <div />

      {/* Headline */}
      <div className="flex flex-col items-center gap-6 text-center">
        <div
          className="rounded-full flex items-center justify-center"
          style={{ width: 80, height: 80, background: "#C8FF00" }}
        >
          <BoltIcon color="#0a0a0a" size={28} />
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

        <p
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: "0.78rem",
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          Your playlist is ready
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onStart}
        className="w-full py-4 rounded-full flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        style={{ background: "#C8FF00" }}
      >
        <BoltIcon color="#0a0a0a" size={16} />
        <span
          style={{
            fontFamily: "var(--font-barlow)",
            fontWeight: 900,
            fontSize: "1.15rem",
            color: "#0a0a0a",
          }}
        >
          Start my run
        </span>
      </button>
    </div>
  )
}

// ── Result screen ─────────────────────────────────────────────────────────────

function ResultScreen({ result }: { result: SpotifyResult | null }) {
  const image = result?.images?.[0]?.url
  const name = result?.name
  const spotifyUrl = result?.external_urls?.spotify
  const meta =
    result?.type === "playlist"
      ? `${result.tracks?.total ?? "?"} tracks · ${result.owner?.display_name ?? "Spotify"}`
      : `Podcast · ${result?.publisher ?? "Spotify"}`

  return (
    <div
      className="min-h-screen flex flex-col px-5"
      style={{
        background: "#0a0a0a",
        paddingTop: "calc(env(safe-area-inset-top) + 2rem)",
        paddingBottom: "3rem",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-10">
        <BoltIcon color="#C8FF00" size={14} />
        <span
          className="uppercase"
          style={{
            fontFamily: "var(--font-oswald)",
            fontWeight: 700,
            fontSize: "1.1rem",
            letterSpacing: "0.18em",
            color: "#C8FF00",
          }}
        >
          TEMPO
        </span>
      </div>

      {result ? (
        <>
          {image && (
            <div style={{ width: "100%", maxWidth: 360, margin: "0 auto 2rem", aspectRatio: "1/1" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={name ?? ""}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }}
              />
            </div>
          )}

          <p
            className="uppercase mb-2"
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              color: "#C8FF00",
            }}
          >
            Your match
          </p>

          <h1
            className="text-white mb-2 leading-tight"
            style={{
              fontFamily: "var(--font-barlow)",
              fontWeight: 900,
              fontSize: "clamp(28px, 8vw, 40px)",
            }}
          >
            {name}
          </h1>

          <p
            className="mb-10"
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            {meta}
          </p>

          {spotifyUrl && (
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-4 rounded-full mb-4"
              style={{ background: "#1DB954", textDecoration: "none" }}
            >
              <SpotifyIcon />
              <span
                style={{
                  fontFamily: "var(--font-barlow)",
                  fontWeight: 900,
                  fontSize: "1.05rem",
                  color: "#fff",
                }}
              >
                Open in Spotify
              </span>
            </a>
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p
            className="mb-2"
            style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "1.5rem", color: "white" }}
          >
            No match found
          </p>
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Try different answers or add more playlists to your Spotify library.
          </p>
        </div>
      )}

      <a
        href="/onboarding"
        style={{
          display: "block",
          textAlign: "center",
          fontFamily: "var(--font-geist-sans)",
          fontSize: "0.85rem",
          color: "rgba(255,255,255,0.35)",
          textDecoration: "none",
          marginTop: "1rem",
        }}
      >
        ← Try again
      </a>
    </div>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function ResultReveal({ result }: { result: SpotifyResult | null }) {
  const [phase, setPhase] = useState<"allset" | "result">("allset")

  if (phase === "allset") {
    return <AllSetScreen onStart={() => setPhase("result")} />
  }

  return <ResultScreen result={result} />
}
