import { auth } from "@/auth"
import { redirect } from "next/navigation"
import ResultReveal from "./result-reveal"

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
  type: "playlist" | "show",
  pickIndex = 0
): Promise<SpotifyResult | null> {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=20`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  )
  if (!res.ok) return null
  const data = await res.json()
  const items: SpotifyResult[] = type === "playlist"
    ? (data.playlists?.items ?? []).filter(Boolean).map((p: SpotifyPlaylist) => ({ ...p, type: "playlist" as const }))
    : (data.shows?.items ?? []).filter(Boolean).map((s: SpotifyShow) => ({ ...s, type: "show" as const }))
  const withImage = items.filter((i) => i.images?.length > 0)
  const pool = withImage.length > 0 ? withImage : items
  // pickIndex lets callers select a result other than #1 for variety
  return pool[pickIndex % pool.length] ?? null
}

// Keywords that always get a 3x weight boost
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

// Genre-specific queries so Spotify returns genuinely different playlists per mood
const MOOD_CATALOG_QUERY: Record<string, string> = {
  hyped:      "rap trap hype workout pump",
  "locked-in":"lo-fi focus deep concentration study",
  floaty:     "indie ambient morning easy chill",
  heavy:      "metal heavy gym power lifting",
  chill:      "jazz lounge easy recovery soft",
  angry:      "hardcore metal rage aggressive punk",
}

async function findContent(
  token: string,
  params: Record<string, string>
): Promise<SpotifyResult | null> {
  const mode = params.mode

  // ── Shows (podcast / coaching) ───────────────────────────────────────────
  if (mode === "mix") {
    const types = (params.content ?? "music").split(",")
    if (types.includes("coaching")) {
      return (
        (await searchCatalog(token, "running coach audio guided training", "show")) ??
        (await searchCatalog(token, "running coach podcast", "show")) ??
        (await searchCatalog(token, "running workout music", "playlist"))
      )
    }
    if (types.includes("podcasts")) {
      return (
        (await searchCatalog(token, "running podcast training", "show")) ??
        (await searchCatalog(token, "running podcast", "show")) ??
        (await searchCatalog(token, "running workout music", "playlist"))
      )
    }
  }

  // ── Build context keyword list (mood/BPM/location) ──────────────────────
  const contextKeywords: string[] = []

  if (mode === "cadence") {
    const bpm = parseInt(params.bpm ?? "160")
    if (bpm >= 180) contextKeywords.push("sprint", "fast", "speed", "interval", "beast")
    else if (bpm >= 165) contextKeywords.push("tempo", "race", "fast", "energy")
    else if (bpm >= 145) contextKeywords.push("workout", "energy", "steady", "power")
    else contextKeywords.push("easy", "jog", "recovery", "light", "morning")
  }

  if (mode === "mood" || mode === "mix") {
    contextKeywords.push(...(MOOD_KEYWORDS[params.mood] ?? []))
    contextKeywords.push(...(LOCATION_KEYWORDS[params.location] ?? []))
  }

  // ── Build catalog query (genre-specific so results differ by mood/BPM) ────
  let specificQuery = "running workout playlist"
  if (mode === "cadence") {
    const bpm = parseInt(params.bpm ?? "160")
    if (bpm >= 180)      specificQuery = "sprint interval hiit electronic"
    else if (bpm >= 165) specificQuery = "tempo run edm energetic"
    else if (bpm >= 145) specificQuery = "steady run pop upbeat"
    else                 specificQuery = "easy jog acoustic mellow"
  } else if (mode === "mood") {
    specificQuery = MOOD_CATALOG_QUERY[params.mood] ?? "running workout playlist"
  } else if (mode === "mix") {
    specificQuery = "running workout music playlist"
  }

  const userPlaylists = await getUserPlaylists(token)

  // ── Phase 1: user playlist that matches BOTH fitness AND context ──────────
  // A playlist must contain fitness keywords AND context keywords to win here.
  // This prevents a generic "Running Mix" from always beating mood-specific results.
  let contextBest: SpotifyPlaylist | null = null
  let contextBestScore = 0
  for (const pl of userPlaylists) {
    const text = `${pl.name} ${pl.description ?? ""}`.toLowerCase()
    const fitnessScore = FITNESS_KEYWORDS.reduce((s, kw) => s + (text.includes(kw) ? 1 : 0), 0)
    const ctxScore = contextKeywords.reduce((s, kw) => s + (text.includes(kw.toLowerCase()) ? 1 : 0), 0)
    if (fitnessScore > 0 && ctxScore > 0) {
      const total = fitnessScore + ctxScore * 2 // context weighted higher
      if (total > contextBestScore) { contextBestScore = total; contextBest = pl }
    }
  }
  if (contextBest) return contextBest

  // ── Phase 2: mood/context-specific catalog search ─────────────────────────
  // Use seconds%5 as pick index (0-4) so the same query returns varied results
  const pickIdx = Math.floor(Date.now() / 1000) % 5
  const specific = await searchCatalog(token, specificQuery, "playlist", pickIdx)
  if (specific) return specific

  // ── Phase 3: any fitness match from user library ──────────────────────────
  let fitBest: SpotifyPlaylist | null = null
  let fitBestScore = 0
  for (const pl of userPlaylists) {
    const text = `${pl.name} ${pl.description ?? ""}`.toLowerCase()
    const score = FITNESS_KEYWORDS.reduce((s, kw) => s + (text.includes(kw) ? 1 : 0), 0)
    if (score > fitBestScore) { fitBestScore = score; fitBest = pl }
  }
  if (fitBest && fitBestScore > 0) return fitBest

  // ── Phase 4: generic running catalog ─────────────────────────────────────
  const generic = await searchCatalog(token, "running workout", "playlist")
  if (generic) return generic

  // ── Phase 5: any user playlist ───────────────────────────────────────────
  if (userPlaylists[0]) return userPlaylists[0]

  return searchCatalog(token, "workout", "playlist")
}

// ── Page ─────────────────────────────────────────────────────────────────────

const MIN_LOADING_MS = 2500

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

  // Run fetch + minimum delay in parallel so the loading screen always shows for at least 2.5s
  const [result] = await Promise.all([
    findContent(token, params),
    new Promise<void>((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
  ])

  return <ResultReveal result={result} />
}
