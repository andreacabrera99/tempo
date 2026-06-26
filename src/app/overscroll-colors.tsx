"use client"
import { useEffect } from "react"

export function OverscrollColors() {
  useEffect(() => {
    const sky = "#54759c"
    const dark = "#0a0a0a"

    const update = () => {
      const atBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 20
      const color = atBottom ? dark : sky
      document.documentElement.style.backgroundColor = color
      document.body.style.backgroundColor = color
    }

    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])

  return null
}
