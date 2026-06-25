import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import PlaylistFinder from "./playlist-finder"

export default async function Dashboard() {
  const session = await auth()
  if (!session) redirect("/")

  return (
    <div className="min-h-screen bg-black">
      <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-bold text-xl tracking-tighter">tempo</h1>
          <div className="flex items-end gap-[2px]">
            {[8, 14, 10, 18, 7].map((h, i) => (
              <div key={i} className="w-[2px] bg-green-500 rounded-full" style={{ height: `${h}px` }} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {session.user?.image && (
            <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
          )}
          <span className="text-zinc-500 text-sm hidden sm:block">{session.user?.name}</span>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}
          >
            <button className="text-zinc-700 hover:text-zinc-400 text-sm transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-white">
            Hey, {session.user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Let&apos;s build the perfect soundtrack for your run.</p>
        </div>

        <PlaylistFinder accessToken={session.accessToken} />
      </main>
    </div>
  )
}
