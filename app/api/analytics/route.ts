import { NextRequest, NextResponse } from 'next/server'
import { getSessionStats, getSessionData } from '@/lib/redis'

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')

    if (sessionId) {
      // Return data for specific session
      const sessionData = await getSessionData(sessionId)
      const response = NextResponse.json({
        ok: true,
        sessionData
      })
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
      return response
    } else {
      // Return global statistics
      const stats = await getSessionStats()
      const response = NextResponse.json({
        ok: true,
        stats
      })
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
      return response
    }
  } catch (error) {
    console.error('Analytics API error:', error)
    const errorResponse = NextResponse.json(
      { error: 'Failed to retrieve analytics data' },
      { status: 500 }
    )
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    return errorResponse
  }
}