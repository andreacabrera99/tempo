import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { contextUri, queuePlaylistId } = await req.json()
  const token = (session as { accessToken: string }).accessToken
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }

  // Fetch a playlist's track uris so they can be queued after a spoken-word pick
  // in a mix combo (Spotify's play `uris` list takes tracks/episodes, not a
  // playlist context). Skips local tracks (no playable uri) and caps the list —
  // the play endpoint accepts ~100 uris total.
  async function playlistTrackUris(playlistId: string): Promise<string[]> {
    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&fields=items(track(uri,is_local))`,
      { headers }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.items ?? [])
      .map((i: { track?: { uri?: string; is_local?: boolean } }) => i?.track)
      .filter((t: { uri?: string; is_local?: boolean } | undefined) => t?.uri && !t.is_local)
      .map((t: { uri: string }) => t.uri)
  }

  // Playback needs an active device. Find the Spotify app the user just opened
  // (prefer the active one, otherwise any available device).
  const devRes = await fetch("https://api.spotify.com/v1/me/player/devices", { headers })
  const devices: Array<{ id: string; is_active: boolean }> = devRes.ok
    ? (await devRes.json()).devices ?? []
    : []
  const device = devices.find((d) => d.is_active) ?? devices[0]

  // No device yet — the app is still spinning up. The client will retry.
  if (!device) return NextResponse.json({ ok: false, reason: "no-device" }, { status: 200 })

  const uri = typeof contextUri === "string" ? contextUri : ""
  const isPlaylist = uri.startsWith("spotify:playlist:")
  // A single episode (guided run) plays via `uris`, not `context_uri` — the
  // context form only accepts album/artist/playlist/show collections.
  const isEpisode = uri.startsWith("spotify:episode:")

  // Mix combo: play the spoken-word pick first, then the music playlist's tracks,
  // so the runner can skip from the podcast/coaching straight into music.
  const queueUris =
    typeof queuePlaylistId === "string" && queuePlaylistId
      ? await playlistTrackUris(queuePlaylistId)
      : []

  // Force the intended first item: turn shuffle off for playlists (start at
  // track 0) and for mix combos (so the podcast/coaching leads, not a random
  // music track).
  if (isPlaylist || queueUris.length > 0) {
    await fetch(
      `https://api.spotify.com/v1/me/player/shuffle?state=false&device_id=${device.id}`,
      { method: "PUT", headers }
    )
  }

  const body =
    queueUris.length > 0
      ? { uris: [uri, ...queueUris] }
      : isEpisode
      ? { uris: [uri] }
      : isPlaylist
      ? { context_uri: uri, offset: { position: 0 } }
      : { context_uri: uri }

  const res = await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${device.id}`,
    { method: "PUT", headers, body: JSON.stringify(body) }
  )

  // 204 = started playing, 202 = command accepted
  return NextResponse.json(
    { ok: res.status === 204 || res.status === 202, status: res.status },
    { status: 200 }
  )
}
