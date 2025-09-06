import { google } from 'googleapis'
import { config } from './config'

const youtube = google.youtube({
  version: 'v3',
  auth: config.youtube.apiKey,
})

export interface YouTubeVideo {
  videoId: string
  title: string
  channelTitle: string
  description: string
  duration: string
  viewCount: string
  publishedAt: string
}

export interface YouTubeSearchResult {
  videoId: string
  title: string
  channel: string
  duration: number
  viewCount: number
}

export async function searchYouTube(query: string, maxResults = 10): Promise<YouTubeSearchResult[]> {
  try {
    const searchResponse = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults,
      safeSearch: 'none',
      relevanceLanguage: 'en',
    })

    const videoIds = searchResponse.data.items?.map(item => item.id?.videoId).filter(Boolean) || []
    
    if (videoIds.length === 0) return []

    const videosResponse = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: videoIds,
    })

    const videos = videosResponse.data.items?.map(video => {
      const duration = parseDuration(video.contentDetails?.duration || 'PT0S')
      return {
        videoId: video.id!,
        title: video.snippet?.title || '',
        channel: video.snippet?.channelTitle || '',
        duration,
        viewCount: parseInt(video.statistics?.viewCount || '0'),
      }
    }) || []

    return videos
  } catch (error) {
    console.error('YouTube search error:', error)
    throw new Error('YouTube API request failed')
  }
}

export async function getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
  try {
    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: [videoId],
    })

    const video = response.data.items?.[0]
    if (!video) return null

    return {
      videoId: video.id!,
      title: video.snippet?.title || '',
      channelTitle: video.snippet?.channelTitle || '',
      description: video.snippet?.description || '',
      duration: video.contentDetails?.duration || 'PT0S',
      viewCount: video.statistics?.viewCount || '0',
      publishedAt: video.snippet?.publishedAt || '',
    }
  } catch (error) {
    console.error('YouTube video details error:', error)
    return null
  }
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  return hours * 3600 + minutes * 60 + seconds
}