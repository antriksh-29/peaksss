"use client"

import { useState, useEffect } from "react"
import { getSessionIdFromBrowser } from "@/lib/session"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowUp } from "lucide-react"

export default function Home() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState("")

  useEffect(() => {
    // Get or create session ID on component mount
    setSessionId(getSessionIdFromBrowser())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || !sessionId) return
    
    setIsLoading(true)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: query.trim(),
          sessionId 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      // Redirect to results page
      window.location.href = `/play?videoId=${data.videoId}&start=${data.start}&end=${data.end}`
    } catch (error) {
      console.error('Search error:', error)
      alert('Unable to find that song. Please try a different search.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center text-center space-y-8 max-w-3xl px-6">
        {/* Main Heading */}
        <h1 className="text-7xl md:text-8xl font-bold text-foreground tracking-tight italic">
          Peaksss
        </h1>
        
        {/* Subheading */}
        <p className="text-2xl md:text-3xl text-muted-foreground font-medium">
          Just listen the peak part of your fav songs
        </p>

        {/* Search Box */}
        <div className="w-full max-w-2xl mt-12">
          <form onSubmit={handleSubmit}>
            <div className="relative bg-card rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <Input
                type="text"
                placeholder="About You by The 1975"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-16 px-6 pr-16 text-lg bg-transparent border-0 rounded-3xl placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isLoading}
              />
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-foreground hover:bg-foreground/90 text-background rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-background/20 border-t-background"></div>
                ) : (
                  <ArrowUp className="h-5 w-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
