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

// A guided-run episode must clearly signal a running WORKOUT in its TITLE — not
// just its description. Requiring the signal in the description too loosely
// accepts chatty episodes from running podcasts (e.g. "I Wrote a Book!") whose
// notes happen to mention running; a real guided run always names the session
// in the title ("45 min Easy Run", "5K Guided Run", "Zone 2 Workout"). It must
// also not be a meditation/sleep/relaxation session — "guided" alone pulls in
// guided meditations ("Visualización Guiada | Paseo por la Playa").
const RUN_SIGNAL = /\b(run|running|runner|jog|jogging|sprint|treadmill|5k|10k|marathon|intervals?|fartlek|tempo|workout|correr|carrera|trote)\b|guided run|zone\s?2/i
const NOT_A_RUN = /\b(meditaci[oó]n|meditation|visualizaci[oó]n|visualization|sleep|dormir|relaxation|relajaci[oó]n|calm|mindfulness|breathing|respiraci[oó]n|yoga|nap|anxiety|ansiedad|manifest|hypnosis|hipnosis|asmr)\b/i

// Some guided-run shows also publish walking sessions (incl. run/walk intervals).
// The user wants these out of coaching results, so a "walk" in the TITLE excludes
// the episode (title only — a run's notes may mention "walk breaks").
const WALK_SESSION = /\b(walk|walking|caminata|caminar|caminando)\b/i

function isGuidedRunEpisode(e: SpotifyEpisode): boolean {
  const name = e.name ?? ""
  const text = `${name} ${e.description ?? ""}`
  return RUN_SIGNAL.test(name) && !NOT_A_RUN.test(text) && !WALK_SESSION.test(name)
}

// Curated "battery" of Spotify show ids that publish real guided-run sessions.
// Coaching mode pulls episodes ONLY from these, so broad-search noise (chatty
// episodes, guided meditations) can't slip in. Add or remove show ids here to
// tune the pool.
const GUIDED_RUN_SHOWS = [
  "6WPEqzWlPxkVpYCcsMRHB1",
  "64KAxOWJvintTQTrT44BCe",
  "4FPHb30CddB1S5X9Cndqlw",
  "5pX7zIsx9JzzIWYd0WH9Jo",
  "6qeE3SshwqWKjqnHK1KY2g",
  "5kGSzUCiDA4uoXqupogt7T",
]

// Fetch a show's episodes (newest first). Spotify caps this endpoint at 50/page;
// one page is plenty of guided runs to match a goal against.
async function fetchShowEpisodes(
  token: string,
  showId: string,
  limit = 50
): Promise<SpotifyEpisode[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/shows/${showId}/episodes?limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.items ?? [])
    .filter(Boolean)
    .map((e: SpotifyEpisode) => ({ ...e, type: "episode" as const }))
}

// Fetch a single show by id (for the curated podcast battery — returns the whole
// show, so Spotify starts its latest episode on play).
async function fetchShow(token: string, showId: string): Promise<SpotifyShow | null> {
  const res = await fetch(`https://api.spotify.com/v1/shows/${showId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) return null
  const s = await res.json()
  return { ...s, type: "show" as const }
}

// Gather every guided-run episode from the curated battery, deduped and filtered
// so the occasional talk/intro episode inside a running show is skipped.
async function fetchBatteryEpisodes(token: string): Promise<SpotifyEpisode[]> {
  const lists = await Promise.all(
    GUIDED_RUN_SHOWS.map((id) => fetchShowEpisodes(token, id))
  )

  const seen = new Set<string>()
  const out: SpotifyEpisode[] = []
  for (const e of lists.flat()) {
    if (seen.has(e.id)) continue
    seen.add(e.id)
    if (isGuidedRunEpisode(e)) out.push(e)
  }
  return out
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

// Pick the episode from a pool that best fits the user's goal.
// Distance goal → match the literal distance in the title (option B), e.g. a
// "5K" goal finds a "5K Guided Run". Time goal — or a distance with no literal
// title match — → the episode whose actual audio length is closest, so the user
// always gets a guided run rather than a "no match".
function pickEpisodeForGoal(
  pool: SpotifyEpisode[],
  goalType: string,
  goalValue: number,
  durationMinutes: number,
  pickIndex: number
): SpotifyEpisode | null {
  if (pool.length === 0) return null

  if (goalType === "distance" && goalValue > 0) {
    const target = Math.round(goalValue)
    const matches = pool.filter((e) => extractDistanceKm(e.name) === target)
    if (matches.length > 0) return matches[pickIndex % matches.length]
    // No title names this exact distance — fall through to duration matching.
  }

  if (durationMinutes > 0) {
    return [...pool].sort(
      (a, b) =>
        Math.abs(a.duration_ms / 60000 - durationMinutes) -
        Math.abs(b.duration_ms / 60000 - durationMinutes)
    )[0]
  }

  return pool[pickIndex % pool.length]
}

// Coaching mode: return a single guided-run EPISODE matched to the user's goal.
// Prefer the curated battery of guided-run shows; only if that yields nothing
// (shows unavailable, or no goal fit) fall back to a broad episode search.
async function findCoachingEpisode(
  token: string,
  goalType: string,
  goalValue: number,
  durationMinutes: number,
  pickIndex: number
): Promise<SpotifyResult | null> {
  // 1. Curated battery — high precision.
  const battery = await fetchBatteryEpisodes(token)
  const fromBattery = pickEpisodeForGoal(battery, goalType, goalValue, durationMinutes, pickIndex)
  if (fromBattery) return fromBattery

  // 2. Broad episode search — only reached if the battery came back empty.
  const queries = [
    "guided run coach",
    "guided running workout intervals",
    "coach audio guided run",
    "running guided run",
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
  return pickEpisodeForGoal(all, goalType, goalValue, durationMinutes, pickIndex)
}

// Curated podcast shows per topic (Spotify show ids). Podcast mode picks one —
// rotating for variety — and returns the whole show, so Spotify starts its
// latest episode on play. Fill each list with hand-picked show ids.
const PODCAST_BATTERY: Record<string, string[]> = {
  "true-crime": [
    "1VsDIDtqSPU79fZGHu4sdI",
    "2L0L4rggG3E9s9DHhSUzly",
    "5P1sJYtNfyUpIniOVVTS3u",
    "6wF969GfLUfypoKaicH5gr",
    "6MjgJqm88DAtaay8euRUpP",
  ],
  "news":       [
    "6UChlBVtUwxsodxJBiepUz",
    "6Y7m1gQ2Uby15Hy3ow2jRu",
    "7GIjPB112ZItDWPcDSG5Ze",
    "5X2O35fLXaXrNZUtP48LI9",
    "4zJjzOg3ZMMxjLZqAmIh1F",
  ],
  "comedy":     [
    "3zCs8D2qcTAMAbYV1eM1ad",
    "3RCsriiuV8oJzkTF0hynmZ",
    "4LcHROhr5Tpjr6y0lsAZJV",
    "6lVP9WW2F2fdaw3Md7EgHt",
    "3FEVpa8S2DfIRxgaSx3j5G",
  ],
  "health":     [
    "5KNb5u8CXjthXMTDcoBVdV",
    "2dZB87fvRqJ4B7dCN6ZESk",
    "3venIYsCE3fWo3jCM1Klan",
    "2RaBwb8FEabMJVR2QxO7FA",
    "6lG1SeAF4F4McUiJm6BRyq",
  ],
  "growth":     [
    "3GcV1VW7InfQrr7ele4wmi",
    "4zeEGCXH4Au4WdokuRvJHf",
    "0NMAX9EvgJZgPeEN1288UI",
    "76yWrwFQ7H7JaFNv4UK35a",
  ],
  "mental-health": [
    "0KUjSzqMyxrTyXuw15j4e8",
    "12FUVepQBgaBf7mhrLhmk5",
    "0sGGLIDnnijRPLef7InllD",
    "6xKpLdvm45jVLp7gD9O3DY",
  ],
}

// Pick a curated show for the topic, rotating across the list and skipping any
// id that fails to fetch. Returns null when the topic has no curated shows yet.
async function findTopicPodcast(
  token: string,
  topic: string,
  pickIndex: number
): Promise<SpotifyResult | null> {
  const ids = PODCAST_BATTERY[topic] ?? []
  for (let i = 0; i < ids.length; i++) {
    const show = await fetchShow(token, ids[(pickIndex + i) % ids.length])
    if (show) return show
  }
  return null
}

// What the result screen needs: the item to DISPLAY, the exact uri to start
// playback with, and — for mix combos — a playlist whose tracks are queued after
// so the runner can skip from the podcast/coaching straight into music.
type ContentResult = {
  display: SpotifyResult
  playUri: string
  queuePlaylistId?: string
}

function uriOf(r: { type: string; id: string }): string {
  return `spotify:${r.type}:${r.id}`
}

function single(r: SpotifyResult | null): ContentResult | null {
  return r ? { display: r, playUri: uriOf(r) } : null
}

// The "running workout music" playlist queued after a podcast/coaching pick in a
// mix combo. Reused query so music always fits the run.
async function findMixMusicPlaylist(
  token: string,
  durationMinutes: number,
  pickIndex: number
): Promise<SpotifyPlaylist | null> {
  const p = await searchCatalog(token, "running workout music playlist", "playlist", pickIndex, durationMinutes)
  return p && p.type === "playlist" ? p : null
}

// Latest episode of a show as a play uri — a show uri can't sit inside a `uris`
// play list, so podcasts+music chains the latest episode instead of the show.
async function latestEpisodeUri(token: string, showId: string): Promise<string | null> {
  const eps = await fetchShowEpisodes(token, showId, 1)
  return eps[0] ? uriOf(eps[0]) : null
}

async function findContent(
  token: string,
  params: Record<string, string>
): Promise<ContentResult | null> {
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
    // A mix always pairs one spoken-word pick (podcast/coaching) with music; the
    // podcast plays first and the music playlist is queued right after it.
    const wantsMusic = types.includes("music")

    if (types.includes("coaching")) {
      const episode = await findCoachingEpisode(
        token,
        params.goalType ?? "",
        parseFloat(params.goalValue ?? "0"),
        durationMinutes,
        rotateIdx
      )
      if (episode) {
        if (wantsMusic) {
          const music = await findMixMusicPlaylist(token, durationMinutes, rotateIdx)
          if (music) return { display: episode, playUri: uriOf(episode), queuePlaylistId: music.id }
        }
        return single(episode)
      }
      // No guided-run episode matched — fall back to a show, then a playlist.
      return single(
        (await searchCatalog(token, "running coach audio guided training", "show", 0, durationMinutes)) ??
        (await searchCatalog(token, "running workout music", "playlist", 0, durationMinutes))
      )
    }

    if (types.includes("podcasts")) {
      const topic = params.podcastTopic ?? "true-crime"

      // 1. Curated battery — high precision.
      const curated = await findTopicPodcast(token, topic, rotateIdx)
      if (curated) {
        if (wantsMusic) {
          const [music, epUri] = await Promise.all([
            findMixMusicPlaylist(token, durationMinutes, rotateIdx),
            latestEpisodeUri(token, curated.id),
          ])
          // Chain the show's latest episode → music. If either lookup fails,
          // just play the show on its own.
          if (music && epUri) return { display: curated, playUri: epUri, queuePlaylistId: music.id }
        }
        return single(curated)
      }

      // 2. Broad show search — only reached if the topic has no curated shows.
      const topicQuery: Record<string, string> = {
        "true-crime": "true crime mystery podcast",
        "news":       "daily news current events podcast",
        "comedy":     "comedy humor funny podcast",
        "health":     "health nutrition wellness fitness podcast",
        "growth":     "self improvement personal development mindset podcast",
        "mental-health": "mental health wellbeing mindfulness therapy podcast",
      }
      const specificPodcast = topicQuery[topic] ?? "podcast running"
      return single(
        (await searchCatalog(token, specificPodcast, "show", rotateIdx, durationMinutes)) ??
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
      if (cadence) return single(cadence)
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
  if (specific) return single(specific)

  // Phase 2: generic running catalog (broad fallback)
  const generic = await searchCatalog(token, "running workout", "playlist", 0, durationMinutes)
  if (generic) return single(generic)

  // Phase 3: broad fallback
  return single(await searchCatalog(token, "workout", "playlist", 0, durationMinutes))
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

  const [content] = await Promise.all([
    findContent(token, params),
    new Promise<void>((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
  ])

  return (
    <ResultReveal
      result={content?.display ?? null}
      playUri={content?.playUri ?? null}
      queuePlaylistId={content?.queuePlaylistId ?? null}
      sharing={(params.sharing ?? "solo") as "solo" | "crew"}
    />
  )
}
