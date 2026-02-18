declare namespace NodeJS {
  interface ProcessEnv {
    SPOTIFY_CLIENT_ID: string;
    SPOTIFY_CLIENT_SECRET: string;
    SPOTIFY_REDIRECT_URI?: string;
    /** Set by Vercel (e.g. "tempoflowmusic.vercel.app") when system env vars are exposed */
    VERCEL_URL?: string;
    VERCEL_PROJECT_PRODUCTION_URL?: string;
    VERCEL?: string;
    VERCEL_ENV?: string;
  }
}
