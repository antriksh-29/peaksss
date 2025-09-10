import { NextRequest, NextResponse } from 'next/server'
import { incrementCounter } from '@/lib/redis'

interface MetricsRequestBody {
  type: 'search' | 'play_start'
  videoId?: string
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as MetricsRequestBody
    const { type, videoId } = body

    if (!type || !['search', 'play_start'].includes(type)) {
      const errorResponse = NextResponse.json(
        { error: 'Invalid type. Must be "search" or "play_start"' },
        { status: 400 }
      )
      errorResponse.headers.set('Access-Control-Allow-Origin', '*')
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')
      return errorResponse
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

    const response = NextResponse.json({ ok: true })
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    return response
  } catch (error) {
    console.error('Metrics API error:', error)
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    return errorResponse
  }
}