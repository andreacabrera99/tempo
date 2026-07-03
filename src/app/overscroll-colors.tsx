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

    const update = () => {
      const dim = isDesktop.matches || window.scrollY > 10
      document.documentElement.style.backgroundColor = dim ? dark : sky
      document.body.style.backgroundColor = dim ? dark : sky
    }

    update()
    window.addEventListener("scroll", update, { passive: true })
    isDesktop.addEventListener("change", update)
    return () => {
      window.removeEventListener("scroll", update)
      isDesktop.removeEventListener("change", update)
    }
  }, [isHome])

  return null
}
