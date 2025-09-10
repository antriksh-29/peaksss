// Simple test for the recommendation logic
// This will test the core functions without running the full Next.js server

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Simple test to verify our Gemini connection and recommendation logic
async function testGeminiRecommendations() {
  console.log('🚀 TESTING PEAKSSS RECOMMENDATION CORE LOGIC')
  console.log('=' .repeat(60))
  
  // Check if we have API key
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No Gemini API key found in environment variables')
    console.log('💡 Please set GEMINI_API_KEY or GOOGLE_API_KEY in .env.local')
    return;
  }
  
  console.log('✅ Gemini API key found')
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });
    
    const testSong = "Blinding Lights by The Weeknd";
    console.log(`\n📋 Testing recommendations for: "${testSong}"`);
    
    const prompt = `
You are a music expert with deep knowledge of songs, artists, and music similarity.

Given this song: "${testSong}"

Provide 5 songs that are similar in style, genre, mood, or popularity. Focus on:
- Same genre/subgenre
- Similar tempo and energy level
- Same era or time period
- Similar vocal style or instrumentation
- Songs that fans of the original would likely enjoy

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

    const startTime = Date.now();
    console.log('🤖 Calling Gemini for recommendations...');
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const processingTime = Date.now() - startTime;
    
    console.log(`⏱️  Gemini response received in ${processingTime}ms`);
    console.log('📋 Raw Gemini response:');
    console.log(response);
    
    // Try to parse JSON - extract from code block if needed
    let jsonText = response;
    if (response.includes('```json')) {
      const codeMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      jsonText = codeMatch ? codeMatch[1] : response;
    } else {
      const jsonMatch = response.match(/\{[\s\S]*?\}/);
      jsonText = jsonMatch ? jsonMatch[0] : response;
    }
    
    try {
      const parsed = JSON.parse(jsonText);
      const recommendations = parsed.recommendations || [];
      
      console.log('\n✅ SUCCESS! Parsed recommendations:');
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. "${rec.song}" by ${rec.artist} (confidence: ${rec.confidence})`);
      });
      
      console.log('\n🎯 RECOMMENDATION FLOW SIMULATION:');
      console.log(`   Next step would be to search YouTube for: "${recommendations[0]?.song} ${recommendations[0]?.artist}"`);
      console.log(`   Then find peak timestamps using existing Gemini logic`);
      console.log(`   If search fails, try next recommendation in order`);
      
      
    } catch (parseError) {
      console.log('❌ Could not parse JSON from Gemini response');
      console.log('Parse error:', parseError.message);
    }
    
  } catch (error) {
    console.log(`❌ Error testing Gemini: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 CORE LOGIC TEST COMPLETE');
}

testGeminiRecommendations().catch(console.error);