"use client"
import { useEffect } from "react"

export function OverscrollDark() {
  useEffect(() => {
    const set = () => {
      document.documentElement.style.backgroundColor = "#0b0b0f"
      document.body.style.backgroundColor = "#0b0b0f"
    }
    set()
    window.addEventListener("scroll", set, { passive: true })
    return () => {
      window.removeEventListener("scroll", set)
    }
  }, [])

  return null
}
