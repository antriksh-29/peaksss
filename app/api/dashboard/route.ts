import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { SessionData, SearchRecord } from '@/lib/session'

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

interface DashboardRecord {
  sessionId: string
  songName: string
  timestamp: string
  responseTimeMs: number
  videoId?: string
  success: boolean
}

export async function GET(request: NextRequest) {
  try {
    // Get all active sessions
    const sessionIds = await redis.smembers('active_sessions') || []
    
    const allRecords: DashboardRecord[] = []
    
    // Fetch search records for each session
    for (const sessionId of sessionIds) {
      const sessionSearchesKey = `session_searches:${sessionId}`
      const searchKeys = await redis.lrange(sessionSearchesKey, 0, -1) || []
      
      // Get all search records for this session
      for (const searchKey of searchKeys) {
        try {
          const searchRecord = await redis.get<SearchRecord>(searchKey)
          if (searchRecord) {
            allRecords.push({
              sessionId: searchRecord.sessionId,
              songName: searchRecord.songName || searchRecord.query,
              timestamp: searchRecord.timestamp,
              responseTimeMs: searchRecord.responseTimeMs,
              videoId: searchRecord.videoId,
              success: searchRecord.success
            })
          }
        } catch (error) {
          console.error(`Error fetching search record ${searchKey}:`, error)
        }
      }
    }
    
    // Sort by timestamp (most recent first)
    allRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    const response = NextResponse.json({
      ok: true,
      records: allRecords,
      totalRecords: allRecords.length
    })
    
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    return response
  } catch (error) {
    console.error('Dashboard API error:', error)
    const errorResponse = NextResponse.json(
      { error: 'Failed to retrieve dashboard data' },
      { status: 500 }
    )
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    return errorResponse
  }
}