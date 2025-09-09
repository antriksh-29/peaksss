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
You are a music expert with deep knowledge of songs, artists, and music similarity. Draw inspiration from how YouTube and Spotify recommend similar music to users.

Given this song: "${songTitle}"

Provide 3 songs that are similar in style, genre, mood, or popularity. Focus on:
- Same genre/subgenre
- Similar tempo and energy level
- Same era or time period
- Similar vocal style or instrumentation
- Songs that fans of the original would likely enjoy
- Use YouTube and Spotify's recommendation algorithms as inspiration

For each recommendation, provide:
1. Song title
2. Artist name
3. Confidence score (0.0 to 1.0) based on how similar it is

Rules:
- Only suggest real, well-known songs that exist
- Avoid covers, remixes, or live versions
- Prefer popular songs that are likely to be on YouTube
- Don't repeat the original song
- Order by confidence score (highest first)

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
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) {
      console.log('❌ No JSON found in Gemini recommendation response')
      throw new Error('Failed to parse Gemini recommendation response')
    }
    
    const parsed = JSON.parse(jsonMatch[0])
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