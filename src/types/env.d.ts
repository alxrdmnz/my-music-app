declare namespace NodeJS {
  interface ProcessEnv {
    SPOTIFY_CLIENT_ID: string;
    SPOTIFY_CLIENT_SECRET: string;
    SPOTIFY_REDIRECT_URI?: string;
    /** Set by Vercel in production (e.g. "tempoflowmusic.vercel.app") */
    VERCEL_URL?: string;
  }
}
