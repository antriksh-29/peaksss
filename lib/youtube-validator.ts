import { google } from 'googleapis'
import { config } from './config'

const youtube = google.youtube({
  version: 'v3',
  auth: config.youtube.apiKey,
})

export interface YouTubeVideoInfo {
  videoId: string
  title: string
  channelTitle: string
  duration: string
  viewCount: string
  isAvailable: boolean
  isEmbeddable: boolean
}

export async function validateAndGetVideoInfo(videoId: string): Promise<YouTubeVideoInfo | null> {
  try {
    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics', 'status'],
      id: [videoId],
    })

    const video = response.data.items?.[0]
    if (!video) {
      console.log(`Video ${videoId} not found`)
      return null
    }

    const isEmbeddable = video.status?.embeddable !== false
    const isAvailable = video.status?.uploadStatus === 'processed' && 
                       video.status?.privacyStatus === 'public'

    if (!isAvailable || !isEmbeddable) {
      console.log(`Video ${videoId} is not available or embeddable`)
      return null
    }

    return {
      videoId: video.id!,
      title: video.snippet?.title || '',
      channelTitle: video.snippet?.channelTitle || '',
      duration: video.contentDetails?.duration || 'PT0S',
      viewCount: video.statistics?.viewCount || '0',
      isAvailable: true,
      isEmbeddable: true,
    }
  } catch (error) {
    console.error('YouTube validation error:', error)
    return null
  }
}

export async function searchYouTubeForSong(query: string): Promise<string[]> {
  try {
    const searchResponse = await youtube.search.list({
      part: ['snippet'],
      q: `${query} official music video`,
      type: ['video'],
      maxResults: 5,
      safeSearch: 'none',
      relevanceLanguage: 'en',
      videoCategoryId: '10', // Music category
    })

    const videoIds = searchResponse.data.items?.map(item => item.id?.videoId).filter(Boolean) || []
    
    // Validate each video
    const validVideoIds: string[] = []
    for (const videoId of videoIds) {
      if (videoId) {
        const videoInfo = await validateAndGetVideoInfo(videoId)
        if (videoInfo) {
          validVideoIds.push(videoId)
        }
      }
    }

    return validVideoIds
  } catch (error) {
    console.error('YouTube search error:', error)
    return []
  }
}

export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  return hours * 3600 + minutes * 60 + seconds
}