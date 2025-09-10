import { Redis } from '@upstash/redis'
import { config } from './config'
import { SessionData, SearchRecord } from './session'

export const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
})

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key)
  } catch (error) {
    console.error('Redis GET error:', error)
    return null
  }
}

export async function setCache<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  } catch (error) {
    console.error('Redis SET error:', error)
  }
}

export async function incrementCounter(key: string): Promise<number> {
  try {
    return await redis.incr(key)
  } catch (error) {
    console.error('Redis INCR error:', error)
    return 0
  }
}

// Session Management Functions
export async function createOrUpdateSession(sessionId: string): Promise<void> {
  try {
    const sessionKey = `session:${sessionId}`
    const existing = await redis.get<SessionData>(sessionKey)
    
    const sessionData: SessionData = {
      sessionId,
      createdAt: existing?.createdAt || new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      searchCount: (existing?.searchCount || 0) + 1
    }
    
    // Store session data (expires in 24 hours)
    await redis.setex(sessionKey, 86400, JSON.stringify(sessionData))
    
    // Add to active sessions set (expires in 30 days)
    await redis.sadd('active_sessions', sessionId)
    await redis.expire('active_sessions', 2592000)
  } catch (error) {
    console.error('Redis session error:', error)
  }
}

export async function recordSearch(searchRecord: SearchRecord): Promise<void> {
  try {
    const searchKey = `search:${searchRecord.sessionId}:${Date.now()}`
    
    // Store individual search record (expires in 30 days)
    await redis.setex(searchKey, 2592000, JSON.stringify(searchRecord))
    
    // Add to session's search list
    const sessionSearchesKey = `session_searches:${searchRecord.sessionId}`
    await redis.lpush(sessionSearchesKey, searchKey)
    await redis.expire(sessionSearchesKey, 2592000)
    
    // Track unique songs globally
    if (searchRecord.songName) {
      await redis.sadd('unique_songs', searchRecord.songName)
      await redis.expire('unique_songs', 2592000)
    }
  } catch (error) {
    console.error('Redis search recording error:', error)
  }
}

export async function getSessionStats(): Promise<{
  totalSessions: number
  uniqueSongs: number
  totalSearches: number
}> {
  try {
    const totalSessions = await redis.scard('active_sessions') || 0
    const uniqueSongs = await redis.scard('unique_songs') || 0
    const totalSearches = await redis.get<number>('search_count') || 0
    
    return { totalSessions, uniqueSongs, totalSearches }
  } catch (error) {
    console.error('Redis stats error:', error)
    return { totalSessions: 0, uniqueSongs: 0, totalSearches: 0 }
  }
}

export async function getSessionData(sessionId: string): Promise<{
  session: SessionData | null
  searches: SearchRecord[]
}> {
  try {
    const sessionKey = `session:${sessionId}`
    const sessionSearchesKey = `session_searches:${sessionId}`
    
    const session = await redis.get<SessionData>(sessionKey)
    const searchKeys = await redis.lrange(sessionSearchesKey, 0, -1) || []
    
    const searches: SearchRecord[] = []
    for (const searchKey of searchKeys) {
      const searchRecord = await redis.get<SearchRecord>(searchKey)
      if (searchRecord) searches.push(searchRecord)
    }
    
    return { session, searches: searches.reverse() } // Most recent first
  } catch (error) {
    console.error('Redis session data error:', error)
    return { session: null, searches: [] }
  }
}