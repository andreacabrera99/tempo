import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "no session" }, { status: 401 })

  const token = (session as { accessToken: string }).accessToken

  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent("running workout")}&type=playlist&limit=20`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  )

  if (!res.ok) {
    return NextResponse.json({ status: res.status, error: await res.text() })
  }

  const data = await res.json()
  const raw = data.playlists?.items ?? []
  const afterBoolFilter = raw.filter(Boolean)
  const withImage = afterBoolFilter.filter((i: { images?: unknown[] }) => Array.isArray(i.images) && i.images.length > 0)
  const pool = withImage.length > 0 ? withImage : afterBoolFilter

  return NextResponse.json({
    rawCount: raw.length,
    afterBoolFilter: afterBoolFilter.length,
    withImage: withImage.length,
    poolLength: pool.length,
    pool0: pool[0] ? { name: pool[0].name, hasExternalUrl: !!pool[0].external_urls?.spotify } : null,
    firstRawItem: raw[0] ? JSON.stringify(raw[0]).substring(0, 200) : null,
  })
}
