import QRCode from "qrcode"
import { signIn } from "@/auth"
import { WaveformBars } from "../waveform-bars"
import { OverscrollDark } from "./overscroll-dark"

const APP_URL = "https://tempo-one-jet.vercel.app"

async function handleSignIn() {
  "use server"
  await signIn("spotify", { redirectTo: "/dashboard" })
}

export default async function HowItWorks() {
  const qrSvg = (await QRCode.toString(APP_URL, { type: "svg", margin: 0, color: { dark: "#000000", light: "#ffffff" } })).replace(
    "<svg ",
    '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" '
  )
  return (
    <>
    <OverscrollDark />
    <div className="hidden md:block" style={{ backgroundColor: "#0b0b0f", color: "#fff", minHeight: "100vh" }}>

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 3rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <BoltIcon />
          <span style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: "1.35rem", color: "#fff", letterSpacing: "0.12em" }}>TEMPO</span>
        </a>
        <a href="#qr" style={{ display: "flex", alignItems: "center", backgroundColor: "#ccff00", border: "none", borderRadius: "999px", padding: "0.6rem 1.25rem", textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "0.9rem", color: "#000" }}>Run now</span>
        </a>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{ textAlign: "center", padding: "6rem 2rem 4rem" }}>
        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.7rem", color: "#ccff00", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "2rem" }}>
          HOW IT WORKS
        </p>
        <h1 style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "clamp(64px, 9vw, 120px)", lineHeight: 0.9, textTransform: "uppercase", color: "#fff", marginBottom: "2.5rem" }}>
          FROM A<br />FEELING<br />TO A RUN<br />MIX<br />IN 30<br />SECONDS
        </h1>
        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.75, maxWidth: "42ch", margin: "0 auto 2.5rem" }}>
          No playlist hunting. Tell TEMPO your mood or the cadence you want to run — it builds the perfect mix for you. Wanna share with others? You can join a shared session.
        </p>
        {/* Waveform */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <WaveformBars height={32} />
        </div>
      </section>

      {/* ── STEP CARDS ──────────────────────────────────────────── */}
      <section style={{ padding: "2rem 3rem 6rem", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {[
          { n: "01", icon: <BoltIcon />, title: "Connect Spotify", desc: "One tap with OAuth. We read your library and listening taste.", active: false },
          { n: "02", icon: <ClockIcon />, title: "Set mood or cadence", desc: "How do you feel? How far? or What cadence do you want to run? Just a few questions so we can set everything up.", active: false },
          { n: "03", icon: <PlayIcon />, title: "We curate the mix", desc: "The engine blends your tracks and podcasts to match your mood — or to hit the exact BPM you picked.", active: false },
          { n: "04", icon: <PlayIconLime />, title: "Run to the beat", desc: "Every track fits the session you set up.", active: true },
        ].map((s) => (
          <div key={s.n} style={{ backgroundColor: "#131318", borderRadius: 20, padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem", border: s.active ? "1px solid rgba(204,255,0,0.2)" : "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: "2.5rem", color: "rgba(255,255,255,0.07)", lineHeight: 1 }}>{s.n}</span>
            <div>{s.icon}</div>
            <h3 style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 700, fontSize: "1.3rem", color: "#fff", lineHeight: 1.2 }}>{s.title}</h3>
            <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{s.desc}</p>
          </div>
        ))}
      </section>

      {/* ── SECTION 1 — SET YOUR CADENCE ────────────────────────── */}
      <section style={{ padding: "0 3rem 7rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
        {/* Left */}
        <div>
          <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.68rem", color: "#ccff00", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span>①</span> SET YOUR CADENCE
          </p>
          <h2 style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "clamp(36px, 3.5vw, 52px)", color: "#fff", lineHeight: 1.05, marginBottom: "1.5rem" }}>
            You pick the pace,<br />we find the beat
          </h2>
          <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.8, marginBottom: "2rem" }}>
            Dial in the cadence you want to run — your target steps-per-minute — and TEMPO pulls tracks whose BPM lands right on it.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <span style={{ backgroundColor: "#ccff00", color: "#000", fontFamily: "var(--font-geist-mono)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", padding: "0.4rem 0.9rem", borderRadius: 999 }}>YOU CHOOSE</span>
            <span style={{ backgroundColor: "#222228", color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-geist-mono)", fontSize: "0.72rem", letterSpacing: "0.12em", padding: "0.55rem 1.1rem", borderRadius: 999, border: "1px solid rgba(255,255,255,0.08)" }}>100–190 BPM</span>
          </div>
        </div>
        {/* Right — BPM card */}
        <div style={{ backgroundColor: "#131318", borderRadius: 20, padding: "2rem", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", textTransform: "uppercase" }}>TARGET CADENCE</span>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.65rem", color: "#ccff00", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              FINDING TRACKS <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#ccff00", display: "inline-block" }} />
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <span style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: "5rem", color: "#fff", lineHeight: 1 }}>168</span>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>SPM = BPM</span>
          </div>
          {/* Slider track */}
          <div style={{ position: "relative", marginBottom: "0.6rem" }}>
            <div style={{ height: 4, borderRadius: 999, background: "linear-gradient(to right, #3b82f6 0%, #8b5cf6 40%, #ccff00 75%, #e5e7eb 100%)" }} />
            <div style={{ position: "absolute", right: "24%", top: "50%", transform: "translate(50%, -50%)", width: 16, height: 16, borderRadius: "50%", backgroundColor: "#ccff00", border: "2px solid #0b0b0f", boxShadow: "0 0 0 2px #ccff00" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}>100 · easy jog</span>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.6rem", color: "#ccff00" }}>168 · tempo</span>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}>190 · sprint</span>
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — MOOD CURATION ───────────────────────────── */}
      <section style={{ padding: "0 3rem 7rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
        {/* Left — mood grid inside container card */}
        <div style={{ backgroundColor: "#131318", borderRadius: 20, padding: "1rem", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[
            { label: "HYPED", sub: "max energy", bg: "#ccff00", color: "#000" },
            { label: "LOCKED IN", sub: "deep focus", bg: "#1a1a20", color: "#fff" },
            { label: "FLOATY", sub: "easy & light", bg: "#1a1a20", color: "#fff" },
            { label: "ANGRY", sub: "rage run", bg: "#ff2d8a", color: "#fff" },
          ].map((m) => (
            <div key={m.label} style={{ backgroundColor: m.bg, borderRadius: 14, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: "1.4rem", color: m.color, letterSpacing: "0.04em" }}>{m.label}</span>
              <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.65rem", color: m.color === "#000" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.5)" }}>{m.sub}</span>
            </div>
          ))}
        </div>
        </div>
        {/* Right */}
        <div>
          <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.68rem", color: "#ccff00", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span>②</span> MOOD CURATION
          </p>
          <h2 style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "clamp(36px, 3.5vw, 52px)", color: "#fff", lineHeight: 1.05, marginBottom: "1.5rem" }}>
            Playlists that read<br />the room
          </h2>
          <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.8, marginBottom: "2rem" }}>
            Pick how you feel, where you're running and how hard. TEMPO curates from your own library — never the same generic gym playlist.
          </p>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            {["6 MOODS", "PLACE-AWARE"].map((t) => (
              <span key={t} style={{ backgroundColor: "#222228", fontFamily: "var(--font-geist-mono)", fontSize: "0.72rem", color: "rgba(255,255,255,0.7)", letterSpacing: "0.12em", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, padding: "0.55rem 1.1rem" }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3+4 — TWO FEATURE CARDS ────────────────────── */}
      <section style={{ padding: "0 3rem 7rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Card: Smart Audio Mix */}
        <div style={{ backgroundColor: "#131318", borderRadius: 20, padding: "2.5rem", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.65rem", color: "#ccff00", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span>③</span> SMART AUDIO MIX
          </p>
          <h2 style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "clamp(28px, 2.5vw, 38px)", color: "#fff", lineHeight: 1.1, marginBottom: "1.25rem" }}>
            Music, podcasts &<br />coaching, blended
          </h2>
          <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.8 }}>
            TEMPO weaves spoken audio and coaching cues between tracks based on your run's length and intensity.
          </p>
        </div>
        {/* Card: Community */}
        <div style={{ backgroundColor: "#131318", borderRadius: 20, padding: "2.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.65rem", color: "#ccff00", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span>④</span> COMMUNITY
          </p>
          <h2 style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "clamp(28px, 2.5vw, 38px)", color: "#fff", lineHeight: 1.1, marginBottom: "1.25rem" }}>
            Run to the same<br />beat as your crew
          </h2>
          <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.8, marginBottom: "1.5rem" }}>
            Join a shared session and hear what other runners in your zone — or your friends — are running to right now.
          </p>
          {/* Avatar stack */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex" }}>
              {["#ff3399","#3b82f6","#f97316","#a855f7"].map((c, i) => (
                <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: c, border: "2px solid #131318", marginLeft: i > 0 ? -8 : 0 }} />
              ))}
            </div>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>+9</span>
          </div>
          {/* Session row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0b0b0f", borderRadius: 12, padding: "0.75rem 1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#ccff00", flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.72rem", color: "#fff" }}>East Side Night Run</div>
                <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.62rem", color: "rgba(255,255,255,0.35)" }}>12 runners live · 168 BPM</div>
              </div>
            </div>
            <button style={{ backgroundColor: "#ccff00", color: "#000", fontFamily: "var(--font-geist-mono)", fontWeight: 700, fontSize: "0.7rem", border: "none", borderRadius: 999, padding: "0.35rem 0.9rem", cursor: "pointer" }}>Join</button>
          </div>
        </div>
      </section>

      {/* ── SECTION 5 — TEMPO IN YOUR POCKET ───────────────────── */}
      <section id="qr" style={{ padding: "0 3rem 8rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center", scrollMarginTop: "8rem" }}>
        {/* Left */}
        <div style={{ paddingLeft: "4rem" }}>
          <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.68rem", color: "#ccff00", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
            BUILT FOR THE RUN
          </p>
          <h2 style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "clamp(36px, 3.5vw, 52px)", color: "#fff", lineHeight: 1.05, marginBottom: "1.5rem" }}>
            TEMPO lives<br />in your pocket
          </h2>
          <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.8, marginBottom: "2rem" }}>
            It's a running companion — so it belongs on your phone. Scan the code to open TEMPO on mobile, slip it in your pocket and go.
          </p>
          {/* QR code area */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div>
              <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>Point your camera<br />at the code →</p>
            </div>
            <div
              style={{ width: 72, height: 72, backgroundColor: "#fff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: 6 }}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          </div>
        </div>
        {/* Right — Phone mockup with landing page image */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: 240, borderRadius: 40, border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 40px 80px rgba(0,0,0,0.7)", overflow: "hidden", position: "relative", aspectRatio: "9/19" }}>
            {/* Background image */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/morning-run.webp')", backgroundSize: "cover", backgroundPosition: "center 85%" }} />
            {/* Gradient overlay same as mobile landing */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, #54759c 0%, rgba(84,117,156,0) 18%, rgba(0,0,0,0.00) 30%, rgba(0,0,0,0.88) 91%, rgba(0,0,0,1.00) 100%)" }} />
            {/* Status bar */}
            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", padding: "0.75rem 1rem 0", fontSize: "0.6rem", color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-geist-mono)" }}>
              <span>9:41</span>
              <span>···</span>
            </div>
            {/* TEMPO logo */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem" }}>
              <BoltIconSmall />
              <span style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: "0.85rem", color: "#fff", letterSpacing: "0.12em" }}>TEMPO</span>
            </div>
            {/* Bottom content */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.5rem 1rem 1.25rem" }}>
              <p style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 700, fontSize: "0.55rem", color: "#ccff00", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Music Curated for Runners</p>
              <h2 style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: "2.2rem", color: "#fff", lineHeight: 0.88, textTransform: "uppercase", transform: "scaleX(1.38)", transformOrigin: "left center", display: "block", marginBottom: "1rem" }}>RUN<br />ON<br />TEMPO</h2>
              <div style={{ backgroundColor: "#ccff00", borderRadius: 999, padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <SpotifyIcon size={10} />
                </span>
                <span style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "0.75rem", color: "#000" }}>Continue with Spotify</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section style={{ padding: "0 3rem 5rem" }}>
        <div style={{ backgroundColor: "#ccff00", borderRadius: 24, padding: "5rem 2rem", textAlign: "center" }}>
          <BoltIconDark />
          <h2 style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "clamp(42px, 5vw, 72px)", color: "#000", textTransform: "uppercase", lineHeight: 0.95, margin: "1rem 0 0" }}>
            READY TO RUN<br />ON TEMPO?
          </h2>
        </div>
      </section>

    </div>

    {/* ── MOBILE ──────────────────────────────────────────────── */}
    <div className="md:hidden" style={{ backgroundColor: "#0b0b0f", color: "#fff", minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <BoltIcon />
          <span style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: "1.35rem", color: "#fff", letterSpacing: "0.12em" }}>TEMPO</span>
        </a>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: "2rem 1.5rem 2.5rem" }}>
        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.65rem", color: "#ccff00", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "1.5rem" }}>
          HOW IT WORKS
        </p>
        <div style={{ overflow: "hidden" }}>
          <h1 style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "clamp(52px, 17vw, 72px)", lineHeight: 0.9, textTransform: "uppercase", color: "#fff", marginBottom: "2rem", transform: "scaleX(1.15)", transformOrigin: "center center", display: "block" }}>
            FROM A<br />FEELING<br />TO A RUN<br />MIX
          </h1>
        </div>
        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.75, marginBottom: "2rem" }}>
          Tell TEMPO your mood or the cadence you want — it builds the perfect mix for you.
        </p>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <WaveformBars height={28} />
        </div>
      </section>

      {/* STEPS */}
      <section style={{ padding: "0 0.75rem 3rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {[
          { n: "01", title: "Connect Spotify", desc: "One tap with OAuth. We read your library and listening taste.", active: false },
          { n: "02", title: "Set mood or cadence", desc: "How do you feel? How far? or What cadence do you want to run? Just a few questions so we can set everything up.", active: false },
          { n: "03", title: "We curate the mix", desc: "The engine blends your tracks and podcasts to match your mood — or to hit the exact BPM you picked.", active: false },
          { n: "04", title: "Run to the beat", desc: "Every track fits the session you set up.", active: true },
        ].map((s) => (
          <div key={s.n} style={{ backgroundColor: "#131318", borderRadius: 16, padding: "1.25rem 1.5rem", display: "flex", gap: "1.25rem", border: s.active ? "1px solid rgba(204,255,0,0.18)" : "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: "2rem", color: s.active ? "rgba(204,255,0,0.25)" : "rgba(255,255,255,0.07)", lineHeight: 1, flexShrink: 0, minWidth: "2.5rem" }}>{s.n}</span>
            <div>
              <h3 style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 700, fontSize: "1.1rem", color: "#fff", marginBottom: "0.4rem", lineHeight: 1.2 }}>{s.title}</h3>
              <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "0 1.5rem 3.5rem" }} />

      {/* FEATURE 1 — SET YOUR CADENCE */}
      <section style={{ padding: "0 1.5rem 3.5rem" }}>
        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.65rem", color: "#ccff00", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span>①</span> SET YOUR CADENCE
        </p>
        <h2 style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "clamp(32px, 10vw, 44px)", color: "#fff", lineHeight: 1.05, marginBottom: "1rem" }}>
          You pick the pace,<br />we find the beat
        </h2>
        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.75, marginBottom: "1.5rem" }}>
          Dial in the cadence you want to run — your target steps-per-minute — and TEMPO pulls tracks whose BPM lands right on it.
        </p>
        <div style={{ backgroundColor: "#131318", borderRadius: 16, padding: "1.5rem", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", textTransform: "uppercase" }}>TARGET CADENCE</span>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.6rem", color: "#ccff00", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              FINDING <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#ccff00", display: "inline-block" }} />
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <span style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: "4.5rem", color: "#fff", lineHeight: 1 }}>168</span>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>SPM ↔ BPM</span>
          </div>
          <div style={{ position: "relative", marginBottom: "0.5rem" }}>
            <div style={{ height: 4, borderRadius: 999, background: "linear-gradient(to right, #3b82f6 0%, #8b5cf6 40%, #ccff00 75%, #e5e7eb 100%)" }} />
            <div style={{ position: "absolute", left: "75%", top: "50%", transform: "translate(-50%, -50%)", width: 14, height: 14, borderRadius: "50%", backgroundColor: "#ccff00", border: "2px solid #131318", boxShadow: "0 0 0 2px #ccff00" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.58rem", color: "rgba(255,255,255,0.3)" }}>100 · jog</span>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.58rem", color: "#ccff00" }}>168 · tempo</span>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.58rem", color: "rgba(255,255,255,0.3)" }}>190 · sprint</span>
          </div>
        </div>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "0 1.5rem 3.5rem" }} />

      {/* FEATURE 2 — MOOD CURATION */}
      <section style={{ padding: "0 1.5rem 3.5rem" }}>
        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.65rem", color: "#ccff00", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span>②</span> MOOD CURATION
        </p>
        <h2 style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "clamp(32px, 10vw, 44px)", color: "#fff", lineHeight: 1.05, marginBottom: "1rem" }}>
          Playlists that read<br />the room
        </h2>
        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.75, marginBottom: "1.5rem" }}>
          Pick how you feel, where you're running and how hard. TEMPO curates from your own library — never the same generic gym playlist.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[
            { label: "HYPED", sub: "max energy", bg: "#ccff00", color: "#000" },
            { label: "LOCKED IN", sub: "deep focus", bg: "#1a1a20", color: "#fff" },
            { label: "FLOATY", sub: "easy & light", bg: "#1a1a20", color: "#fff" },
            { label: "ANGRY", sub: "rage run", bg: "#ff2d8a", color: "#fff" },
          ].map((m) => (
            <div key={m.label} style={{ backgroundColor: m.bg, borderRadius: 14, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.3rem", aspectRatio: "1" }}>
              <span style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: "1.3rem", color: m.color, letterSpacing: "0.03em" }}>{m.label}</span>
              <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.62rem", color: m.color === "#000" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.5)" }}>{m.sub}</span>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "0 1.5rem 3.5rem" }} />

      {/* FEATURE 3 — SMART AUDIO MIX */}
      <section style={{ padding: "0 1.5rem 3.5rem" }}>
        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.65rem", color: "#ccff00", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span>③</span> SMART AUDIO MIX
        </p>
        <h2 style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "clamp(32px, 10vw, 44px)", color: "#fff", lineHeight: 1.05, marginBottom: "1rem" }}>
          Music, podcasts &<br />coaching, blended
        </h2>
        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.75 }}>
          TEMPO weaves spoken audio and coaching cues between tracks based on your run's length and intensity.
        </p>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "0 1.5rem 3.5rem" }} />

      {/* FEATURE 4 — COMMUNITY */}
      <section style={{ padding: "0 1.5rem 3.5rem" }}>
        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.65rem", color: "#ccff00", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span>④</span> COMMUNITY
        </p>
        <h2 style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "clamp(32px, 10vw, 44px)", color: "#fff", lineHeight: 1.05, marginBottom: "1rem" }}>
          Run to the same<br />beat as your crew
        </h2>
        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.75, marginBottom: "1.5rem" }}>
          Join a shared session and hear what other runners in your zone — or your friends — are running to right now.
        </p>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex" }}>
            {["#2a2a30","#333340","#2a2a30"].map((c, i) => (
              <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: c, border: "2px solid #0b0b0f", marginLeft: i > 0 ? -10 : 0 }} />
            ))}
            <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#ccff00", border: "2px solid #0b0b0f", marginLeft: -10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 700, fontSize: "0.58rem", color: "#000" }}>+9</span>
            </div>
          </div>
        </div>
        <div style={{ backgroundColor: "#131318", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#ccff00", flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.78rem", fontWeight: 700, color: "#fff" }}>East Side Night Run</div>
              <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.62rem", color: "rgba(255,255,255,0.35)" }}>12 runners live · 168 BPM</div>
            </div>
          </div>
          <button style={{ backgroundColor: "#ccff00", color: "#000", fontFamily: "var(--font-geist-mono)", fontWeight: 700, fontSize: "0.72rem", border: "none", borderRadius: 999, padding: "0.4rem 1rem", cursor: "pointer" }}>Join</button>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "0 1.5rem 3rem" }}>
        <div style={{ backgroundColor: "#ccff00", borderRadius: 20, padding: "3rem 1.5rem", textAlign: "center" }}>
          <BoltIconDark />
          <h2 style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "clamp(40px, 13vw, 58px)", color: "#000", textTransform: "uppercase", lineHeight: 0.92, margin: "1rem 0 2rem", transform: "scaleX(1.1)", transformOrigin: "center center", display: "block" }}>
            READY<br />TO RUN<br />ON<br />TEMPO?
          </h2>
          <form action={handleSignIn}>
            <button type="submit" style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", backgroundColor: "#0b0b0f", border: "none", borderRadius: 999, padding: "0.75rem 1.75rem", cursor: "pointer" }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "#ccff00", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <SpotifyIconDark size={12} />
              </span>
              <span style={{ fontFamily: "var(--font-barlow)", fontWeight: 900, fontSize: "0.9rem", color: "#ccff00" }}>Continue with Spotify</span>
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem 1.5rem 3rem" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <BoltIcon />
          <span style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: "1.1rem", color: "#fff", letterSpacing: "0.15em" }}>TEMPO</span>
        </a>
      </footer>

    </div>
    </>
  )
}

function BoltIcon() {
  return (
    <svg width="14" height="20" viewBox="0 0 18 26" fill="none">
      <path d="M10.5 0L0 15h7.5L7 26L18 11h-7.5L10.5 0Z" fill="#ccff00" />
    </svg>
  )
}

function BoltIconSmall() {
  return (
    <svg width="10" height="14" viewBox="0 0 18 26" fill="none">
      <path d="M10.5 0L0 15h7.5L7 26L18 11h-7.5L10.5 0Z" fill="#ccff00" />
    </svg>
  )
}

function BoltIconDark() {
  return (
    <svg width="18" height="26" viewBox="0 0 18 26" fill="none" style={{ display: "block", margin: "0 auto" }}>
      <path d="M10.5 0L0 15h7.5L7 26L18 11h-7.5L10.5 0Z" fill="#000" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#1e1e26", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    </div>
  )
}

function PlayIcon() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#1e1e26", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="10" height="12" viewBox="0 0 10 12" fill="rgba(255,255,255,0.5)">
        <path d="M0 0L10 6L0 12Z" />
      </svg>
    </div>
  )
}

function PlayIconLime() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#ccff00", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="10" height="12" viewBox="0 0 10 12" fill="#000">
        <path d="M0 0L10 6L0 12Z" />
      </svg>
    </div>
  )
}

function SpotifyIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

function SpotifyIconDark({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="black">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
      <rect width="22" height="2" rx="1" fill="rgba(255,255,255,0.7)" />
      <rect y="7" width="22" height="2" rx="1" fill="rgba(255,255,255,0.7)" />
      <rect y="14" width="22" height="2" rx="1" fill="rgba(255,255,255,0.7)" />
    </svg>
  )
}

