import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"

async function handleSignIn() {
  "use server"
  await signIn("spotify", { redirectTo: "/dashboard" })
}

export default async function Home() {
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <>
      {/* ── DESKTOP ───────────────────────────────────────────────── */}
      <div
        className="hidden md:relative md:flex flex-col min-h-screen"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        {/* Nav — absolute so image shows through on the right */}
        <nav className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-16 py-5">
          <div className="flex items-center gap-2">
            <BoltIcon />
            <span
              className="text-white uppercase"
              style={{ fontFamily: "var(--font-oswald)", fontWeight: 900, fontSize: "1.4rem", letterSpacing: "0.15em" }}
            >
              TEMPO
            </span>
          </div>

          <a
            href="/how-it-works"
            style={{ fontFamily: "var(--font-geist-sans)", color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", textDecoration: "none" }}
            className="hover:text-white transition-colors duration-150"
          >
            How it works
          </a>
        </nav>

        {/* Hero: two columns — full screen height */}
        <div className="flex min-h-screen overflow-hidden">
          {/* Left: content */}
          <div
            className="flex flex-col justify-start shrink-0"
            style={{ width: "54%", padding: "11rem 4rem 4rem 4rem" }}
          >
            <p
              className="uppercase"
              style={{
                fontFamily: "var(--font-barlow)",
                fontWeight: 700,
                fontSize: "0.7rem",
                color: "#C8FF00",
                letterSpacing: "0.25em",
                marginBottom: "1.25rem",
              }}
            >
              Music Curated for Runners
            </p>

            <div className="overflow-hidden" style={{ marginRight: "-5rem" }}>
              <h1
                className="text-white uppercase"
                style={{
                  fontFamily: "var(--font-oswald)",
                  fontWeight: 700,
                  fontSize: "clamp(56px, 8vw, 115px)",
                  lineHeight: 0.88,
                  transform: "scaleX(1.38)",
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

            <p
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontWeight: 400,
                color: "rgba(255,255,255,0.55)",
                fontSize: "0.92rem",
                lineHeight: 1.75,
                maxWidth: "38ch",
                marginTop: "2.5rem",
                marginBottom: "2.5rem",
              }}
            >
              Playlists tuned to your mood,
              <br />
              your pace, the type of your training.
            </p>

            <form action={handleSignIn}>
              <button
                type="submit"
                className="flex items-center gap-4 rounded-full transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: "#C8FF00", padding: "0.9rem 2rem", width: "fit-content" }}
              >
                <span
                  className="flex items-center justify-center rounded-full shrink-0"
                  style={{ width: 36, height: 36, backgroundColor: "#000" }}
                >
                  <SpotifyIcon size={18} />
                </span>
                <span
                  style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "1.25rem", color: "#000" }}
                >
                  Continue with Spotify
                </span>
              </button>
            </form>
          </div>

          {/* Right: image */}
          <div className="flex-1 relative">
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "url('/morning-run.webp')",
                backgroundSize: "cover",
                backgroundPosition: "center 80%",
              }}
            />
            {/* Fade from left */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to right, #0a0a0a 0%, transparent 5%)",
              }}
            />
            {/* Subtle dark overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.25)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── MOBILE ────────────────────────────────────────────────── */}
      <div className="md:hidden relative min-h-screen overflow-x-hidden" style={{ backgroundColor: "#0a0a0a" }}>
        {/* Photo block — extended upward by safe-area-inset-top to cover behind the status bar */}
        <div
          className="absolute inset-x-0 pointer-events-none"
          style={{
            top: "calc(env(safe-area-inset-top) * -1)",
            height: "calc(70vh + env(safe-area-inset-top))",
            overflow: "hidden",
          }}
        >
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
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, #54759c 0%, rgba(84,117,156,0) 18%, rgba(0,0,0,0.00) 30%, rgba(0,0,0,0.88) 91%, rgba(0,0,0,1.00) 100%)",
            }}
          />
        </div>

        <header className="relative px-6 pb-0" style={{ paddingTop: "calc(env(safe-area-inset-top) + 2.5rem)" }}>
          <div className="flex items-center gap-2">
            <BoltIcon />
            <span
              className="text-white uppercase"
              style={{ fontFamily: "var(--font-oswald)", fontWeight: 900, fontSize: "1.5rem", letterSpacing: "0.15em" }}
            >
              TEMPO
            </span>
          </div>
        </header>

        <main className="relative px-6" style={{ paddingTop: "22rem", paddingBottom: "3rem" }}>
          <p
            className="uppercase mb-0"
            style={{ fontFamily: "var(--font-barlow)", fontWeight: 700, fontSize: "0.7rem", color: "#C8FF00", letterSpacing: "0.22em" }}
          >
            Music Curated for Runners
          </p>

          <div className="overflow-hidden -mr-6">
            <h1
              className="text-white uppercase"
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

          <p
            className="mt-7 mb-10 leading-relaxed"
            style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 400, color: "rgba(255,255,255,0.55)", fontSize: "0.82rem" }}
          >
            Playlists tuned to your mood,
            <br />
            your pace, the type of your training.
          </p>

          <form action={handleSignIn}>
            <button
              type="submit"
              className="w-full flex items-center gap-4 rounded-full transition-all active:scale-[0.97]"
              style={{ backgroundColor: "#C8FF00", padding: "1rem 1.5rem" }}
            >
              <span
                className="flex items-center justify-center rounded-full shrink-0"
                style={{ width: 40, height: 40, backgroundColor: "#000" }}
              >
                <SpotifyIcon size={20} />
              </span>
              <span
                className="flex-1 text-center text-black leading-snug"
                style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "1.35rem" }}
              >
                Continue with
                <br />
                Spotify
              </span>
            </button>
          </form>
        </main>
      </div>
    </>
  )
}

function BoltIcon() {
  return (
    <svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.5 0L0 15h7.5L7 26L18 11h-7.5L10.5 0Z" fill="#C8FF00" />
    </svg>
  )
}

function SpotifyIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}
