import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";

const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-private",
  "playlist-read-private",
  "playlist-modify-private",
  "user-read-playback-state",
  "user-modify-playback-state",
].join(" ");

// Auth.js requires a secret (AUTH_SECRET or NEXTAUTH_SECRET) and trusts the host
const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
if (!secret?.trim()) {
  throw new Error(
    "Missing auth secret. Add AUTH_SECRET or NEXTAUTH_SECRET to .env.local (e.g. run: openssl rand -base64 32)"
  );
}

const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
if (!spotifyClientId?.trim() || !spotifyClientSecret?.trim()) {
  throw new Error(
    "Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local"
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: secret.trim(),
  trustHost: true,
  providers: [
    Spotify({
      clientId: spotifyClientId.trim(),
      clientSecret: spotifyClientSecret.trim(),
      authorization: {
        params: {
          scope: SPOTIFY_SCOPES,
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as { accessToken?: string }).accessToken = token.accessToken as string;
        (session as { refreshToken?: string }).refreshToken = token.refreshToken as string;
        (session as { expiresAt?: number }).expiresAt = token.expiresAt as number;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
