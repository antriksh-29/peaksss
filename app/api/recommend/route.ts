import { NextRequest, NextResponse } from 'next/server'
import { getNextSongRecommendation } from '@/lib/song-recommender'
import { createSearchRecord } from '@/lib/session'
import { recordSearch, createOrUpdateSession } from '@/lib/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  console.log('\n🎵 RECOMMENDATION API CALLED')
  const startTime = Date.now()

  try {
    // Parse request body
    const body = await request.json()
    const { songTitle, sessionId } = body

    if (!songTitle) {
      console.log('❌ Missing songTitle in request')
      return NextResponse.json(
        { error: 'songTitle is required' },
        { status: 400 }
      )
    }

    console.log(`📋 Request: Find recommendation for "${songTitle}"`)

    // Get recommendation using your backend
    const result = await getNextSongRecommendation(songTitle)

    const totalApiTime = Date.now() - startTime
    console.log(`✨ API RESPONSE: Successfully found recommendation in ${totalApiTime}ms`)
    console.log(`🎯 Recommended: "${result.recommendedSong.title}" (rank #${result.recommendedSong.recommendationRank})`)
    
    // Track this recommendation if sessionId is provided
    if (sessionId) {
      try {
        await createOrUpdateSession(sessionId)
        const searchRecord = createSearchRecord(
          sessionId,
          songTitle,
          totalApiTime,
          'recommendation',
          result.recommendedSong.title,
          result.recommendedSong.videoId,
          result.recommendedSong.title,
          true
        )
        await recordSearch(searchRecord)
        console.log('📊 Recommendation tracked successfully')
      } catch (trackingError) {
        console.error('⚠️ Failed to track recommendation:', trackingError)
      }
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        originalSong: result.originalSong,
        recommendation: {
          title: result.recommendedSong.title,
          videoId: result.recommendedSong.videoId,
          start: result.recommendedSong.start,
          end: result.recommendedSong.end,
          confidence: result.recommendedSong.confidence,
          recommendationRank: result.recommendedSong.recommendationRank,
          originalConfidence: result.recommendedSong.originalConfidence
        },
        performance: {
          totalProcessingTime: result.totalProcessingTime,
          apiResponseTime: totalApiTime
        },
        logs: result.logs
      }
    })

  } catch (error) {
    const totalApiTime = Date.now() - startTime
    console.error('💥 RECOMMENDATION API ERROR:', error)
    console.log(`⏱️  API failed after ${totalApiTime}ms`)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        performance: {
          apiResponseTime: totalApiTime
        }
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
