import { NextRequest, NextResponse } from 'next/server'
import { getVideoDetails } from '@/lib/youtube'
import { findHighlight } from '@/lib/gemini'
import { getCached, setCache } from '@/lib/redis'
import { config } from '@/lib/config'

interface HighlightRequestBody {
  videoId: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as HighlightRequestBody
    const { videoId } = body

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = `highlight:${videoId}`
    const cached = await getCached<any>(cacheKey)
    if (cached) {
      return NextResponse.json({
        ok: true,
        ...cached,
      })
    }

    // Get video details from YouTube
    const video = await getVideoDetails(videoId)
    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Use Gemini to find the highlight
    let highlight = await findHighlight(video, false) // Start with Flash model

    // Escalate to Pro model if confidence is low
    if (highlight.confidence < config.app.confidenceEscalate) {
      console.log(`Low confidence (${highlight.confidence}), escalating to Pro model`)
      highlight = await findHighlight(video, true)
    }

    const result = {
      videoId,
      start: highlight.start,
      end: highlight.end,
      confidence: highlight.confidence,
      method: highlight.method,
    }

    // Cache the result for 6 hours
    await setCache(cacheKey, result, 21600)

    return NextResponse.json({
      ok: true,
      ...result,
    })
  } catch (error) {
    console.error('Highlight API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}