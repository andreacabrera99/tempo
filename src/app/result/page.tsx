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

// Spotify's playlist search now rejects `limit` above ~10 with HTTP 400
// (it used to allow up to 50). Keep every search request at or below this or
// the call fails and the whole mode silently returns "no match".
const SEARCH_LIMIT = 10

// Page through the search with `offset` to build a bigger pool than a single
// 10-item page allows — more variety when rotating and fewer drops to the
// generic fallbacks after the running/duration filters trim the pool.
const SEARCH_PAGES = 3

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
  limit = SEARCH_LIMIT
): Promise<SpotifyResult | null> {
  // Fetch every page in parallel; a failed page (e.g. offset past the end)
  // contributes nothing rather than sinking the whole search.
  const pages = await Promise.all(
    Array.from({ length: SEARCH_PAGES }, (_, i) =>
      fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}&offset=${i * limit}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  )

  const rawItems = pages.flatMap((data) =>
    type === "playlist" ? (data?.playlists?.items ?? []) : (data?.shows?.items ?? [])
  )

  // Dedupe by id — offset paging can overlap when the catalog shifts between requests.
  const seen = new Set<string>()
  const deduped = rawItems.filter(Boolean).filter((it: SpotifyResult) => {
    if (seen.has(it.id)) return false
    seen.add(it.id)
    return true
  })

  const items: SpotifyResult[] = type === "playlist"
    ? deduped
        .filter((p: SpotifyPlaylist) => isRunningPlaylist(p.name ?? ""))
        .map((p: SpotifyPlaylist) => ({ ...p, type: "playlist" as const }))
    : deduped.map((s: SpotifyShow) => ({ ...s, type: "show" as const }))
  let pool = items

  // Prefer playlists with enough tracks to cover the run duration (~4 min/track).
  if (durationMinutes > 0 && type === "playlist") {
    const minTracks = Math.ceil(durationMinutes / 4)
    const fitted = pool.filter((i) => ((i as SpotifyPlaylist).tracks?.total ?? 0) >= minTracks)
    if (fitted.length > 0) pool = fitted
  }

  return pool[pickIndex % pool.length] ?? null
}

// Raw playlist search: returns the mapped playlist items with no filtering, so
// callers can apply their own priority rules.
async function rawSearchPlaylists(
  token: string,
  query: string,
  limit = SEARCH_LIMIT
): Promise<SpotifyPlaylist[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.playlists?.items ?? [])
    .filter(Boolean)
    .map((p: SpotifyPlaylist) => ({ ...p, type: "playlist" as const }))
}

// Cadence mode: return a playlist whose title contains the EXACT target BPM
// (e.g. "Running 140 BPM", "120 spm", "Workout - 120 BPM"), case-insensitive.
// The exact number is a hard requirement — a different, higher or lower number
// is never returned. Several queries are tried so a match is found for any
// cadence 100–200; everything else (running context, artwork, duration fit) is
// only a soft preference that is skipped whenever it would empty the pool.
async function findCadencePlaylist(
  token: string,
  targetBpm: number,
  durationMinutes: number,
  pickIndex: number
): Promise<SpotifyResult | null> {
  const queries = [
    `running ${targetBpm} bpm`,
    `${targetBpm} bpm`,
    `${targetBpm} spm`,
    `workout ${targetBpm} bpm`,
    `${targetBpm} bpm running playlist`,
  ]

  const seen = new Set<string>()
  const matches: SpotifyPlaylist[] = []
  for (const q of queries) {
    const items = await rawSearchPlaylists(token, q)
    for (const p of items) {
      if (seen.has(p.id)) continue
      if (extractBpm(p.name ?? "") === targetBpm) {
        seen.add(p.id)
        matches.push(p)
      }
    }
    if (matches.length >= 8) break // enough variety, stop querying
  }

  if (matches.length === 0) return null

  // Soft preferences, each applied only when it leaves at least one match, so a
  // valid exact-BPM playlist is never discarded: running context → artwork →
  // long enough for the run.
  let pool = matches
  const running = pool.filter((p) => isRunningPlaylist(p.name ?? ""))
  if (running.length > 0) pool = running
  const withImage = pool.filter((p) => p.images?.length > 0)
  if (withImage.length > 0) pool = withImage
  if (durationMinutes > 0) {
    const minTracks = Math.ceil(durationMinutes / 4)
    const fitted = pool.filter((p) => (p.tracks?.total ?? 0) >= minTracks)
    if (fitted.length > 0) pool = fitted
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

  // Rotate across the whole paged pool (not just the first 5) so a refresh can
  // surface later results too. `searchCatalog` wraps this to the real pool size.
  const pickIdx = Math.floor(Date.now() / 1000) % (SEARCH_LIMIT * SEARCH_PAGES)

  // ── Cadence: match the exact BPM the user picked (100–200) ────────────────
  if (mode === "cadence") {
    const targetBpm = parseInt(params.bpm ?? "0")
    if (targetBpm > 0) {
      const cadence = await findCadencePlaylist(token, targetBpm, durationMinutes, pickIdx)
      if (cadence) return cadence
    }
    // No playlist in Spotify's catalog names this exact cadence — no
    // off-cadence fallback, so the caller shows a "no results" state.
    return null
  }

  // ── Build catalog query (genre-specific so results differ by mood) ────────
  let specificQuery = "running workout playlist"
  if (mode === "mood") {
    specificQuery = MOOD_CATALOG_QUERY[params.mood] ?? "running workout playlist"
  } else if (mode === "mix") {
    specificQuery = "running workout music playlist"
  }

  // Phase 1: specific query
  const specific = await searchCatalog(token, specificQuery, "playlist", pickIdx, durationMinutes)
  if (specific) return specific

  // Phase 2: generic running catalog (broad fallback)
  const generic = await searchCatalog(token, "running workout", "playlist", 0, durationMinutes)
  if (generic) return generic

  // Phase 3: broad fallback
  return searchCatalog(token, "workout", "playlist", 0, durationMinutes)
}

// ── Page ─────────────────────────────────────────────────────────────────────

const MIN_LOADING_MS = 800

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
