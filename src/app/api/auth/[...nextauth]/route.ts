import { handlers } from "@/auth"
import { NextRequest } from "next/server"

function fixUrl(req: NextRequest): NextRequest {
  const url = req.url.replace("http://localhost:3000", "http://127.0.0.1:3000")
  if (url === req.url) return req
  return new NextRequest(url, req)
}

export async function GET(req: NextRequest, ctx: any) {
  return handlers.GET(fixUrl(req), ctx)
}

export async function POST(req: NextRequest, ctx: any) {
  return handlers.POST(fixUrl(req), ctx)
}
