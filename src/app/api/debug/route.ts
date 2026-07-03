import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "no session" }, { status: 401 })

  const token = (session as { accessToken: string }).accessToken
  const results: Record<string, unknown> = {
    hasToken: !!token,
    tokenPrefix: token ? token.substring(0, 8) + "..." : "empty",
  }

  const queries = [
    "metal heavy gym power lifting",
    "running workout",
    "workout",
  ]

  for (const q of queries) {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=playlist&limit=5`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    )
    const body = res.ok ? await res.json() : await res.text()
    results[q] = {
      status: res.status,
      ok: res.ok,
      count: res.ok ? (body.playlists?.items?.length ?? 0) : undefined,
      error: res.ok ? undefined : body,
    }
  }

  return NextResponse.json(results)
}
