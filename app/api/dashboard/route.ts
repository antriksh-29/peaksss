import { NextRequest, NextResponse } from 'next/server'
import { getCounter } from '@/lib/redis'

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

    const stats = {
      total: {
        searches: totalSearches,
        plays: totalPlays,
        conversionRate: totalSearches > 0 ? Math.round((totalPlays / totalSearches) * 100) : 0
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