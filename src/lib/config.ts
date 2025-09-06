export const config = {
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY!,
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY!,
  },
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  },
  app: {
    origin: process.env.APP_ORIGIN || 'http://localhost:3000',
    confidenceEscalate: parseFloat(process.env.CONFIDENCE_ESCALATE || '0.75'),
    anonIdCookieName: process.env.ANON_ID_COOKIE_NAME || 'peaksss_aid',
  },
}

// Validate required environment variables
const requiredEnvVars = [
  'YOUTUBE_API_KEY',
  'GOOGLE_API_KEY', 
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const

export function validateEnvVars() {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
  }
}