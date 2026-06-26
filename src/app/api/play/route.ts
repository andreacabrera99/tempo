import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { contextUri } = await req.json()
  const token = (session as { accessToken: string }).accessToken

  const res = await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ context_uri: contextUri }),
  })

  // 204 = started playing, 202 = command sent, 404 = no active device
  return NextResponse.json({ ok: res.status === 204 || res.status === 202 }, { status: 200 })
}
