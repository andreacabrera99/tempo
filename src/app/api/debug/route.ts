import { auth } from "@/auth"
import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "no session" }, { status: 401 })

  const token = (session as { accessToken: string }).accessToken
  const results: Record<string, unknown> = {}

  // Read raw JWT to see actual scopes stored at login time
  const rawJwt = await getToken({ req, secret: process.env.AUTH_SECRET })
  results.jwtScope = rawJwt?.scope || "not saved in jwt"
  results.jwtExpiresAt = rawJwt?.expiresAt ?? null
  results.accessTokenPrefix = token ? token.substring(0, 8) + "..." : "missing"
  results.accountScopeRaw = rawJwt ? Object.keys(rawJwt).join(",") : "no jwt"

  // Test 1: get user
  const meRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  results.me = { status: meRes.status, ok: meRes.ok }
  const meData = meRes.ok ? await meRes.json() : await meRes.text()
  if (meRes.ok) results.userId = meData.id
  else results.meError = meData

  // Test 2: search tracks
  const searchRes = await fetch(
    `https://api.spotify.com/v1/search?q=running+workout&type=track&limit=5`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  )
  results.search = { status: searchRes.status, ok: searchRes.ok }
  if (!searchRes.ok) results.searchError = await searchRes.text()

  // Test 3: create playlist
  if (meRes.ok && meData.id) {
    const createRes = await fetch(`https://api.spotify.com/v1/users/${meData.id}/playlists`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Tempo Debug Test", description: "debug", public: true }),
    })
    results.createPlaylist = { status: createRes.status, ok: createRes.ok }
    if (!createRes.ok) {
      results.createError = await createRes.text()
    } else {
      const pl = await createRes.json()
      results.createdPlaylistId = pl.id
      await fetch(`https://api.spotify.com/v1/playlists/${pl.id}/followers`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  }

  return NextResponse.json(results)
}
