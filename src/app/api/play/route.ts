import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { contextUri } = await req.json()
  const token = (session as { accessToken: string }).accessToken
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
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

  const isPlaylist = typeof contextUri === "string" && contextUri.startsWith("spotify:playlist:")

  // For playlists, force the first track: turn shuffle off and start at offset 0.
  if (isPlaylist) {
    await fetch(
      `https://api.spotify.com/v1/me/player/shuffle?state=false&device_id=${device.id}`,
      { method: "PUT", headers }
    )
  }

  const body = isPlaylist
    ? { context_uri: contextUri, offset: { position: 0 } }
    : { context_uri: contextUri }

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
