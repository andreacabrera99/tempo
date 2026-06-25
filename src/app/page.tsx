import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ backgroundColor: "#0a0a0a" }}>
      {/* Photo block: clip container */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{ height: "70vh", overflow: "hidden" }}
      >
        {/* Inner image div — taller than clip so we can shift vertically */}
        <div
          style={{
            position: "absolute",
            top: "-35%",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "url('/morning-run.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center 85%",
          }}
        />
        {/* Fade to black at bottom */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.10) 40%, rgba(0,0,0,0.88) 82%, rgba(0,0,0,1.00) 100%)",
          }}
        />
      </div>
      {/* Logo */}
      <header className="relative px-6 pb-0" style={{ paddingTop: "calc(env(safe-area-inset-top) + 2.5rem)" }}>
        <div className="flex items-center gap-2">
          <BoltIcon />
          <span
            className="text-white uppercase"
            style={{
              fontFamily: "var(--font-oswald)",
              fontWeight: 900,
              fontSize: "1.5rem",
              letterSpacing: "0.15em",
            }}
          >
            TEMPO
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative px-6" style={{ paddingTop: "22rem", paddingBottom: "3rem" }}>
        {/* Tag line */}
        <p
          className="uppercase tracking-[0.2em] mb-0"
          style={{
            fontFamily: "var(--font-barlow)",
            fontWeight: 700,
            fontSize: "0.7rem",
            color: "#C8FF00",
            letterSpacing: "0.22em",
          }}
        >
          Music Curated for Runners
        </p>

        {/* Hero — full bleed, each word on its own line */}
        <div className="overflow-hidden -mr-6">
          <h1
            className="text-white uppercase leading-[0.87] whitespace-nowrap"
            style={{
              fontFamily: "var(--font-oswald)",
              fontWeight: 700,
              fontSize: "clamp(62px, 20vw, 130px)",
              lineHeight: 0.88,
              transform: "scaleX(1.45)",
              transformOrigin: "left center",
              display: "block",
            }}
          >
            RUN
            <br />
            ON
            <br />
            TEMPO
          </h1>
        </div>

        {/* Sub copy */}
        <p
          className="mt-7 mb-10 leading-relaxed"
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontWeight: 400,
            color: "rgba(255,255,255,0.55)",
            fontSize: "0.82rem",
            letterSpacing: "0em",
          }}
        >
          Playlists tuned to your mood,
          <br />
          your pace, the type of your training.
        </p>

        {/* CTA */}
        <form
          action={async () => {
            "use server"
            await signIn("spotify", { redirectTo: "/dashboard" })
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center gap-4 rounded-full transition-all active:scale-[0.97]"
            style={{
              backgroundColor: "#C8FF00",
              padding: "1rem 1.5rem",
            }}
          >
            {/* Spotify icon in black circle */}
            <span
              className="flex items-center justify-center rounded-full shrink-0"
              style={{ width: 40, height: 40, backgroundColor: "#000" }}
            >
              <SpotifyIcon />
            </span>

            {/* Text */}
            <span
              className="flex-1 text-center text-black leading-snug"
              style={{
                fontFamily: "var(--font-barlow)",
                fontWeight: 900,
                fontSize: "1.35rem",
              }}
            >
              Continue with
              <br />
              Spotify
            </span>
          </button>
        </form>

      </main>
    </div>
  )
}

function BoltIcon() {
  return (
    <svg
      width="18"
      height="26"
      viewBox="0 0 18 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.5 0L0 15h7.5L7 26L18 11h-7.5L10.5 0Z"
        fill="#C8FF00"
      />
    </svg>
  )
}

function SpotifyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}
