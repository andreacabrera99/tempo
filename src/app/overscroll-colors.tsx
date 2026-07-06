"use client"
import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function OverscrollColors() {
  const pathname = usePathname()
  const isHome = pathname === "/"

  useEffect(() => {
    const sky = "#54759c"
    const dark = "#0a0a0a"
    const isDesktop = window.matchMedia("(min-width: 768px)")

    if (!isHome) {
      document.documentElement.style.backgroundColor = dark
      document.body.style.backgroundColor = dark
      return
    }

    let lastDim: boolean | null = null
    const update = () => {
      const dim = isDesktop.matches || window.scrollY > 10
      if (dim === lastDim) return
      lastDim = dim
      document.documentElement.style.backgroundColor = dim ? dark : sky
      document.body.style.backgroundColor = dim ? dark : sky
    }

    // iOS Safari doesn't reliably fire `scroll` events during the rubber-band
    // bounce itself (scrollY is clamped, so no real scroll happens), which is
    // what made the dark background lag behind by a beat. Polling every frame
    // catches the transition instantly regardless of event timing.
    let frame: number
    const loop = () => {
      update()
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    isDesktop.addEventListener("change", update)
    return () => {
      cancelAnimationFrame(frame)
      isDesktop.removeEventListener("change", update)
    }
  }, [isHome])

  return null
}
