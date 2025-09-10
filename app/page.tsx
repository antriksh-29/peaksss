"use client"

import * as React from "react"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { SearchForm } from "@/components/search-form"
import { ShareButton } from "@/components/share-button"
import { RecommendButton } from "@/components/recommend-button"
import { Toast } from "@/components/ui/toast"
import { Headphones } from "lucide-react"

interface SearchResult {
  videoId: string
  start: number
  end: number
  confidence: number
  query: string
}

function HomePageContent() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadingText, setLoadingText] = React.useState("")
  const [searchResult, setSearchResult] = React.useState<SearchResult | null>(null)
  const [showToast, setShowToast] = React.useState(false)
  const [isRecommendation, setIsRecommendation] = React.useState(false)

  React.useEffect(() => {
    const videoId = searchParams.get("v")
    const start = searchParams.get("start")
    const end = searchParams.get("end")
    const query = searchParams.get("q")

    if (videoId && start && end && query) {
      // Auto-load shared video
      setSearchResult({
        videoId,
        start: Number.parseInt(start),
        end: Number.parseInt(end),
        confidence: 1, // Default confidence for shared links
        query: decodeURIComponent(query),
      })
    }
  }, [searchParams])

  const handleSearch = async (query: string) => {
    setIsLoading(true)
    setLoadingText("finding the peak part of your song")
    setSearchResult(null) // Clear previous results
  }

  const handleSearchComplete = (result: SearchResult) => {
    setSearchResult(result)
    setIsLoading(false)
    setIsRecommendation(false)
  }

  const handleListenAgain = () => {
    if (searchResult) {
      const iframe = document.querySelector("iframe") as HTMLIFrameElement
      if (iframe) {
        iframe.src = `https://www.youtube.com/embed/${searchResult.videoId}?start=${searchResult.start}&end=${searchResult.end}&autoplay=1&t=${Date.now()}`
      }
    }
  }

  const handleShare = () => {
    setShowToast(true)
  }

  const handleRecommendationComplete = (result: SearchResult) => {
    setSearchResult(result)
    setIsRecommendation(true)
    setIsLoading(false)

    // Auto-update the iframe with new recommendation
    setTimeout(() => {
      const iframe = document.querySelector("iframe") as HTMLIFrameElement
      if (iframe) {
        iframe.src = `https://www.youtube.com/embed/${result.videoId}?start=${result.start}&end=${result.end}&autoplay=1`
      }
    }, 100)
  }

  const handleRecommendationStart = () => {
    setIsLoading(true)
    setLoadingText("finding your next favourite song")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Main Content */}
      <div className="w-full max-w-5xl space-y-8 text-center z-10">
        {/* Logo/Title */}
        <div className="space-y-6">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight relative px-8 mx-auto">
            <span className="animate-shimmer-rainbow">peaksss</span>
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            listen to the peak part of your fav songs
          </p>
        </div>

        {/* Search Form */}
        <div className="w-full max-w-2xl mx-auto">
          <SearchForm
            placeholder="about you by the 1975"
            onSearch={handleSearch}
            onSearchComplete={handleSearchComplete}
            isLoading={isLoading}
          />
        </div>

        {showToast && (
          <div className="flex justify-center">
            <Toast message="Link copied to clipboard!" type="success" onClose={() => setShowToast(false)} />
          </div>
        )}

        {!searchResult && (
          <div className="pt-4 text-lg text-muted-foreground/80">
            <p>✨ ai finds and plays the best moment of any song of your choice</p>
          </div>
        )}

        {searchResult && !isLoading && (
          <div className="w-full max-w-4xl lg:max-w-3xl mx-auto mt-12 space-y-6">
            {isRecommendation && (
              <div className="text-sm text-muted-foreground/80 mb-2">
                <span className="bg-primary/10 px-2 py-1 rounded-full">recommended for you</span>
              </div>
            )}

            {/* YouTube Embed - reduced to 80% size on desktop */}
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${searchResult.videoId}?start=${searchResult.start}&end=${searchResult.end}&autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="flex justify-center">
                <RecommendButton
                  songTitle={searchResult.query}
                  onRecommendationComplete={handleRecommendationComplete}
                  onRecommendationStart={handleRecommendationStart}
                  isLoading={isLoading}
                />
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={handleListenAgain}
                  className="px-2 py-1 text-xs font-medium rounded-lg border border-muted-foreground/30 bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4" />
                    listen again
                  </div>
                </button>

                <div className="text-xs">
                  <ShareButton
                    videoId={searchResult.videoId}
                    start={searchResult.start}
                    end={searchResult.end}
                    songName={searchResult.query}
                    onShare={handleShare}
                  />
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                </div>
                <span className="text-muted-foreground">{loadingText}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-5xl space-y-8 text-center">
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight relative px-8 mx-auto">
                <span className="animate-shimmer-rainbow">peaksss</span>
              </h1>
              <p className="text-2xl md:text-3xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                listen to the peak part of your fav songs
              </p>
            </div>
            <div className="flex justify-center items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  )
}
