import { NextRequest, NextResponse } from 'next/server'
import { incrementCounter } from '@/lib/redis'

interface MetricsRequestBody {
  type: 'search' | 'play_start'
  videoId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as MetricsRequestBody
    const { type, videoId } = body

    if (!type || !['search', 'play_start'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "search" or "play_start"' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    // Increment global counter
    await incrementCounter(`${type}_count`)
    
    // Increment daily counter
    await incrementCounter(`${type}_count:${today}`)

    // For play_start, also track per video if videoId is provided
    if (type === 'play_start' && videoId) {
      await incrementCounter(`play_start_count:video:${videoId}`)
      await incrementCounter(`play_start_count:video:${videoId}:${today}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Metrics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}