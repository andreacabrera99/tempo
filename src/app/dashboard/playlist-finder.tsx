"use client"

import { useState } from "react"
import { findTracks, type Track } from "@/app/actions/spotify"

const MOODS = [
  { id: "pumped",     label: "Pumped Up",   icon: "⚡" },
  { id: "focused",   label: "Focused",      icon: "◎" },
  { id: "zen",       label: "Zen",          icon: "≋" },
  { id: "aggressive",label: "Aggressive",   icon: "🔥" },
  { id: "chill",     label: "Chill",        icon: "✦" },
  { id: "hyped",     label: "Hyped",        icon: "★" },
]

const WORKOUTS = [
  { id: "road",      label: "Road Run" },
  { id: "trail",     label: "Trail" },
  { id: "intervals", label: "Intervals" },
  { id: "recovery",  label: "Recovery" },
  { id: "race",      label: "Race Day" },
]

export default function PlaylistFinder({ accessToken }: { accessToken: string }) {
  const [mood, setMood] = useState<string | null>(null)
  const [workout, setWorkout] = useState<string | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFind() {
    if (!mood || !workout) return
    setLoading(true)
    setError(null)
    try {
      const result = await findTracks({ mood, workout, accessToken })
      setTracks(result)
    } catch {
      setError("Couldn't load tracks. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-4">
          How are you feeling?
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              className={`py-4 px-3 rounded-xl border text-left transition-all ${
                mood === m.id
                  ? "border-green-500 bg-green-500/10 text-white"
                  : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              <div className="text-lg mb-1">{m.icon}</div>
              <div className="text-sm font-medium">{m.label}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-4">
          Your run
        </h2>
        <div className="flex flex-wrap gap-2">
          {WORKOUTS.map((w) => (
            <button
              key={w.id}
              onClick={() => setWorkout(w.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                workout === w.id
                  ? "bg-green-500 text-black"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={handleFind}
        disabled={!mood || !workout || loading}
        className="w-full py-4 rounded-full bg-green-500 hover:bg-green-400 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed text-black font-semibold transition-all"
      >
        {loading ? "Finding your tracks…" : "Find My Playlist →"}
      </button>

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}

      {tracks.length > 0 && (
        <section>
          <h2 className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-4">
            Your Mix — {tracks.length} tracks
          </h2>
          <div className="space-y-1">
            {tracks.map((track, i) => (
              <a
                key={track.id}
                href={track.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-900 transition-colors group"
              >
                <span className="text-zinc-700 text-xs w-4 text-right shrink-0">{i + 1}</span>
                {track.albumImage && (
                  <img src={track.albumImage} alt="" className="w-11 h-11 rounded-lg shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{track.name}</div>
                  <div className="text-zinc-500 text-xs truncate">{track.artists}</div>
                </div>
                <div className="text-zinc-600 text-xs shrink-0 tabular-nums">{track.tempo} BPM</div>
                <span className="text-zinc-800 group-hover:text-green-500 transition-colors text-sm shrink-0">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
