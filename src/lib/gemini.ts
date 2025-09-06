import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from './config'
import type { YouTubeSearchResult, YouTubeVideo } from './youtube'

const genAI = new GoogleGenerativeAI(config.google.apiKey)

export interface VideoSelectionResult {
  videoId: string
  reason: string
  confidence: number
}

export interface HighlightResult {
  found: boolean
  start: number
  end: number
  confidence: number
  method: string[]
  notes: string
}

export async function selectCanonicalVideo(
  query: { title: string; artist?: string; album?: string },
  candidates: YouTubeSearchResult[]
): Promise<VideoSelectionResult> {
  const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' })

  const systemPrompt = `You are a precise music search ranker. Prefer the official upload by the intended artist. Avoid live/covers/remixes unless the user explicitly asks. Return **JSON only**, no prose.`

  const userPrompt = JSON.stringify({
    query,
    candidates,
  })

  try {
    const result = await model.generateContent([
      { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
    ])

    const response = result.response.text()
    const parsed = JSON.parse(response) as VideoSelectionResult

    return parsed
  } catch (error) {
    console.error('Gemini video selection error:', error)
    // Fallback: select first video with highest view count
    const fallback = candidates.reduce((best, current) => 
      current.viewCount > best.viewCount ? current : best
    )
    return {
      videoId: fallback.videoId,
      reason: 'Fallback selection - highest view count',
      confidence: 0.5,
    }
  }
}

export async function findHighlight(video: YouTubeVideo, useProModel = false): Promise<HighlightResult> {
  const modelName = useProModel ? 'models/gemini-2.5-pro' : 'models/gemini-2.5-flash'
  const model = genAI.getGenerativeModel({ model: modelName })

  const systemPrompt = `You combine only the provided YouTube metadata and description text (no lyrics, no external sources) to select an **official** video and a single contiguous **[start,end)** in seconds representing the song's most famous part. **Do not assume it is a chorus.** Prefer labeled chapters; otherwise apply duration-based heuristics. Return **strict JSON** only.`

  const durationSeconds = parseDuration(video.duration)
  const userPrompt = JSON.stringify({
    video: {
      id: video.videoId,
      title: video.title,
      duration: durationSeconds,
      channel: video.channelTitle,
    },
    metadata: {
      description: video.description,
      viewCount: parseInt(video.viewCount),
    },
  })

  try {
    const result = await model.generateContent([
      { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
    ])

    const response = result.response.text()
    const parsed = JSON.parse(response) as HighlightResult

    // Validate the result
    if (parsed.start >= 0 && parsed.end > parsed.start && parsed.end <= durationSeconds) {
      return parsed
    }

    // Fallback highlight based on duration heuristics
    return getDurationBasedHighlight(durationSeconds)
  } catch (error) {
    console.error('Gemini highlight error:', error)
    return getDurationBasedHighlight(durationSeconds)
  }
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  return hours * 3600 + minutes * 60 + seconds
}

function getDurationBasedHighlight(durationSeconds: number): HighlightResult {
  // Duration-based heuristics for finding the "peak" part
  let start: number
  let end: number

  if (durationSeconds <= 120) {
    // Short songs: middle third
    start = Math.floor(durationSeconds * 0.33)
    end = Math.floor(durationSeconds * 0.67)
  } else if (durationSeconds <= 300) {
    // Medium songs: typically around 60-120 seconds in
    start = Math.floor(durationSeconds * 0.25)
    end = Math.min(start + 45, Math.floor(durationSeconds * 0.75))
  } else {
    // Long songs: focus on the middle portion
    start = Math.floor(durationSeconds * 0.3)
    end = Math.min(start + 60, Math.floor(durationSeconds * 0.7))
  }

  return {
    found: true,
    start,
    end,
    confidence: 0.6,
    method: ['duration_heuristic'],
    notes: 'Fallback duration-based highlight selection',
  }
}