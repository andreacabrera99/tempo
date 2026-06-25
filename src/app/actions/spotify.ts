"use server"

type MoodConfig = {
  energy: number
  valence: number
  tempo: number
  genres: string[]
}

const MOOD_MAP: Record<string, MoodConfig> = {
  pumped:     { energy: 0.9,  valence: 0.8, tempo: 160, genres: ["work-out", "electronic"] },
  focused:    { energy: 0.7,  valence: 0.5, tempo: 140, genres: ["work-out", "hip-hop"] },
  zen:        { energy: 0.3,  valence: 0.7, tempo: 110, genres: ["ambient", "chill"] },
  aggressive: { energy: 0.95, valence: 0.3, tempo: 175, genres: ["metal", "hard-rock"] },
  chill:      { energy: 0.4,  valence: 0.8, tempo: 115, genres: ["indie", "pop"] },
  hyped:      { energy: 0.85, valence: 0.9, tempo: 155, genres: ["dance", "pop"] },
}

const WORKOUT_GENRES: Record<string, string[]> = {
  road:      ["electronic", "pop"],
  trail:     ["folk", "indie"],
  intervals: ["techno", "electronic"],
  recovery:  ["ambient", "acoustic"],
  race:      ["hard-rock", "metal"],
}

export type Track = {
  id: string
  name: string
  artists: string
  albumImage: string
  tempo: number
  spotifyUrl: string
}

export async function findTracks({
  mood,
  workout,
  accessToken,
}: {
  mood: string
  workout: string
  accessToken: string
}): Promise<Track[]> {
  const moodConfig = MOOD_MAP[mood]
  const workoutGenres = WORKOUT_GENRES[workout]
  const genres = [...new Set([...moodConfig.genres, ...workoutGenres])].slice(0, 5)

  const params = new URLSearchParams({
    seed_genres: genres.join(","),
    target_energy: moodConfig.energy.toString(),
    target_valence: moodConfig.valence.toString(),
    target_tempo: moodConfig.tempo.toString(),
    min_tempo: (moodConfig.tempo - 20).toString(),
    max_tempo: (moodConfig.tempo + 20).toString(),
    limit: "15",
  })

  const res = await fetch(`https://api.spotify.com/v1/recommendations?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Spotify API error: ${err}`)
  }

  const data = await res.json()
  const tracks: Array<{ id: string; name: string; artists: Array<{ name: string }>; album: { images: Array<{ url: string }> }; external_urls: { spotify: string } }> = data.tracks

  const trackIds = tracks.map((t) => t.id).join(",")
  const featuresRes = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const featuresData = await featuresRes.json()
  const featuresMap: Record<string, { tempo: number }> = {}
  for (const f of featuresData.audio_features ?? []) {
    if (f) featuresMap[f.id] = f
  }

  return tracks.map((track) => ({
    id: track.id,
    name: track.name,
    artists: track.artists.map((a) => a.name).join(", "),
    albumImage: track.album.images[1]?.url ?? track.album.images[0]?.url ?? "",
    tempo: Math.round(featuresMap[track.id]?.tempo ?? moodConfig.tempo),
    spotifyUrl: track.external_urls.spotify,
  }))
}
