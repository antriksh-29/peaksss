"use client"

import * as React from "react"
import { Home, TrendingUp, TrendingDown, Music, Play, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SearchRecord {
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

interface DashboardStats {
  metrics: {
    total: {
      searches: number
      plays: number
      conversionRate: number
      uniqueSessions: number
    }
    today: {
      searches: number
      plays: number
      date: string
    }
    growth: {
      searches: number
      plays: number
    }
  }
  sessions: SearchRecord[]
}

export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard')
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`failed to fetch dashboard data: ${response.status} - ${errorText}`)
        }
        const data = await response.json()
        if (data.success && data.data) {
          // Validate data structure before setting
          const validData = {
            metrics: data.data.metrics || {
              total: { searches: 0, plays: 0, conversionRate: 0, uniqueSessions: 0 },
              today: { searches: 0, plays: 0, date: new Date().toISOString().split('T')[0] },
              growth: { searches: 0, plays: 0 }
            },
            sessions: Array.isArray(data.data.sessions) ? data.data.sessions : []
          }
          setStats(validData)
        } else {
          throw new Error(data.error || 'invalid response format')
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
        setError(err instanceof Error ? err.message : 'unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const handleGoHome = () => {
    window.location.href = "/"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="flex justify-center items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          <span className="ml-3 text-muted-foreground">loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">dashboard unavailable</h1>
          <p className="text-muted-foreground leading-relaxed">
            {error}
          </p>
          <Button onClick={handleGoHome} className="mt-6 bg-primary hover:bg-primary/90">
            <Home className="w-4 h-4 mr-2" />
            go home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">peaksss dashboard</h1>
            <p className="text-muted-foreground mt-2">analytics and insights for your music discovery platform</p>
          </div>
          <Button onClick={handleGoHome} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            back to home
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Searches */}
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">total searches</p>
                <p className="text-2xl font-bold">{stats?.metrics?.total?.searches?.toLocaleString() || '0'}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-muted-foreground">today: {stats?.metrics?.today?.searches || 0}</span>
              {stats && stats.metrics?.growth?.searches !== 0 && (
                <div className={`ml-2 flex items-center ${stats.metrics?.growth?.searches > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.metrics?.growth?.searches > 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  <span>{Math.abs(stats.metrics?.growth?.searches || 0)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Total Plays */}
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">total plays</p>
                <p className="text-2xl font-bold">{stats?.metrics?.total?.plays?.toLocaleString() || '0'}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-muted-foreground">today: {stats?.metrics?.today?.plays || 0}</span>
              {stats && stats.metrics?.growth?.plays !== 0 && (
                <div className={`ml-2 flex items-center ${stats.metrics?.growth?.plays > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.metrics?.growth?.plays > 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  <span>{Math.abs(stats.metrics?.growth?.plays || 0)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Unique Sessions */}
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">unique sessions</p>
                <p className="text-2xl font-bold">{stats?.metrics?.total?.uniqueSessions?.toLocaleString() || '0'}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-muted-foreground">conversion: {stats?.metrics?.total?.conversionRate || 0}%</span>
            </div>
          </div>

          {/* Today's Activity */}
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">today's activity</p>
                <p className="text-2xl font-bold">{(stats?.metrics?.today?.searches || 0) + (stats?.metrics?.today?.plays || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-muted-foreground">{stats?.metrics?.today?.date || new Date().toISOString().split('T')[0]}</span>
            </div>
          </div>
        </div>

        {/* Session Activity Table */}
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">recent session activity</h3>
            <p className="text-sm text-muted-foreground mt-1">latest searches and recommendations</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left p-4 font-medium">session id</th>
                  <th className="text-left p-4 font-medium">youtube title</th>
                  <th className="text-left p-4 font-medium">video id</th>
                  <th className="text-left p-4 font-medium">time (ms)</th>
                  <th className="text-left p-4 font-medium">timestamp</th>
                </tr>
              </thead>
              <tbody>
                {stats?.sessions?.map((record, index) => (
                  <tr key={`${record?.sessionId || index}-${record?.timestamp || index}`} className="border-b hover:bg-muted/20">
                    <td className="p-4 font-mono text-xs">
                      {record?.sessionId?.slice(0, 8) || 'unknown'}...
                    </td>
                    <td className="p-4 max-w-xs truncate">
                      {record?.youtubeTitle || record?.songName || '-'}
                    </td>
                    <td className="p-4 font-mono text-xs">
                      {record?.videoId ? (
                        <a 
                          href={`https://youtube.com/watch?v=${record.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {record.videoId.slice(0, 11)}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {record?.responseTimeMs?.toLocaleString() || '0'}
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">
                      {record?.timestamp ? new Date(record.timestamp).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
                {(!stats?.sessions || stats.sessions.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      no session data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">quick actions</h3>
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleGoHome} className="bg-primary hover:bg-primary/90">
              <Music className="w-4 h-4 mr-2" />
              discover music
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              refresh data
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>peaksss analytics dashboard - real-time music discovery insights</p>
        </div>
      </div>
    </div>
  )
}