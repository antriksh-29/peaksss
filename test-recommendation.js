// Test script for the recommendation system
// Run with: node test-recommendation.js

const { getNextSongRecommendation } = require('./lib/song-recommender.ts')

async function testRecommendationSystem() {
  console.log('🚀 TESTING PEAKSSS RECOMMENDATION SYSTEM')
  console.log('=' .repeat(50))
  
  // Test songs to try
  const testSongs = [
    "Blinding Lights by The Weeknd",
    "Shape of You by Ed Sheeran", 
    "Someone You Loved by Lewis Capaldi"
  ]
  
  for (const songTitle of testSongs) {
    console.log(`\n📋 TESTING RECOMMENDATION FOR: "${songTitle}"`)
    console.log('-'.repeat(40))
    
    const overallStartTime = Date.now()
    
    try {
      const result = await getNextSongRecommendation(songTitle)
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
      
    } catch (error) {
      const overallTime = Date.now() - overallStartTime
      console.log(`\n❌ FAILED after ${overallTime}ms`)
      console.log(`💥 Error: ${error.message}`)
    }
    
    console.log('\n' + '='.repeat(50))
  }
  
  console.log('\n🎉 RECOMMENDATION SYSTEM TESTING COMPLETE')
}

// Handle both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  testRecommendationSystem().catch(console.error)
} else {
  testRecommendationSystem().catch(console.error)
}