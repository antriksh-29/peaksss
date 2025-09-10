import { NextRequest, NextResponse } from 'next/server'
import { findSongAndTimestamps } from '@/lib/gemini-search'
import { getCached, setCache, incrementCounter, createOrUpdateSession, recordSearch } from '@/lib/redis'
import { createSearchRecord } from '@/lib/session'

interface SearchRequestBody {
  query: string
  sessionId: string
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
  const startTime = Date.now()
  
  try {
    const body = await request.json() as SearchRequestBody
    const { query, sessionId } = body

    if (!query || !query.trim()) {
      const errorResponse = NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
      errorResponse.headers.set('Access-Control-Allow-Origin', '*')
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')
      return errorResponse
    }

    if (!sessionId) {
      const errorResponse = NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
      errorResponse.headers.set('Access-Control-Allow-Origin', '*')
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')
      return errorResponse
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
      'search',
      result.title,
      result.videoId,
      result.title,
      true
    )
    await recordSearch(searchRecord)

    // Increment counters
    await incrementCounter('search_count')
    await incrementCounter(`search_count:${new Date().toISOString().split('T')[0]}`)

    const response = NextResponse.json({
      ok: true,
      videoId: result.videoId,
      start: result.start,
      end: result.end,
      confidence: result.confidence,
      fromCache,
      responseTime
    })

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    return response
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
          'search',
          undefined,
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
    const errorResponse = NextResponse.json(
      { error: 'Unable to find that song. Please try a different search.' },
      { status: 500 }
    )
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    return errorResponse
  }
}