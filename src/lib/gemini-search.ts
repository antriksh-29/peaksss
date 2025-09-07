import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from './config'
import { validateAndGetVideoInfo, searchYouTubeForSong, parseDuration } from './youtube-validator'

const genAI = new GoogleGenerativeAI(config.google.apiKey)

export interface SongSearchResult {
  videoId: string
  start: number
  end: number
  confidence: number
  title?: string
}

export async function findSongAndTimestamps(query: string): Promise<SongSearchResult> {
  const startTime = Date.now()
  
  // Check if it's already a YouTube URL
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = query.match(youtubeRegex)
  
  if (match) {
    console.log(`📋 LIFECYCLE START: Direct YouTube URL provided`)
    console.log(`🔗 Extracting video ID from URL: ${query}`)
    
    // If it's already a YouTube URL, validate and find timestamps
    const videoId = match[1]
    console.log(`🎯 Extracted video ID: ${videoId}`)
    
    const videoInfo = await validateAndGetVideoInfo(videoId)
    
    if (!videoInfo) {
      console.log(`❌ Video validation failed: not available or embeddable`)
      throw new Error('This YouTube video is not available or cannot be embedded')
    }
    
    console.log(`✅ Video validated: ${videoInfo.title}`)
    console.log(`⏱️  Video duration: ${videoInfo.duration} (${parseDuration(videoInfo.duration)}s)`)
    console.log(`🤖 Calling Gemini for timestamp detection...`)
    
    const timestamps = await findTimestampsForVideo(videoId, parseDuration(videoInfo.duration))
    
    const totalTime = Date.now() - startTime
    console.log(`✨ LIFECYCLE COMPLETE: Total time ${totalTime}ms`)
    console.log(`📊 Result: ${timestamps.start}s-${timestamps.end}s (confidence: ${timestamps.confidence})`)
    
    return {
      videoId,
      start: timestamps.start,
      end: timestamps.end,
      confidence: timestamps.confidence,
      title: videoInfo.title,
    }
  }

  // NEW WORKFLOW: YouTube Search First, then Gemini for timestamps
  console.log(`📋 LIFECYCLE START: Song search for "${query}"`)
  console.log(`🔍 Step 1: YouTube Search API (primary method)`)
  
  const searchStartTime = Date.now()
  const youtubeVideoIds = await searchYouTubeForSong(query)
  const searchTime = Date.now() - searchStartTime
  
  console.log(`⏱️  YouTube search completed in ${searchTime}ms`)
  console.log(`📋 Found ${youtubeVideoIds.length} potential videos`)
  
  if (youtubeVideoIds.length === 0) {
    console.log(`❌ No videos found via YouTube search`)
    throw new Error('Unable to find a valid video for this song')
  }

  // Take the first valid result (YouTube search already validates)
  const videoId = youtubeVideoIds[0]
  
  const validationStartTime = Date.now()
  const videoInfo = await validateAndGetVideoInfo(videoId)
  const validationTime = Date.now() - validationStartTime
  
  console.log(`⏱️  Video validation completed in ${validationTime}ms`)
  
  if (!videoInfo) {
    console.log(`❌ Video validation failed for: ${videoId}`)
    throw new Error('Selected video is not available or embeddable')
  }

  console.log(`✅ Selected video: ${videoInfo.title}`)
  console.log(`📺 Channel: ${videoInfo.channelTitle}`)
  console.log(`👁️  Views: ${parseInt(videoInfo.viewCount).toLocaleString()}`)
  console.log(`⏱️  Duration: ${videoInfo.duration} (${parseDuration(videoInfo.duration)}s)`)
  
  console.log(`🤖 Step 2: Gemini timestamp detection`)
  const geminiStartTime = Date.now()
  const timestamps = await findTimestampsForVideo(videoId, parseDuration(videoInfo.duration))
  const geminiTime = Date.now() - geminiStartTime
  
  console.log(`⏱️  Gemini timestamp detection completed in ${geminiTime}ms`)
  console.log(`🎯 Detected timestamps: ${timestamps.start}s - ${timestamps.end}s`)
  console.log(`📊 Confidence score: ${timestamps.confidence}`)
  
  const totalTime = Date.now() - startTime
  console.log(`✨ LIFECYCLE COMPLETE: Total time ${totalTime}ms`)
  console.log(`📈 Breakdown: Search(${searchTime}ms) + Validation(${validationTime}ms) + Gemini(${geminiTime}ms)`)
  
  return {
    videoId,
    start: timestamps.start,
    end: timestamps.end,
    confidence: timestamps.confidence,
    title: videoInfo.title,
  }
}

async function getGeminiSuggestion(query: string): Promise<{ videoIds: string[]; songInfo?: string }> {
  const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' })

  const prompt = `
You are a music expert. For the song query "${query}", provide 2-3 YouTube video IDs for the official music video or audio.

IMPORTANT:
- Only suggest REAL YouTube video IDs that exist
- Prefer official music videos from the artist's channel
- Avoid live performances, covers, or unofficial uploads
- Each video ID should be exactly 11 characters (letters, numbers, underscore, hyphen only)
- Focus on popular, well-known songs that definitely have official videos

Examples of real video IDs:
- "dQw4w9WgXcQ" (Never Gonna Give You Up)
- "kJQP7kiw5Fk" (Despacito)
- "JGwWNGJdvx8" (Shape of You)

Return JSON format:
{
  "videoIds": ["videoId1", "videoId2", "videoId3"],
  "songInfo": "Artist - Song Title"
}

If you're not confident about real video IDs, return empty array for videoIds.`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) {
      console.log('No JSON found in Gemini response')
      return { videoIds: [] }
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    // Validate video IDs format
    const validVideoIds = (parsed.videoIds || []).filter((id: string) => 
      typeof id === 'string' && 
      id.length === 11 && 
      /^[a-zA-Z0-9_-]+$/.test(id)
    )
    
    return {
      videoIds: validVideoIds,
      songInfo: parsed.songInfo,
    }
  } catch (error) {
    console.error('Gemini suggestion error:', error)
    return { videoIds: [] }
  }
}

async function findTimestampsForVideo(videoId: string, durationSeconds: number): Promise<{ start: number; end: number; confidence: number }> {
  const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' })
  
  console.log(`🎯 Requesting timestamps for ${durationSeconds}s video`)

  const prompt = `
For a song that is ${durationSeconds} seconds long, determine the start and end timestamps for the most famous/iconic part.

Rules:
- Return a 30-75 second segment that captures the best part
- For pop songs, this is often the main chorus or hook
- Avoid the first 20 seconds (intro) and last 20 seconds (outro)
- For songs under 2 minutes: focus on middle 30-60%
- For songs 2-4 minutes: focus on 25-75% range
- For songs over 4 minutes: focus on 30-70% range

Evidence (priority →):
1) YouTube "Most replayed" heatmap peak on the official/canonical upload.
2) Timestamped mentions: YouTube comments + Reddit/forums; weight by likes/upvotes, cluster ±5s.
3) Section labels/time-synced lyrics (Genius, Musixmatch, YouTube captions) to locate chorus/hook.
4) Streaming proxies: Spotify/Apple 30s preview alignment; SoundCloud timestamped comments; common short-video snippet if reliably time-aligned.
5) Fallback only if signals are sparse/contradictory: audio repetition/high-energy chorus-like section via simple MIR checks.

Method (brief):
- Collect candidate times from the Evidence; normalize, cluster (±5s), pick consensus peak.
- Center a 30–75s window there; if a Rule would be violated, slide minimally to comply.

Confidence (0.0–1.0):
- Increase with # of agreeing sources and tight clustering; decrease if large adjustments or MIR-only.

Return JSON:
{
  "start": number (seconds),
  "end": number (seconds),
  "confidence": number (0.0 to 1.0)
}
`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    console.log(`🤖 Gemini raw response: ${response.substring(0, 200)}...`)
    
    const jsonMatch = response.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) {
      console.log(`❌ No JSON found in Gemini response`)
      throw new Error('No JSON found in timestamp response')
    }
    
    console.log(`🎯 Extracted JSON: ${jsonMatch[0]}`)
    const parsed = JSON.parse(jsonMatch[0])
    
    // Validate timestamps
    let start = Math.max(0, parseInt(parsed.start) || 0)
    let end = Math.min(durationSeconds, parseInt(parsed.end) || start + 60)
    
    console.log(`⚙️  Raw timestamps: ${start}s - ${end}s`)
    
    // Ensure we have a reasonable segment
    if (end - start < 30) {
      end = Math.min(durationSeconds, start + 50)
      console.log(`🔧 Adjusted for minimum duration: ${start}s - ${end}s`)
    }
    
    console.log(`✅ Final timestamps: ${start}s - ${end}s (${end - start}s duration)`)
    
    return {
      start,
      end,
      confidence: parsed.confidence || 0.7,
    }
  } catch (error) {
    console.log(`❌ Gemini timestamp error: ${error.message}`)
    console.log(`🔄 Using smart fallback based on duration`)
    
    // Smart fallback based on duration
    const start = Math.floor(durationSeconds * 0.3) // Start at 30% through
    const end = Math.min(durationSeconds, start + 60) // 60-second segment
    
    console.log(`🎯 Fallback timestamps: ${start}s - ${end}s`)
    
    return {
      start,
      end,
      confidence: 0.6,
    }
  }
}