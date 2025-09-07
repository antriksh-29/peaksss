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
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Back Button - Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          className="text-muted-foreground hover:text-foreground rounded-full"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <main className="flex flex-col items-center justify-center min-h-screen px-6 pt-20">
        {/* Video Player */}
        <div className="w-full max-w-4xl">
          <div className="bg-card rounded-3xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
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
        </div>

        {/* Search Box */}
        <div className="w-full max-w-2xl mt-12">
          <form onSubmit={handleNewSearch}>
            <div className="relative bg-card rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <Input
                type="text"
                placeholder="Search another song..."
                value={newSearch}
                onChange={(e) => setNewSearch(e.target.value)}
                className="h-16 px-6 pr-16 text-lg bg-transparent border-0 rounded-3xl placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isSearching}
              />
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSearching || !newSearch.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-foreground hover:bg-foreground/90 text-background rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-background/20 border-t-background"></div>
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </button>
            </div>
          </form>
        </div>

        {/* External Link */}
        <div className="mt-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`https://youtube.com/watch?v=${videoId}`, '_blank')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Watch Full Video on YouTube
          </Button>
        </div>
      </main>
    </div>
  )
}