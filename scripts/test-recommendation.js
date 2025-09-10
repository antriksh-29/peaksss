// Test script for the recommendation system
// Run with: node scripts/test-recommendation.js

const path = require('path');

// Set up the path to find the lib modules
require('module')._resolveFilename = (originalResolveFilename => (id, parent, ...rest) => {
  if (id.startsWith('@/lib/')) {
    id = path.resolve(__dirname, '..', 'lib', id.replace('@/lib/', ''));
  }
  return originalResolveFilename(id, parent, ...rest);
})(require('module')._resolveFilename);

async function testRecommendationWithAPI() {
  console.log('🚀 TESTING PEAKSSS RECOMMENDATION SYSTEM VIA API')
  console.log('=' .repeat(60))
  
  // Test with a popular song
  const testSong = "Blinding Lights by The Weeknd"
  
  console.log(`\n📋 TESTING RECOMMENDATION FOR: "${testSong}"`)
  console.log('-'.repeat(40))
  
  const overallStartTime = Date.now()
  
  try {
    // Make API request to our recommendation endpoint
    const response = await fetch('http://localhost:3000/api/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        songTitle: testSong
      })
    });
    
    const result = await response.json();
    const overallTime = Date.now() - overallStartTime
    
    if (result.success) {
      console.log('\n✅ SUCCESS! Recommendation completed via API')
      console.log('📊 RESULTS SUMMARY:')
      console.log(`   Original Song: ${result.data.originalSong}`)
      console.log(`   Recommended: ${result.data.recommendation.title}`)
      console.log(`   Video ID: ${result.data.recommendation.videoId}`)
      console.log(`   Peak Segment: ${result.data.recommendation.start}s - ${result.data.recommendation.end}s`)
      console.log(`   Recommendation Rank: #${result.data.recommendation.recommendationRank} out of 5`)
      console.log(`   Original Confidence: ${result.data.recommendation.originalConfidence}`)
      console.log(`   Search Confidence: ${result.data.recommendation.confidence}`)
      console.log(`   Processing Time: ${result.data.performance.totalProcessingTime}ms`)
      console.log(`   API Response Time: ${result.data.performance.apiResponseTime}ms`)
      console.log(`   Overall Test Time: ${overallTime}ms`)
      
      console.log('\n📋 DETAILED LOGS:')
      result.data.logs.forEach(log => console.log(`   ${log}`))
      
      console.log('\n🎯 YouTube Link to test:')
      console.log(`   https://www.youtube.com/watch?v=${result.data.recommendation.videoId}&t=${result.data.recommendation.start}s`)
    } else {
      console.log(`\n❌ API FAILED: ${result.error}`)
      console.log(`   Response Time: ${result.performance?.apiResponseTime || 'unknown'}ms`)
    }
    
  } catch (error) {
    const overallTime = Date.now() - overallStartTime
    console.log(`\n❌ FAILED after ${overallTime}ms`)
    console.log(`💥 Error: ${error.message}`)
    console.log('\n💡 Make sure the Next.js dev server is running with: npm run dev')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('🎉 RECOMMENDATION SYSTEM API TESTING COMPLETE')
}

testRecommendationWithAPI().catch(console.error)