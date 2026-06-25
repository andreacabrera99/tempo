import NextAuth from "next-auth"
import Spotify from "next-auth/providers/spotify"

const SCOPES = [
  "user-read-email",
  "user-read-private",
  "playlist-read-private",
  "streaming",
  "user-modify-playback-state",
  "user-read-playback-state",
  "user-top-read",
].join(" ")

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: `https://accounts.spotify.com/authorize?scope=${encodeURIComponent(SCOPES)}`,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token ?? ""
        token.refreshToken = account.refresh_token ?? ""
        token.expiresAt = account.expires_at ?? 0
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      return session
    },
  },
})
