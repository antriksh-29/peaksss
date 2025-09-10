"use client"

import * as React from "react"
import { ArrowUp, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSessionIdFromBrowser } from "@/lib/get-session-id-from-browser"

interface SearchFormProps {
  placeholder?: string
  onSearch?: (query: string) => void
  onSearchComplete?: (result: {
    videoId: string
    start: number
    end: number
    confidence: number
    query: string
  }) => void
  className?: string
  isLoading?: boolean
}

const trackMetric = async (type: string, videoId: string) => {
  try {
    await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, videoId }),
    })
  } catch (error) {
    console.error("Metrics tracking failed:", error)
  }
}

export function SearchForm({
  placeholder = "about you by the 1975",
  onSearch,
  onSearchComplete,
  className = "",
  isLoading: externalLoading = false,
}: SearchFormProps) {
  const [query, setQuery] = React.useState("")
  const [isSearching, setIsSearching] = React.useState(false)

  const isLoading = externalLoading || isSearching

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isLoading) return

    setIsSearching(true)
    const startTime = Date.now()
    console.log("[v0] Search started at:", new Date().toISOString(), "for query:", query)

    if (onSearch) {
      onSearch(query)
    }

    try {
      const sessionId = getSessionIdFromBrowser()
      console.log("[v0] Session ID:", sessionId)

      const fetchStart = Date.now()
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          sessionId,
        }),
      })

      console.log("[v0] API response received in:", Date.now() - fetchStart, "ms")
      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] API error response:", errorText)
        throw new Error(`Search failed: ${response.status} - ${errorText}`)
      }

      const parseStart = Date.now()
      const result = await response.json()
      console.log("[v0] Response parsed in:", Date.now() - parseStart, "ms")
      console.log("[v0] Search result:", result)

      if (result.videoId) {
        const metricsStart = Date.now()
        await trackMetric("search", result.videoId)
        console.log("[v0] Metrics tracked in:", Date.now() - metricsStart, "ms")

        if (onSearchComplete) {
          console.log("[v0] Calling onSearchComplete with results")
          onSearchComplete({
            videoId: result.videoId,
            start: result.start,
            end: result.end,
            confidence: result.confidence,
            query: query.trim(),
          })
        }
      }

      console.log("[v0] Total search time:", Date.now() - startTime, "ms")
      setIsSearching(false)
    } catch (error) {
      console.error("[v0] Search error:", error)
      console.log("[v0] Total failed search time:", Date.now() - startTime, "ms")
      alert("sorry, we couldn't find the peak part of that song. please try another search.")
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className={`relative ${className}`}>
        <div className="relative">
          <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            className="h-16 pl-14 pr-16 text-lg rounded-2xl bg-card border-2 border-black hover:border-black/80 focus:border-black shadow-lg focus:shadow-xl transition-all duration-200 focus:ring-0 focus:ring-offset-0 placeholder:text-muted-foreground/60"
          />
          <Button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-2 top-2 w-12 h-12 rounded-xl bg-black hover:bg-black/90 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
            <span className="sr-only">Search</span>
          </Button>
        </div>
      </form>

      {isSearching && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <p className="ml-3 text-muted-foreground">finding the peak part of your song (takes ~30 sec - please sit tight)</p>
        </div>
      )}
    </div>
  )
}
