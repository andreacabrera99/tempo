import { handlers } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

function fixUrl(req: NextRequest): NextRequest {
  const url = req.url.replace("http://localhost:3000", "http://127.0.0.1:3000")
  if (url === req.url) return req
  return new NextRequest(url, req)
}

function isSignOutPage(req: NextRequest): boolean {
  return req.nextUrl.pathname === "/api/auth/signout"
}

export async function GET(req: NextRequest) {
  if (isSignOutPage(req)) return NextResponse.redirect(new URL("/", req.url))
  return handlers.GET(fixUrl(req))
}

export async function POST(req: NextRequest) {
  if (isSignOutPage(req)) return NextResponse.redirect(new URL("/", req.url))
  return handlers.POST(fixUrl(req))
}
