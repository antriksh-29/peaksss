"use client"

import { useState, useEffect } from "react"
import { getSessionIdFromBrowser } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { Search } from "lucide-react"

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
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="absolute top-0 right-0 p-6 z-10">
        <ThemeToggle />
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-2xl text-center space-y-8">
          {/* Logo/Title */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-bold text-foreground tracking-tight">
              Peaksss
            </h1>
            <p className="text-xl text-muted-foreground font-light">
              Jump to the peak part of any song
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="About You by The 1975"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-14 pl-12 pr-4 text-lg border-2 rounded-full bg-card/50 backdrop-blur-sm focus:bg-card transition-all duration-200"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              size="lg" 
              className="h-12 px-8 rounded-full text-base font-medium bg-primary hover:bg-primary/90 transition-all duration-200"
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
                  Finding the peak...
                </>
              ) : (
                'Find Peak Part'
              )}
            </Button>
          </form>

          {/* Subtle Footer */}
          <p className="text-sm text-muted-foreground/60 mt-16">
            Powered by Gemini AI
          </p>
        </div>
      </main>
    </div>
  )
}
