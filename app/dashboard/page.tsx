"use client"

import * as React from "react"
import { Loader2, RefreshCw, Download, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardRecord {
  sessionId: string
  songName: string
  timestamp: string
  responseTimeMs: number
  videoId?: string
  success: boolean
}

interface DashboardData {
  ok: boolean
  records: DashboardRecord[]
  totalRecords: number
}

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<string>("")

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard')
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }
      
      const result: DashboardData = await response.json()
      setData(result.records || [])
      setLastUpdated(new Date().toLocaleString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
      console.error('Dashboard fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCsv = () => {
    const headers = ['Session ID', 'Song Name', 'Timestamp', 'Response Time (ms)', 'Video ID', 'Success']
    const csvContent = [
      headers.join(','),
      ...data.map(record => [
        record.sessionId,
        `"${record.songName.replace(/"/g, '""')}"`,
        record.timestamp,
        record.responseTimeMs,
        record.videoId || '',
        record.success
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `peaksss-analytics-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600'
  }

  React.useEffect(() => {
    fetchData()
  }, [])

  const avgResponseTime = data.length > 0 
    ? Math.round(data.reduce((sum, record) => sum + record.responseTimeMs, 0) / data.length)
    : 0

  const successRate = data.length > 0 
    ? Math.round((data.filter(record => record.success).length / data.length) * 100)
    : 0

  const uniqueSessions = new Set(data.map(record => record.sessionId)).size

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
                <BarChart3 className="h-8 w-8" />
                <span className="animate-shimmer-rainbow">Peaksss Analytics</span>
              </h1>
              <p className="text-xl text-muted-foreground mt-2">
                Production analytics dashboard for peaksss.vercel.app
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={fetchData}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={exportToCsv}
                disabled={data.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg border-2 border-black shadow-lg">
            <h3 className="text-sm font-medium text-muted-foreground">Total Searches</h3>
            <p className="text-3xl font-bold mt-2">{data.length}</p>
          </div>
          <div className="bg-card p-6 rounded-lg border-2 border-black shadow-lg">
            <h3 className="text-sm font-medium text-muted-foreground">Unique Sessions</h3>
            <p className="text-3xl font-bold mt-2">{uniqueSessions}</p>
          </div>
          <div className="bg-card p-6 rounded-lg border-2 border-black shadow-lg">
            <h3 className="text-sm font-medium text-muted-foreground">Avg Response Time</h3>
            <p className="text-3xl font-bold mt-2">{avgResponseTime}ms</p>
          </div>
          <div className="bg-card p-6 rounded-lg border-2 border-black shadow-lg">
            <h3 className="text-sm font-medium text-muted-foreground">Success Rate</h3>
            <p className="text-3xl font-bold mt-2">{successRate}%</p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-lg">Loading analytics data...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800 font-medium">Error loading dashboard data:</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Data Table */}
        {!isLoading && !error && (
          <div className="bg-card rounded-lg border-2 border-black shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b-2 border-black">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Session ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Song Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Timestamp</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Response Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Video ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No analytics data found. Users may not have searched for songs yet.
                      </td>
                    </tr>
                  ) : (
                    data.map((record, index) => (
                      <tr key={`${record.sessionId}-${record.timestamp}-${index}`} className="hover:bg-muted/50">
                        <td className="px-6 py-4 text-sm font-mono">
                          {record.sessionId.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 text-sm font-medium max-w-xs truncate" title={record.songName}>
                          {record.songName}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {formatTimestamp(record.timestamp)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {record.responseTimeMs}ms
                        </td>
                        <td className="px-6 py-4 text-sm font-mono">
                          {record.videoId ? (
                            <a 
                              href={`https://youtube.com/watch?v=${record.videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {record.videoId}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className={`px-6 py-4 text-sm font-medium ${getStatusColor(record.success)}`}>
                          {record.success ? 'Success' : 'Failed'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}