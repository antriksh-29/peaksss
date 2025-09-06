"use client"

import { useEffect, useState } from 'react'
import { getSessionIdFromBrowser } from '@/lib/session'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Search, ExternalLink } from 'lucide-react'

export default function PlayPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const videoId = searchParams.get('videoId')
  const start = parseInt(searchParams.get('start') || '0')
  const end = parseInt(searchParams.get('end') || '0')
  
  const [newSearch, setNewSearch] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    setSessionId(getSessionIdFromBrowser())
  }, [])

  const handleNewSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSearch.trim() || !sessionId) return
    
    setIsSearching(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: newSearch.trim(),
          sessionId 
        }),
      })

      const data = await response.json()
      if (response.ok) {
        window.location.href = `/play?videoId=${data.videoId}&start=${data.start}&end=${data.end}`
      } else {
        alert('Unable to find that song. Please try a different search.')
      }
    } catch (error) {
      alert('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handlePlayerReady = () => {
    // Track play_start metric
    if (videoId) {
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'play_start',
          videoId,
        }),
      }).catch(console.error)
    }
  }

  if (!videoId || !start || !end) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Invalid video parameters</p>
          <Button onClick={() => router.push('/')}>
            Back to Search
          </Button>
        </div>
      </div>
    )
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?start=${start}&end=${end}&autoplay=1&controls=1&rel=0&modestbranding=1`

  return (
    <div className="min-h-screen bg-background">
      {/* Clean Header */}
      <header className="border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="h-4 w-px bg-border mx-2" />
            <h1 className="font-semibold text-foreground">Peaksss</h1>
          </div>
          
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Video Player */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-xl border border-border/50">
          <div className="aspect-video bg-black">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={handlePlayerReady}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 items-center justify-between">
          {/* New Search */}
          <form onSubmit={handleNewSearch} className="flex gap-2 w-full max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search another song..."
                value={newSearch}
                onChange={(e) => setNewSearch(e.target.value)}
                className="pl-10 rounded-full bg-card/50 border-border/50 focus:bg-card"
                disabled={isSearching}
              />
            </div>
            <Button 
              type="submit" 
              size="default"
              disabled={!newSearch.trim() || isSearching}
              className="rounded-full px-6"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>

          {/* External Link */}
          <Button
            variant="outline"
            size="default"
            onClick={() => window.open(`https://youtube.com/watch?v=${videoId}`, '_blank')}
            className="rounded-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Full Video
          </Button>
        </div>
      </main>
    </div>
  )
}