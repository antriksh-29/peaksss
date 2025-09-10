"use client"

import * as React from "react"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ExternalLink, RotateCcw, Home } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { SearchForm } from "@/components/search-form"
import { Button } from "@/components/ui/button"
import { getSessionIdFromBrowser } from "@/lib/get-session-id-from-browser"

const trackMetric = async (type: string, videoId: string) => {
  try {
    await fetch("https://peaksss.vercel.app/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, videoId }),
    })
  } catch (error) {
    console.error("Metrics tracking failed:", error)
  }
}

const searchSong = async (query: string) => {
  const response = await fetch("https://peaksss.vercel.app/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: query.trim(),
      sessionId: getSessionIdFromBrowser(),
    }),
  })
  return response.json()
}

function PlayPageContent() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get("videoId")
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  const [isLoading, setIsLoading] = React.useState(false)
  const [hasTrackedPlay, setHasTrackedPlay] = React.useState(false)

  React.useEffect(() => {
    if (videoId && !hasTrackedPlay) {
      trackMetric("play_start", videoId)
      setHasTrackedPlay(true)
    }
  }, [videoId, hasTrackedPlay])

  const handleNewSearch = async (query: string) => {
    setIsLoading(true)
    try {
      console.log("[v0] Starting new search from play page:", query)
      const result = await searchSong(query)
      console.log("[v0] Search result from play page:", result)

      if (result.ok) {
        // Navigate to new play page with results
        const newUrl = `/play?videoId=${result.videoId}&start=${result.start}&end=${result.end}&query=${encodeURIComponent(query)}`
        console.log("[v0] Navigating to new results:", newUrl)
        window.location.href = newUrl
      } else {
        console.error("Search failed:", result.error)
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Search error:", error)
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleWatchFull = () => {
    if (videoId) {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank")
    }
  }

  const handleGoHome = () => {
    window.location.href = "/"
  }

  if (!videoId || !start || !end) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
            <span className="text-3xl">🎵</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">oops! missing song data</h1>
          <p className="text-muted-foreground leading-relaxed">
            it looks like you arrived here without searching for a song. let's get you back to discovering music!
          </p>
          <Button onClick={handleGoHome} className="mt-6 bg-primary hover:bg-primary/90">
            <Home className="w-4 h-4 mr-2" />
            go home
          </Button>
        </div>
      </div>
    )
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?start=${start}&end=${end}&autoplay=1&controls=1&rel=0&modestbranding=1`

  return (
    <div className="min-h-screen bg-background p-6 relative">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto space-y-8 pt-20">
        <div className="flex items-center justify-between mb-4">
          <Button onClick={handleGoHome} variant="ghost" className="text-muted-foreground hover:text-foreground">
            <Home className="w-4 h-4 mr-2" />
            back to home
          </Button>
        </div>

        {/* Search Form */}
        <div className="w-full max-w-2xl mx-auto">
          <SearchForm placeholder="search another song..." onSearch={handleNewSearch} isLoading={isLoading} />

          {isLoading && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <p className="ml-3 text-muted-foreground">finding the peak part of your song</p>
              </div>
              <span className="text-muted-foreground/60 text-sm">(takes ~30 sec - please sit tight 🥲)</span>
            </div>
          )}
        </div>

        {/* Video Player */}
        <div className="w-full max-w-4xl mx-auto">
          <div className="aspect-video rounded-2xl shadow-2xl overflow-hidden bg-card border border-border/50 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none"></div>
            <iframe
              src={embedUrl}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full relative z-10"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button
            onClick={handleWatchFull}
            variant="outline"
            className="flex items-center gap-2 h-12 px-6 bg-card hover:bg-accent border-border hover:border-primary/20 transition-all"
          >
            <ExternalLink className="h-4 w-4" />
            watch full video on youtube
          </Button>

          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center gap-2 h-12 px-6 bg-card hover:bg-accent border-border hover:border-secondary/20 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            play song again
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="flex justify-center items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          </div>
        </div>
      }
    >
      <PlayPageContent />
    </Suspense>
  )
}
