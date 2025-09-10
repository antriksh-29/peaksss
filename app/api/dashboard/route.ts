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
    const searchKeys = await redis.keys('search:*')
    const recentSearchKeys = searchKeys.sort().slice(-50)
    
    const searchRecords: SearchRecord[] = []
    for (const key of recentSearchKeys) {
      try {
        const record = await redis.get<SearchRecord>(key)
        if (record) {
          searchRecords.push(record)
        }
      } catch (error) {
        console.error('Error fetching search record:', error)
      }
    }
    
    // Sort by timestamp (newest first)
    searchRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const stats = {
      metrics: {
        total: {
          searches: totalSearches,
          plays: totalPlays,
          conversionRate: totalSearches > 0 ? Math.round((totalPlays / totalSearches) * 100) : 0,
          uniqueSessions: totalUniqueSessions
        },
        today: {
          searches: todaySearches,
          plays: todayPlays,
          date: today
        },
        growth: {
          searches: searchGrowth,
          plays: playGrowth
        }
      },
      sessions: searchRecords.slice(0, 30) // Return last 30 records
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