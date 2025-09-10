import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'Present' : 'Missing',
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY ? 'Present' : 'Missing',
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? 'Present' : 'Missing',
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? 'Present' : 'Missing',
  }

  return NextResponse.json({
    environment: 'Vercel',
    timestamp: new Date().toISOString(),
    environmentVariables: envCheck
  })
}