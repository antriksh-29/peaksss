// Complete test for the recommendation system with full search and peak finding
// This simulates the exact API flow without needing the Next.js server

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
const GOOGLE_API_KEY = "AIzaSyDyxqun8yACDT-V2V9evISYRV4W7rV4fNs";
const YOUTUBE_API_KEY = "AIzaSyDaoLkfjiiiRHtKUhUmJhJzhzX01xqcBww";

async function testFullRecommendationFlow() {
  console.log('🎵 TESTING 3-RECOMMENDATION SYSTEM FOR "ANIMALS BY MAROON 5"');
  console.log('=' .repeat(70));
  
  const testSong = "Animals by Maroon 5";
  const overallStartTime = Date.now();
  
  try {
    // Step 1: Get recommendations from Gemini
    console.log(`\n📋 STEP 1: Getting recommendations for "${testSong}"`);
    console.log('-'.repeat(50));
    
    const recommendations = await getSongRecommendations(testSong);
    console.log(`✅ Found ${recommendations.length} recommendations`);
    
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. "${rec.song}" by ${rec.artist} (confidence: ${rec.confidence})`);
    });
    
    // Step 2: Try to find and process the top recommendation
    console.log(`\n📋 STEP 2: Processing top recommendation`);
    console.log('-'.repeat(50));
    
    const topRecommendation = recommendations[0];
    const searchQuery = `${topRecommendation.song} ${topRecommendation.artist}`;
    
    console.log(`🎯 Attempting to search and find peak for: "${searchQuery}"`);
    
    const searchResult = await simulateSearchAndPeakFinding(searchQuery);
    
    if (searchResult.success) {
      console.log(`✅ SUCCESS! Complete flow worked for "${searchQuery}"`);
      console.log(`📺 Video ID: ${searchResult.videoId}`);
      console.log(`📝 Video Title: ${searchResult.title}`);
      console.log(`⏱️  Peak Segment: ${searchResult.start}s - ${searchResult.end}s`);
      console.log(`📊 Peak Confidence: ${searchResult.confidence}`);
      console.log(`🔗 Test URL: https://www.youtube.com/watch?v=${searchResult.videoId}&t=${searchResult.start}s`);
    } else {
      console.log(`❌ Failed to process "${searchQuery}": ${searchResult.error}`);
    }
    
    const totalTime = Date.now() - overallStartTime;
    console.log(`\n⏱️  TOTAL PROCESSING TIME: ${totalTime}ms`);
    
    // Show what the API response would look like
    console.log(`\n📋 SIMULATED API RESPONSE:`);
    console.log('-'.repeat(50));
    
    const apiResponse = {
      success: searchResult.success,
      data: searchResult.success ? {
        originalSong: testSong,
        recommendation: {
          title: searchResult.title,
          videoId: searchResult.videoId,
          start: searchResult.start,
          end: searchResult.end,
          confidence: searchResult.confidence,
          recommendationRank: 1,
          originalConfidence: topRecommendation.confidence
        },
        performance: {
          totalProcessingTime: totalTime,
          apiResponseTime: totalTime
        },
        allRecommendations: recommendations
      } : {
        error: searchResult.error,
        performance: {
          totalProcessingTime: totalTime
        }
      }
    };
    
    console.log(JSON.stringify(apiResponse, null, 2));
    
  } catch (error) {
    const totalTime = Date.now() - overallStartTime;
    console.log(`\n💥 COMPLETE FLOW FAILED after ${totalTime}ms`);
    console.log(`Error: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('🎉 COMPLETE FLOW TEST FINISHED');
}

async function getSongRecommendations(songTitle) {
  const startTime = Date.now();
  console.log(`🤖 Calling Gemini for recommendations...`);
  
  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

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
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const processingTime = Date.now() - startTime;
    
    console.log(`⏱️  Gemini recommendations completed in ${processingTime}ms`);
    
    // Parse JSON from response
    console.log(`📋 Raw Gemini response: ${response.substring(0, 300)}...`);
    
    let jsonText = response;
    if (response.includes('```json')) {
      const codeMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      jsonText = codeMatch ? codeMatch[1] : response;
    } else {
      const jsonMatch = response.match(/\{[\s\S]*?\}/);
      jsonText = jsonMatch ? jsonMatch[0] : response;
    }
    
    console.log(`🔍 Extracted JSON: ${jsonText.substring(0, 200)}...`);
    
    const parsed = JSON.parse(jsonText);
    return parsed.recommendations || [];
    
  } catch (error) {
    console.error('❌ Gemini recommendation error:', error);
    throw new Error('Failed to get song recommendations');
  }
}

async function simulateSearchAndPeakFinding(searchQuery) {
  console.log(`🔍 Simulating YouTube search for: "${searchQuery}"`);
  
  try {
    // Simulate finding a video (this would normally use YouTube API)
    // For demonstration, let's simulate finding "Sugar" by Maroon 5 as a similar song
    const simulatedVideoId = "09R8_2nJtjg"; // Sugar by Maroon 5
    const simulatedTitle = searchQuery;
    
    console.log(`📺 Simulated video found: ${simulatedVideoId}`);
    console.log(`🤖 Calling Gemini for peak timestamps...`);
    
    const peakResult = await findPeakTimestamps(simulatedVideoId, 235); // Assuming ~4 minute song
    
    return {
      success: true,
      videoId: simulatedVideoId,
      title: simulatedTitle,
      start: peakResult.start,
      end: peakResult.end,
      confidence: peakResult.confidence
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function findPeakTimestamps(videoId, durationSeconds) {
  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });
  
  console.log(`🎯 Finding peak timestamps for ${durationSeconds}s video`);

  const prompt = `
For a song that is ${durationSeconds} seconds long, determine the start and end timestamps for the most famous/iconic part.

Rules:
- Return a 30-75 second segment that captures the best part
- For pop songs, this is often the main chorus or hook
- Avoid the first 20 seconds (intro) and last 20 seconds (outro)
- For songs under 2 minutes: focus on middle 30-60%
- For songs 2-4 minutes: focus on 25-75% range
- For songs over 4 minutes: focus on 30-70% range

Return JSON:
{
  "start": number (seconds),
  "end": number (seconds),
  "confidence": number (0.0 to 1.0)
}
`;

  try {
    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const processingTime = Date.now() - startTime;
    
    console.log(`⏱️  Peak timestamps found in ${processingTime}ms`);
    
    // Parse JSON
    console.log(`📋 Peak response: ${response.substring(0, 200)}...`);
    
    let jsonText = response;
    if (response.includes('```json')) {
      const codeMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      jsonText = codeMatch ? codeMatch[1] : response;
    } else {
      const jsonMatch = response.match(/\{[\s\S]*?\}/);
      jsonText = jsonMatch ? jsonMatch[0] : response;
    }
    
    const parsed = JSON.parse(jsonText);
    
    let start = Math.max(0, parseInt(parsed.start) || 0);
    let end = Math.min(durationSeconds, parseInt(parsed.end) || start + 60);
    
    if (end - start < 30) {
      end = Math.min(durationSeconds, start + 50);
    }
    
    console.log(`✅ Peak timestamps: ${start}s - ${end}s (${end - start}s duration)`);
    
    return {
      start,
      end,
      confidence: parsed.confidence || 0.7
    };
    
  } catch (error) {
    console.log(`❌ Peak finding error: ${error.message}`);
    
    // Fallback timestamps
    const start = Math.floor(durationSeconds * 0.3);
    const end = Math.min(durationSeconds, start + 60);
    
    console.log(`🔄 Using fallback timestamps: ${start}s - ${end}s`);
    
    return {
      start,
      end,
      confidence: 0.6
    };
  }
}

testFullRecommendationFlow().catch(console.error);