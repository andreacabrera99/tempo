import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "no session" }, { status: 401 })

  const token = (session as { accessToken: string }).accessToken
  const results: Record<string, unknown> = { hasToken: !!token, tokenPrefix: token.substring(0, 8) + "..." }

  for (const q of ["running workout", "workout"]) {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=playlist&limit=5`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    )
    const body = await res.json()
    const raw = body.playlists?.items ?? []
    const nonNull = raw.filter(Boolean)
    results[q] = {
      status: res.status,
      ok: res.ok,
      rawCount: raw.length,
      nonNullCount: nonNull.length,
      first: nonNull[0] ? { name: nonNull[0].name, hasUrl: !!nonNull[0].external_urls?.spotify } : null,
    }
  }

  return NextResponse.json(results)
}
