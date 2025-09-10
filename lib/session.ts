import { v4 as uuidv4 } from 'uuid'

export interface SessionData {
  sessionId: string
  createdAt: string
  lastActiveAt: string
  searchCount: number
}

export interface SearchRecord {
  sessionId: string
  query: string
  songName?: string
  videoId?: string
  responseTimeMs: number
  timestamp: string
  success: boolean
  searchType: 'search' | 'recommendation'
  youtubeTitle?: string
}

export function generateSessionId(): string {
  return uuidv4()
}

export function getSessionIdFromBrowser(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = sessionStorage.getItem('peaksss-session-id')
  if (!sessionId) {
    sessionId = generateSessionId()
    sessionStorage.setItem('peaksss-session-id', sessionId)
  }
  return sessionId
}

export function createSearchRecord(
  sessionId: string,
  query: string,
  responseTimeMs: number,
  searchType: 'search' | 'recommendation' = 'search',
  songName?: string,
  videoId?: string,
  youtubeTitle?: string,
  success: boolean = true
): SearchRecord {
  return {
    sessionId,
    query,
    songName,
    videoId,
    responseTimeMs,
    timestamp: new Date().toISOString(),
    success,
    searchType,
    youtubeTitle
  }
}