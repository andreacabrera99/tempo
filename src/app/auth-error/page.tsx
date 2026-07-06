function BoltIcon() {
  return (
    <svg width="28" height="40" viewBox="0 0 18 26" fill="none">
      <path d="M10.5 0L0 15h7.5L7 26L18 11h-7.5L10.5 0Z" fill="#0a0a0a" />
    </svg>
  )
}

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "Something's misconfigured on our end. We're on it — try again in a bit.",
  AccessDenied: "Spotify didn't grant access. Make sure you accept the permissions to continue.",
  Verification: "That sign-in link expired. Start over to get a new one.",
  default: "Something went wrong while signing you in.",
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const message = ERROR_MESSAGES[error ?? "default"] ?? ERROR_MESSAGES.default

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between px-6"
      style={{
        background: "#0a0a0a",
        paddingTop: "calc(env(safe-area-inset-top) + 3rem)",
        paddingBottom: "3rem",
      }}
    >
      <div />

      <div className="flex flex-col items-center gap-6 text-center">
        <div
          className="rounded-full flex items-center justify-center"
          style={{ width: 80, height: 80, background: "#C8FF00" }}
        >
          <BoltIcon />
        </div>

        <h1
          className="text-white leading-none"
          style={{
            fontFamily: "var(--font-barlow)",
            fontWeight: 900,
            fontSize: "clamp(48px, 14vw, 72px)",
            textTransform: "uppercase",
          }}
        >
          SIGN-IN
          <br />
          HICCUP
        </h1>

        <p
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: "0.82rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.5)",
            maxWidth: "32ch",
          }}
        >
          {message}
        </p>
      </div>

      <div className="w-full flex flex-col gap-3">
        <a
          href="/"
          className="w-full py-4 rounded-full flex items-center justify-center transition-all active:scale-[0.98]"
          style={{ background: "#C8FF00", textDecoration: "none" }}
        >
          <span
            style={{
              fontFamily: "var(--font-barlow)",
              fontWeight: 900,
              fontSize: "1.15rem",
              color: "#0a0a0a",
            }}
          >
            Back to Tempo
          </span>
        </a>
      </div>
    </div>
  )
}
