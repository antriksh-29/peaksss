"use client"

import * as React from "react"
import { SearchForm } from "@/components/search-form"

interface SearchResult {
  videoId: string
  start: number
  end: number
  confidence: number
  query: string
}

export default function HomePage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadingText, setLoadingText] = React.useState("")
  const [searchResult, setSearchResult] = React.useState<SearchResult | null>(null)

  const handleSearch = async (query: string) => {
    setIsLoading(true)
    setLoadingText("Finding the peak part of your song")
    setSearchResult(null) // Clear previous results
  }

  const handleSearchComplete = (result: SearchResult) => {
    setSearchResult(result)
    setIsLoading(false)
  }

  const handleListenAgain = () => {
    if (searchResult) {
      const iframe = document.querySelector("iframe") as HTMLIFrameElement
      if (iframe) {
        iframe.src = `https://www.youtube.com/embed/${searchResult.videoId}?start=${searchResult.start}&end=${searchResult.end}&autoplay=1&t=${Date.now()}`
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Main Content */}
      <div className="w-full max-w-5xl space-y-8 text-center z-10">
        {/* Logo/Title */}
        <div className="space-y-6">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight relative px-8 mx-auto">
            <span className="animate-shimmer-rainbow">Peaksss</span>
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Listen to the peak part of your fav songs
          </p>
        </div>

        {/* Search Form */}
        <div className="w-full max-w-2xl mx-auto">
          <SearchForm
            placeholder="About You by The 1975"
            onSearch={handleSearch}
            onSearchComplete={handleSearchComplete}
            isLoading={isLoading}
          />
        </div>

        {!searchResult && (
          <div className="pt-4 text-lg text-muted-foreground/80">
            <p>✨ AI finds and plays the best moment of any song of your choice</p>
          </div>
        )}

        {searchResult && !isLoading && (
          <div className="w-full max-w-4xl lg:max-w-3xl mx-auto mt-12 space-y-6">
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

            <div className="flex justify-center">
              <button
                onClick={handleListenAgain}
                className="px-4 py-2 text-base font-medium rounded-xl border-2 border-black bg-background hover:bg-muted shadow-sm hover:shadow-md transition-all duration-200"
              >
                <span className="animate-shimmer-rainbow">Listen Again</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}