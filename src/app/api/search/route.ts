import { NextRequest, NextResponse } from 'next/server'
import { findSongAndTimestamps } from '@/lib/gemini-search'
import { getCached, setCache, incrementCounter, createOrUpdateSession, recordSearch } from '@/lib/redis'
import { createSearchRecord } from '@/lib/session'

interface SearchRequestBody {
  query: string
  sessionId: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json() as SearchRequestBody
    const { query, sessionId } = body

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const trimmedQuery = query.trim()

    // Update session
    await createOrUpdateSession(sessionId)

    // Check cache first
    const cacheKey = `search:${trimmedQuery.toLowerCase()}`
    const cached = await getCached<any>(cacheKey)
    
    let result: any
    let fromCache = false
    
    if (cached) {
      result = cached
      fromCache = true
    } else {
      // Use Gemini to find song and timestamps
      result = await findSongAndTimestamps(trimmedQuery)
      
      // Cache the result for 6 hours
      await setCache(cacheKey, result, 21600)
    }

    const responseTime = Date.now() - startTime

    // Record this search
    const searchRecord = createSearchRecord(
      sessionId,
      trimmedQuery,
      responseTime,
      result.title,
      result.videoId,
      true
    )
    await recordSearch(searchRecord)

    // Increment counters
    await incrementCounter('search_count')
    await incrementCounter(`search_count:${new Date().toISOString().split('T')[0]}`)

    return NextResponse.json({
      ok: true,
      videoId: result.videoId,
      start: result.start,
      end: result.end,
      confidence: result.confidence,
      fromCache,
      responseTime
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    // Record failed search if we have sessionId
    try {
      const body = await request.clone().json() as SearchRequestBody
      if (body.sessionId && body.query) {
        const searchRecord = createSearchRecord(
          body.sessionId,
          body.query.trim(),
          responseTime,
          undefined,
          undefined,
          false
        )
        await recordSearch(searchRecord)
      }
    } catch {
      // Ignore errors in error logging
    }

    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Unable to find that song. Please try a different search.' },
      { status: 500 }
    )
  }
}