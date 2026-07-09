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

type SpotifyEpisode = {
  id: string
  name: string
  description: string
  images: SpotifyImage[]
  external_urls: { spotify: string }
  duration_ms: number
  type: "episode"
}

type SpotifyResult = SpotifyPlaylist | SpotifyShow | SpotifyEpisode

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
      if (OTHER_SPORT.test(p.name ?? "")) continue // wrong sport → never surface
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

// Playlists built for a *different* sport or workout modality. Unlike the
// running-context words below (a soft preference), this is a HARD exclusion:
// a pilates or indoor-cycling playlist is never surfaced even at the exact BPM.
// General fitness words like "training" or "workout" are intentionally absent.
const OTHER_SPORT = /\b(pilates|yoga|barre|spinning|spin|cycling|ciclismo|rowing|boxing|boxeo|kickboxing|crossfit|swimming|swim|natacion|zumba|elliptical)\b/i

// Playlist names with these words signal a non-running context.
// Word boundaries ensure "work" blocks "Work Vibes" but not "Workout Mix",
// and "bar" blocks "Bar Lounge" but not "Barcelona".
const NON_RUNNING_CONTEXT = /\b(desayuno|almuerzo|cena|breakfast|lunch|dinner|brunch|study|homework|work|office|bar|lounge|sleep\w*|nap|bedtime|porngore|gore|aggressive|wwe)\b/i

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
  heavy:       "grind mode build determination weighted steady relentless resilience",
  chill:       "slow recovery soft acoustic lounge unwind mellow calm gentle low-key rest",
  angry:       "explosive adrenaline intense furious raw unleashed fierce",
}

// Estimate run duration from goal params.
// For distance goals we assume an easy 6 min/km pace.
function goalToDurationMinutes(goalType: string, goalValue: number): number {
  if (!goalValue) return 0
  if (goalType === "time") return goalValue
  if (goalType === "distance") return Math.round(goalValue * 6)
  return 0
}

// Pull a distance (in km) out of an episode title so we can match it against
// the user's distance goal. Handles "5K", "10 km", "half marathon" (21K) and
// "marathon" (42K). Returns null when the title carries no distance.
function extractDistanceKm(name: string): number | null {
  const n = name.toLowerCase()
  if (/\bhalf[-\s]?marathon\b/.test(n)) return 21
  if (/\bmarathon\b/.test(n)) return 42
  const m = n.match(/\b(\d{1,3})\s*(?:k|km)\b/)
  return m ? parseInt(m[1]) : null
}

// A guided-run episode must clearly signal running AND must not be a meditation,
// sleep, or relaxation session — "guided" alone pulls in guided meditations
// ("Visualización Guiada | Paseo por la Playa"), which are not what we want.
const RUN_SIGNAL = /\b(run|running|runner|jog|jogging|sprint|treadmill|5k|10k|marathon|intervals?|fartlek|tempo|correr|carrera|trote)\b|guided run/i
const NOT_A_RUN = /\b(meditaci[oó]n|meditation|visualizaci[oó]n|visualization|sleep|dormir|relaxation|relajaci[oó]n|calm|mindfulness|breathing|respiraci[oó]n|yoga|nap|anxiety|ansiedad|manifest|hypnosis|hipnosis|asmr)\b/i

function isGuidedRunEpisode(e: SpotifyEpisode): boolean {
  const text = `${e.name} ${e.description ?? ""}`
  return RUN_SIGNAL.test(text) && !NOT_A_RUN.test(text)
}

// Search Spotify episodes (guided runs). Pages the results like searchCatalog
// and dedupes by id, but keeps every episode — the caller ranks them by how
// well they fit the user's goal.
async function searchEpisodes(
  token: string,
  query: string,
  limit = SEARCH_LIMIT
): Promise<SpotifyEpisode[]> {
  const pages = await Promise.all(
    Array.from({ length: SEARCH_PAGES }, (_, i) =>
      fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=episode&limit=${limit}&offset=${i * limit}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  )

  const raw = pages.flatMap((data) => data?.episodes?.items ?? [])
  const seen = new Set<string>()
  return raw
    .filter(Boolean)
    .filter((e: SpotifyEpisode) => {
      if (seen.has(e.id)) return false
      seen.add(e.id)
      return true
    })
    .map((e: SpotifyEpisode) => ({ ...e, type: "episode" as const }))
}

// Coaching mode: return a single guided-run EPISODE matched to the user's goal.
// For a distance goal we match the literal distance in the episode title
// (e.g. a "5K" goal finds a "5K Guided Run" episode). For a time goal — or when
// no title names the exact distance — we fall back to the episode whose actual
// audio length is closest to the target duration, so the user always gets a
// guided run rather than a "no match".
async function findCoachingEpisode(
  token: string,
  goalType: string,
  goalValue: number,
  durationMinutes: number,
  pickIndex: number
): Promise<SpotifyResult | null> {
  const queries = [
    "guided run coach",
    "guided running workout intervals",
    "coach audio guided run",
    "running guided run walk run",
  ]

  const seen = new Set<string>()
  const all: SpotifyEpisode[] = []
  for (const q of queries) {
    for (const e of await searchEpisodes(token, q)) {
      if (seen.has(e.id)) continue
      seen.add(e.id)
      if (isGuidedRunEpisode(e)) all.push(e)
    }
  }
  if (all.length === 0) return null

  // Distance goal → match the literal distance in the title (option B).
  if (goalType === "distance" && goalValue > 0) {
    const target = Math.round(goalValue)
    const matches = all.filter((e) => extractDistanceKm(e.name) === target)
    if (matches.length > 0) return matches[pickIndex % matches.length]
    // No title names this exact distance — fall through to duration matching.
  }

  // Time goal (or distance fallback) → closest actual audio length.
  if (durationMinutes > 0) {
    const sorted = [...all].sort(
      (a, b) =>
        Math.abs(a.duration_ms / 60000 - durationMinutes) -
        Math.abs(b.duration_ms / 60000 - durationMinutes)
    )
    return sorted[0]
  }

  return all[pickIndex % all.length]
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

  // Rotate across the paged pool so a refresh can surface a different pick.
  const rotateIdx = Math.floor(Date.now() / 1000) % (SEARCH_LIMIT * SEARCH_PAGES)

  // ── Shows (podcast / coaching) ───────────────────────────────────────────
  if (mode === "mix") {
    const types = (params.content ?? "music").split(",")
    if (types.includes("coaching")) {
      const episode = await findCoachingEpisode(
        token,
        params.goalType ?? "",
        parseFloat(params.goalValue ?? "0"),
        durationMinutes,
        rotateIdx
      )
      if (episode) return episode
      // No guided-run episode matched — fall back to a show, then a playlist.
      return (
        (await searchCatalog(token, "running coach audio guided training", "show", 0, durationMinutes)) ??
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

  // `rotateIdx` (above) also drives the pool rotation here — one refresh clock
  // shared across modes. `searchCatalog` wraps it to the real pool size.
  const pickIdx = rotateIdx

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
