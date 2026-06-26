import { auth } from "@/auth"
import { redirect } from "next/navigation"

// ── Types ────────────────────────────────────────────────────────────────────

type SpotifyImage = { url: string; height: number | null; width: number | null }

type SpotifyPlaylist = {
  id: string
  name: string
  description: string
  images: SpotifyImage[]
  external_urls: { spotify: string }
  tracks: { total: number }
  owner: { display_name: string }
  type: "playlist"
}

type SpotifyShow = {
  id: string
  name: string
  description: string
  images: SpotifyImage[]
  external_urls: { spotify: string }
  publisher: string
  total_episodes: number
  type: "show"
}

type SpotifyResult = SpotifyPlaylist | SpotifyShow

// ── Spotify helpers ──────────────────────────────────────────────────────────

async function getUserPlaylists(token: string): Promise<SpotifyPlaylist[]> {
  const res = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.items ?? []).filter(Boolean).map((p: SpotifyPlaylist) => ({ ...p, type: "playlist" as const }))
}

async function searchCatalog(
  token: string,
  query: string,
  type: "playlist" | "show"
): Promise<SpotifyResult | null> {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=10&market=from_token`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  )
  if (!res.ok) return null
  const data = await res.json()
  const items: SpotifyResult[] = type === "playlist"
    ? (data.playlists?.items ?? []).filter(Boolean).map((p: SpotifyPlaylist) => ({ ...p, type: "playlist" as const }))
    : (data.shows?.items ?? []).filter(Boolean).map((s: SpotifyShow) => ({ ...s, type: "show" as const }))
  return items.find((i) => i.images?.length > 0) ?? null
}

// Keywords that always get a 3x weight boost — ensures running/fitness playlists rank above everything else
const FITNESS_KEYWORDS = ["run", "running", "runner", "workout", "gym", "fitness", "exercise", "training", "cardio", "sport", "correr", "entrena"]

function scorePlaylist(playlist: SpotifyPlaylist, keywords: string[]): number {
  const text = `${playlist.name} ${playlist.description ?? ""}`.toLowerCase()
  const fitnessScore = FITNESS_KEYWORDS.reduce((s, kw) => s + (text.includes(kw) ? 3 : 0), 0)
  const moodScore = keywords.reduce((s, kw) => s + (text.includes(kw.toLowerCase()) ? 1 : 0), 0)
  return fitnessScore + moodScore
}

const MOOD_KEYWORDS: Record<string, string[]> = {
  hyped:      ["hype", "pump", "energy", "beast", "fire", "power", "intense"],
  "locked-in":["focus", "zone", "concentrate", "grind", "locked"],
  floaty:     ["easy", "light", "morning", "smooth", "flow", "chill"],
  heavy:      ["heavy", "power", "strength", "grind", "hard"],
  chill:      ["chill", "relax", "easy", "calm", "recovery"],
  angry:      ["rage", "metal", "anger", "aggressive", "rock"],
}

const LOCATION_KEYWORDS: Record<string, string[]> = {
  street:    ["urban", "city", "hip hop", "street"],
  park:      ["park", "outdoor", "nature"],
  treadmill: ["gym", "treadmill", "indoor"],
  trail:     ["trail", "mountain", "outdoor"],
}

const MOOD_CATALOG_QUERY: Record<string, string> = {
  hyped:      "hype running workout energy pump",
  "locked-in":"focus run concentration workout",
  floaty:     "easy run morning jogging chill",
  heavy:      "power strength grind running workout",
  chill:      "chill easy run recovery jogging",
  angry:      "rage run intense workout rock",
}

async function findContent(
  token: string,
  params: Record<string, string>
): Promise<SpotifyResult | null> {
  const mode = params.mode

  // Mix mode — podcast or coaching goes to show search
  if (mode === "mix") {
    const types = (params.content ?? "music").split(",")
    if (types.includes("coaching")) {
      return searchCatalog(token, "running coach audio guided training", "show")
    }
    if (types.includes("podcasts")) {
      return searchCatalog(token, "running podcast training", "show")
    }
  }

  // Build keywords for user playlist scoring
  const keywords: string[] = []

  if (mode === "cadence") {
    const bpm = parseInt(params.bpm ?? "160")
    keywords.push("run", "running")
    if (bpm >= 180) keywords.push("sprint", "fast", "speed", "interval", "beast")
    else if (bpm >= 165) keywords.push("tempo", "race", "fast", "energy")
    else if (bpm >= 145) keywords.push("running", "workout", "energy", "steady")
    else keywords.push("easy", "jog", "recovery", "light")
  }

  if (mode === "mood" || mode === "mix") {
    keywords.push(...(MOOD_KEYWORDS[params.mood] ?? ["run", "running"]))
    keywords.push(...(LOCATION_KEYWORDS[params.location] ?? []))
  }

  // Try user's own playlists first
  const userPlaylists = await getUserPlaylists(token)
  let best: SpotifyPlaylist | null = null
  let bestScore = 0
  for (const pl of userPlaylists) {
    const score = scorePlaylist(pl, keywords)
    if (score > bestScore) { bestScore = score; best = pl }
  }
  if (best && bestScore > 0) return best

  // Fall back to Spotify catalog
  let catalogQuery = "running"
  if (mode === "cadence") {
    catalogQuery = `running ${params.bpm ?? "160"} bpm workout`
  } else if (mode === "mood") {
    catalogQuery = MOOD_CATALOG_QUERY[params.mood] ?? "running playlist"
  } else if (mode === "mix") {
    catalogQuery = "running workout music playlist"
  }

  return searchCatalog(token, catalogQuery, "playlist")
}

// ── Icons ────────────────────────────────────────────────────────────────────

function BoltIcon() {
  return (
    <svg width="16" height="22" viewBox="0 0 18 26" fill="none">
      <path d="M10.5 0L0 15h7.5L7 26L18 11h-7.5L10.5 0Z" fill="#C8FF00" />
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  if (!session) redirect("/")

  const raw = await searchParams
  const params: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    params[k] = Array.isArray(v) ? v[0] : (v ?? "")
  }

  const token = (session as { accessToken: string }).accessToken
  const result = await findContent(token, params)

  const image = result?.images?.[0]?.url
  const name = result?.name
  const spotifyUrl = result?.external_urls?.spotify
  const meta =
    result?.type === "playlist"
      ? `${(result as SpotifyPlaylist).tracks?.total ?? "?"} tracks · ${(result as SpotifyPlaylist).owner?.display_name ?? "Spotify"}`
      : `Podcast · ${(result as SpotifyShow)?.publisher ?? "Spotify"}`

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
        <BoltIcon />
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
          {/* Cover art */}
          {image && (
            <div className="w-full mb-8" style={{ aspectRatio: "1 / 1", maxWidth: 360, margin: "0 auto 2rem" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={name ?? ""}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }}
              />
            </div>
          )}

          {/* Label */}
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

          {/* Name */}
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

          {/* Meta */}
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

          {/* Open in Spotify */}
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
        <>
          {/* No result state */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p
              className="mb-2"
              style={{
                fontFamily: "var(--font-barlow)",
                fontWeight: 900,
                fontSize: "1.5rem",
                color: "white",
              }}
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
        </>
      )}

      {/* Try again */}
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
