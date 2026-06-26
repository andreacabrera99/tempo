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

  if (mode === "mix") {
    const types = (params.content ?? "music").split(",")
    if (types.includes("coaching")) {
      return searchCatalog(token, "running coach audio guided training", "show")
    }
    if (types.includes("podcasts")) {
      return searchCatalog(token, "running podcast training", "show")
    }
  }

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

  const userPlaylists = await getUserPlaylists(token)
  let best: SpotifyPlaylist | null = null
  let bestScore = 0
  for (const pl of userPlaylists) {
    const score = scorePlaylist(pl, keywords)
    if (score > bestScore) { bestScore = score; best = pl }
  }
  if (best && bestScore > 0) return best

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
