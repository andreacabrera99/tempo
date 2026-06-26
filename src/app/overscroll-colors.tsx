"use client"
import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function OverscrollColors() {
  const pathname = usePathname()
  const isHome = pathname === "/"

  useEffect(() => {
    const sky = "#54759c"
    const dark = "#0a0a0a"

    if (!isHome) {
      document.documentElement.style.backgroundColor = dark
      document.body.style.backgroundColor = dark
      return
    }

    const update = () => {
      const atBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 20
      document.documentElement.style.backgroundColor = atBottom ? dark : sky
      document.body.style.backgroundColor = atBottom ? dark : sky
    }

    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [isHome])

  return null
}
