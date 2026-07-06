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

function extractBpm(name: string): number | null {
  const m = name.match(/\b(\d{2,3})\s*(?:bpm|spm)\b/i)
  return m ? parseInt(m[1]) : null
}

async function searchCatalog(
  token: string,
  query: string,
  type: "playlist" | "show",
  pickIndex = 0,
  durationMinutes = 0,
  targetBpm = 0
): Promise<SpotifyResult | null> {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=5`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  )
  if (!res.ok) return null
  const data = await res.json()
  const items: SpotifyResult[] = type === "playlist"
    ? (data.playlists?.items ?? []).filter(Boolean)
        .filter((p: SpotifyPlaylist) => isRunningPlaylist(p.name ?? ""))
        .map((p: SpotifyPlaylist) => ({ ...p, type: "playlist" as const }))
    : (data.shows?.items ?? []).filter(Boolean).map((s: SpotifyShow) => ({ ...s, type: "show" as const }))
  const withImage = items.filter((i) => i.images?.length > 0)
  let pool = withImage.length > 0 ? withImage : items

  // Prefer playlists with enough tracks to cover the run duration (~4 min/track).
  if (durationMinutes > 0 && type === "playlist") {
    const minTracks = Math.ceil(durationMinutes / 4)
    const fitted = pool.filter((i) => ((i as SpotifyPlaylist).tracks?.total ?? 0) >= minTracks)
    if (fitted.length > 0) pool = fitted
  }

  // For cadence mode, keep only playlists whose name matches the target BPM ±10.
  if (targetBpm > 0 && type === "playlist") {
    const bpmMatch = pool.filter((i) => {
      const n = extractBpm((i as SpotifyPlaylist).name ?? "")
      return n !== null && Math.abs(n - targetBpm) <= 10
    })
    if (bpmMatch.length > 0) pool = bpmMatch
  }

  return pool[pickIndex % pool.length] ?? null
}

// Playlist names with these words signal a non-running context.
// Word boundaries ensure "work" blocks "Work Vibes" but not "Workout Mix",
// and "bar" blocks "Bar Lounge" but not "Barcelona".
const NON_RUNNING_CONTEXT = /\b(desayuno|almuerzo|cena|breakfast|lunch|dinner|brunch|study|homework|work|office|bar|lounge|sleep|bedtime|porngore|gore|aggressive)\b/i

// Playlist names that are primarily a genre label (not running-specific).
// Handled separately from context words for clarity.
// hip-hop, k-pop and lo-fi are outside the \b group because hyphens break word boundaries.
const GENRE_LABEL = /\b(rap|trap|indie|metal|jazz|blues|soul|reggae|reggaeton|dubstep|edm|kpop|punk|hardcore|lofi|classical|country|folk|rnb|bachata|salsa|cumbia|gospel)\b|hip[- ]hop|k-pop|lo-fi/i

function isRunningPlaylist(name: string): boolean {
  return !NON_RUNNING_CONTEXT.test(name) && !GENRE_LABEL.test(name)
}

const MOOD_CATALOG_QUERY: Record<string, string> = {
  hyped:       "hype workout running high energy motivation pump adrenaline upbeat energetic power",
  "locked-in": "flow state zone instrumental electronic no lyrics training steady rhythmic",
  floaty:      "dreamy ambient light airy morning easy chill run weightless breezy soft glide effortless",
  heavy:       "grind mode dark bass slow build determination weighted steady relentless resilience",
  chill:       "slow recovery soft acoustic lounge unwind mellow calm gentle low-key rest",
  angry:       "rage run explosive adrenaline intense furious raw unleashed fierce",
}

// Estimate run duration from goal params.
// For distance goals we assume an easy 6 min/km pace.
function goalToDurationMinutes(goalType: string, goalValue: number): number {
  if (!goalValue) return 0
  if (goalType === "time") return goalValue
  if (goalType === "distance") return Math.round(goalValue * 6)
  return 0
}

async function findContent(
  token: string,
  params: Record<string, string>
): Promise<SpotifyResult | null> {
  const mode = params.mode
  const durationMinutes = goalToDurationMinutes(
    params.goalType ?? "",
    parseFloat(params.goalValue ?? "0")
  )

  // ── Shows (podcast / coaching) ───────────────────────────────────────────
  if (mode === "mix") {
    const types = (params.content ?? "music").split(",")
    if (types.includes("coaching")) {
      return (
        (await searchCatalog(token, "running coach audio guided training", "show", 0, durationMinutes)) ??
        (await searchCatalog(token, "running coach podcast", "show", 0, durationMinutes)) ??
        (await searchCatalog(token, "running workout music", "playlist", 0, durationMinutes))
      )
    }
    if (types.includes("podcasts")) {
      const topicQuery: Record<string, string> = {
        "true-crime": "true crime mystery podcast",
        "news":       "daily news current events podcast",
        "comedy":     "comedy humor funny podcast",
        "health":     "health nutrition wellness fitness podcast",
        "growth":     "self improvement personal development mindset podcast",
      }
      const topic = params.podcastTopic ?? "true-crime"
      const specificPodcast = topicQuery[topic] ?? "podcast running"
      return (
        (await searchCatalog(token, specificPodcast, "show", 0, durationMinutes)) ??
        (await searchCatalog(token, "podcast running", "show", 0, durationMinutes)) ??
        (await searchCatalog(token, "running workout music", "playlist", 0, durationMinutes))
      )
    }
  }

  // ── Build catalog query (genre-specific so results differ by mood/BPM) ────
  let specificQuery = "running workout playlist"
  if (mode === "cadence") {
    const bpm = parseInt(params.bpm ?? "160")
    specificQuery = `${bpm} BPM OR ${bpm} SPM`
  } else if (mode === "mood") {
    specificQuery = MOOD_CATALOG_QUERY[params.mood] ?? "running workout playlist"
  } else if (mode === "mix") {
    specificQuery = "running workout music playlist"
  }

  const pickIdx = Math.floor(Date.now() / 1000) % 5
  const targetBpm = mode === "cadence" ? parseInt(params.bpm ?? "0") : 0

  // Phase 1: specific query (exact BPM match enforced for cadence mode)
  const specific = await searchCatalog(token, specificQuery, "playlist", pickIdx, durationMinutes, targetBpm)
  if (specific) return specific

  // Phase 2: generic running catalog (no BPM constraint — broad fallback)
  const generic = await searchCatalog(token, "running workout", "playlist", 0, durationMinutes)
  if (generic) return generic

  // Phase 3: broad fallback
  return searchCatalog(token, "workout", "playlist", 0, durationMinutes)
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

  const [result] = await Promise.all([
    findContent(token, params),
    new Promise<void>((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
  ])

  return <ResultReveal result={result} sharing={(params.sharing ?? "solo") as "solo" | "crew"} />
}
