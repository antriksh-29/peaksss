// Test script for the recommendation system
// Run with: npx ts-node test-recommendation.ts

import { getNextSongRecommendation } from './lib/song-recommender'

async function testRecommendationSystem() {
  console.log('🚀 TESTING PEAKSSS RECOMMENDATION SYSTEM')
  console.log('=' .repeat(50))
  
  // Test with a popular song
  const testSong = "Blinding Lights by The Weeknd"
  
  console.log(`\n📋 TESTING RECOMMENDATION FOR: "${testSong}"`)
  console.log('-'.repeat(40))
  
  const overallStartTime = Date.now()
  
  try {
    const result = await getNextSongRecommendation(testSong)
    const overallTime = Date.now() - overallStartTime
    
    console.log('\n✅ SUCCESS! Recommendation completed')
    console.log('📊 RESULTS SUMMARY:')
    console.log(`   Original Song: ${result.originalSong}`)
    console.log(`   Recommended: ${result.recommendedSong.title}`)
    console.log(`   Video ID: ${result.recommendedSong.videoId}`)
    console.log(`   Peak Segment: ${result.recommendedSong.start}s - ${result.recommendedSong.end}s`)
    console.log(`   Recommendation Rank: #${result.recommendedSong.recommendationRank} out of 5`)
    console.log(`   Original Confidence: ${result.recommendedSong.originalConfidence}`)
    console.log(`   Search Confidence: ${result.recommendedSong.confidence}`)
    console.log(`   Processing Time: ${result.totalProcessingTime}ms`)
    console.log(`   Overall Test Time: ${overallTime}ms`)
    
    console.log('\n📋 DETAILED LOGS:')
    result.logs.forEach(log => console.log(`   ${log}`))
    
    console.log('\n🎯 YouTube Link to test:')
    console.log(`   https://www.youtube.com/watch?v=${result.recommendedSong.videoId}&t=${result.recommendedSong.start}s`)
    
  } catch (error) {
    const overallTime = Date.now() - overallStartTime
    console.log(`\n❌ FAILED after ${overallTime}ms`)
    console.log(`💥 Error: ${error instanceof Error ? error.message : String(error)}`)
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('🎉 RECOMMENDATION SYSTEM TESTING COMPLETE')
}

testRecommendationSystem().catch(console.error)