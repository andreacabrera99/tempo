export default function Loading() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ background: "#0a0a0a" }}
    >
      <div
        className="rounded-2xl animate-pulse"
        style={{ width: 200, height: 200, background: "#1a1a1a" }}
      />
      <p
        style={{
          fontFamily: "var(--font-geist-mono)",
          fontSize: "0.78rem",
          letterSpacing: "0.15em",
          color: "rgba(255,255,255,0.35)",
        }}
      >
        Finding your match...
      </p>
    </div>
  )
}
