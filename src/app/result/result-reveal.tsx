"use client"

interface SpotifyResult {
  external_urls: { spotify: string }
  name: string
  type: "playlist" | "show"
}

function BoltIcon() {
  return (
    <svg width="28" height="40" viewBox="0 0 18 26" fill="none">
      <path d="M10.5 0L0 15h7.5L7 26L18 11h-7.5L10.5 0Z" fill="#0a0a0a" />
    </svg>
  )
}

// Converts https://open.spotify.com/playlist/ID → spotify:playlist:ID
// The URI scheme opens the Spotify app and starts playback immediately
function toSpotifyUri(webUrl: string, type: "playlist" | "show"): string {
  const id = webUrl.split("/").pop()?.split("?")[0] ?? ""
  return `spotify:${type}:${id}`
}

export default function ResultReveal({ result }: { result: SpotifyResult | null }) {
  const spotifyUrl = result
    ? toSpotifyUri(result.external_urls.spotify, result.type)
    : null

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
        )}
      </div>

      {/* CTA */}
      <div className="w-full flex flex-col gap-3">
        {spotifyUrl ? (
          <a
            href={spotifyUrl}
            className="w-full py-4 rounded-full flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ background: "#C8FF00", textDecoration: "none" }}
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
              Start my run
            </span>
          </a>
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
