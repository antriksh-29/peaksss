import { NextRequest, NextResponse } from 'next/server'
import { getCounter, redis } from '@/lib/redis'
import { SearchRecord } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Get total counters
    const totalSearches = await getCounter('search_count') || 0
    const totalPlays = await getCounter('play_start_count') || 0
    
    // Get daily counters
    const todaySearches = await getCounter(`search_count:${today}`) || 0
    const todayPlays = await getCounter(`play_start_count:${today}`) || 0
    
    const yesterdaySearches = await getCounter(`search_count:${yesterday}`) || 0
    const yesterdayPlays = await getCounter(`play_start_count:${yesterday}`) || 0
    
    // Calculate growth
    const searchGrowth = yesterdaySearches > 0 
      ? Math.round(((todaySearches - yesterdaySearches) / yesterdaySearches) * 100)
      : 0
    
    const playGrowth = yesterdayPlays > 0
      ? Math.round(((todayPlays - yesterdayPlays) / yesterdayPlays) * 100)
      : 0

    // Get session data for the table
    const activeSessions = await redis.smembers('active_sessions') || []
    const totalUniqueSessions = activeSessions.length
    
    // Get recent search records (last 50 for performance)
    let searchRecords: SearchRecord[] = []
    try {
      const searchKeys = await redis.keys('search:*')
      const recentSearchKeys = Array.isArray(searchKeys) ? searchKeys.sort().slice(-50) : []
      
      for (const key of recentSearchKeys) {
        try {
          const record = await redis.get<SearchRecord>(key)
          if (record && typeof record === 'object') {
            searchRecords.push(record)
          }
        } catch (error) {
          console.error('Error fetching search record:', key, error)
        }
      }
    } catch (error) {
      console.error('Error fetching search keys:', error)
      searchRecords = []
    }
    
    // Sort by timestamp (newest first) - with safety check
    if (Array.isArray(searchRecords) && searchRecords.length > 0) {
      searchRecords.sort((a, b) => {
        const timestampA = a?.timestamp ? new Date(a.timestamp).getTime() : 0
        const timestampB = b?.timestamp ? new Date(b.timestamp).getTime() : 0
        return timestampB - timestampA
      })
    }

    const stats = {
      metrics: {
        total: {
          searches: totalSearches || 0,
          plays: totalPlays || 0,
          conversionRate: totalSearches > 0 ? Math.round((totalPlays / totalSearches) * 100) : 0,
          uniqueSessions: totalUniqueSessions || 0
        },
        today: {
          searches: todaySearches || 0,
          plays: todayPlays || 0,
          date: today
        },
        growth: {
          searches: searchGrowth || 0,
          plays: playGrowth || 0
        }
      },
      sessions: Array.isArray(searchRecords) ? searchRecords.slice(0, 30) : [] // Return last 30 records or empty array
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}