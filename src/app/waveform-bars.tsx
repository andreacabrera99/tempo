"use client"

const BARS = [
  { color: "#ccff00", delay: 0,    dur: 0.70, max: 22 },
  { color: "#ff3399", delay: 0.13, dur: 0.90, max: 14 },
  { color: "#3b82f6", delay: 0.26, dur: 0.75, max: 18 },
  { color: "#a855f7", delay: 0.08, dur: 1.00, max: 24 },
  { color: "#f97316", delay: 0.20, dur: 0.65, max: 12 },
  { color: "#06b6d4", delay: 0.35, dur: 0.85, max: 20 },
  { color: "#84cc16", delay: 0.15, dur: 0.78, max: 16 },
]

export function WaveformBars({ height = 28 }: { height?: number }) {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center", height }}>
      {BARS.map((b, i) => (
        <div
          key={i}
          className="waveform-bar"
          style={{
            backgroundColor: b.color,
            "--bar-delay": `${b.delay}s`,
            "--bar-dur": `${b.dur}s`,
            "--bar-max": `${b.max}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
