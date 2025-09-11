import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from './config'
import { findSongAndTimestamps, SongSearchResult } from './gemini-search'

const genAI = new GoogleGenerativeAI(config.google.apiKey)

export interface RecommendationResult {
  song: string
  artist: string
  confidence: number
}

export interface RecommendedSong extends SongSearchResult {
  recommendationRank: number
  originalConfidence: number
}

export interface RecommendationResponse {
  originalSong: string
  recommendedSong: RecommendedSong
  totalProcessingTime: number
  logs: string[]
}

/**
 * Get 5 song recommendations similar to the input song using Gemini AI
 */
export async function getSongRecommendations(songTitle: string): Promise<RecommendationResult[]> {
  const startTime = Date.now()
  console.log(`🎵 RECOMMENDATION START: Finding songs similar to "${songTitle}"`)
  
  const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' })

  const prompt = `
You are a music expert with deep knowledge of songs, artists, and music similarity. Your primary responsibility is to maintain STRICT GENRE CONSISTENCY.

Given this song: "${songTitle}"

CRITICAL GENRE RULES (MUST FOLLOW):
1. **SAME GENRE ONLY**: If the input is Punjabi music, recommend ONLY Punjabi songs. If it's English pop, recommend ONLY English pop. If it's Hindi Bollywood, recommend ONLY Hindi Bollywood songs.
2. **SAME LANGUAGE**: Maintain the same language as the original song. Punjabi songs should get Punjabi recommendations, English songs should get English recommendations, etc.
3. **REGIONAL CONSISTENCY**: If it's regional music (Punjabi, Tamil, Telugu, etc.), stay within that region's music scene.

STRICT ANALYSIS PROCESS:
1. First, identify the genre, language, and regional style of "${songTitle}"
2. Then recommend 3 songs that match EXACTLY the same genre/language/region
3. Never cross language or genre boundaries (e.g., NO English recommendations for Punjabi songs)

Additional similarity factors (SECONDARY to genre matching):
- Similar tempo and energy level
- Same era or time period  
- Similar vocal style or instrumentation
- Popular songs within the same genre/language
- Songs that fans would discover on regional music platforms

For each recommendation, provide:
1. Song title
2. Artist name
3. Confidence score (0.0 to 1.0) based on genre similarity + other factors

ABSOLUTE REQUIREMENTS:
- MUST maintain exact same genre and language as input
- Only suggest real, well-known songs that exist
- Avoid covers, remixes, or live versions
- Prefer popular songs within the same genre/language
- Don't repeat the original song
- Order by confidence score (highest first)

If you cannot find 3 songs in the exact same genre/language, it's better to return fewer recommendations than to break genre consistency.

Return JSON format:
{
  "recommendations": [
    {
      "song": "Song Title",
      "artist": "Artist Name", 
      "confidence": 0.95
    }
  ]
}
`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    console.log(`🤖 Gemini recommendation response: ${response.substring(0, 200)}...`)
    
    // Extract JSON from response - handle markdown code blocks
    let jsonText = response
    if (response.includes('```json')) {
      const codeMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
      jsonText = codeMatch ? codeMatch[1] : response
      console.log('🔍 Extracted JSON from markdown code block')
    } else {
      const jsonMatch = response.match(/\{[\s\S]*?\}/)
      jsonText = jsonMatch ? jsonMatch[0] : response
    }
    
    console.log('🔍 JSON to parse:', jsonText.substring(0, 100) + '...')
    const parsed = JSON.parse(jsonText)
    const recommendations: RecommendationResult[] = parsed.recommendations || []
    
    const processingTime = Date.now() - startTime
    console.log(`✅ Found ${recommendations.length} recommendations in ${processingTime}ms`)
    console.log(`📋 Recommendations:`)
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. "${rec.song}" by ${rec.artist} (confidence: ${rec.confidence})`)
    })
    
    return recommendations.slice(0, 3) // Ensure max 3 recommendations
    
  } catch (error) {
    console.error('❌ Gemini recommendation error:', error)
    throw new Error('Failed to get song recommendations')
  }
}

/**
 * Main recommendation flow: Get recommendations, try each one until success
 */
export async function getNextSongRecommendation(currentSongTitle: string): Promise<RecommendationResponse> {
  const startTime = Date.now()
  const logs: string[] = []
  
  const log = (message: string) => {
    console.log(message)
    logs.push(`${new Date().toISOString()} - ${message}`)
  }
  
  log(`🚀 RECOMMENDATION FLOW START: Current song "${currentSongTitle}"`)
  
  try {
    // Step 1: Get recommendations from Gemini
    log(`📋 Step 1: Getting song recommendations from Gemini AI`)
    const recommendationStartTime = Date.now()
    
    const recommendations = await getSongRecommendations(currentSongTitle)
    const recommendationTime = Date.now() - recommendationStartTime
    
    log(`⏱️  Gemini recommendations completed in ${recommendationTime}ms`)
    log(`📋 Found ${recommendations.length} recommendations`)
    
    if (recommendations.length === 0) {
      throw new Error('No recommendations received from Gemini')
    }
    
    // Step 2: Try each recommendation in order of confidence
    log(`🔍 Step 2: Attempting to find and process each recommendation`)
    
    for (let i = 0; i < recommendations.length; i++) {
      const rec = recommendations[i]
      const searchQuery = `${rec.song} ${rec.artist}`
      
      log(`🎯 Trying recommendation ${i + 1}/${recommendations.length}: "${searchQuery}" (confidence: ${rec.confidence})`)
      
      try {
        const searchStartTime = Date.now()
        
        // Use existing search and peak finding logic
        const result = await findSongAndTimestamps(searchQuery)
        const searchTime = Date.now() - searchStartTime
        
        log(`✅ Success! Found and processed "${searchQuery}" in ${searchTime}ms`)
        log(`📺 Video ID: ${result.videoId}`)
        log(`⏱️  Peak timestamps: ${result.start}s - ${result.end}s`)
        log(`📊 Search confidence: ${result.confidence}`)
        
        const totalTime = Date.now() - startTime
        log(`🎉 RECOMMENDATION FLOW COMPLETE: Total time ${totalTime}ms`)
        
        return {
          originalSong: currentSongTitle,
          recommendedSong: {
            ...result,
            recommendationRank: i + 1,
            originalConfidence: rec.confidence
          },
          totalProcessingTime: totalTime,
          logs
        }
        
      } catch (searchError) {
        log(`❌ Failed to process "${searchQuery}": ${searchError instanceof Error ? searchError.message : String(searchError)}`)
        log(`🔄 Moving to next recommendation...`)
        continue
      }
    }
    
    // If we get here, all recommendations failed
    throw new Error('All song recommendations failed to process')
    
  } catch (error) {
    const totalTime = Date.now() - startTime
    log(`💥 RECOMMENDATION FLOW FAILED: ${error instanceof Error ? error.message : String(error)}`)
    log(`⏱️  Total time before failure: ${totalTime}ms`)
    
    throw error
  }
}