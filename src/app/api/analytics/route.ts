import { NextRequest, NextResponse } from 'next/server'
import { getSessionStats, getSessionData } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')

    if (sessionId) {
      // Return data for specific session
      const sessionData = await getSessionData(sessionId)
      return NextResponse.json({
        ok: true,
        sessionData
      })
    } else {
      // Return global statistics
      const stats = await getSessionStats()
      return NextResponse.json({
        ok: true,
        stats
      })
    }
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve analytics data' },
      { status: 500 }
    )
  }
}