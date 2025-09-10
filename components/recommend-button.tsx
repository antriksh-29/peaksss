"use client"

import * as React from "react"
import { Music } from "lucide-react"

interface RecommendButtonProps {
  songTitle: string
  onRecommendationComplete: (result: {
    videoId: string
    start: number
    end: number
    confidence: number
    query: string
  }) => void
  onRecommendationStart?: () => void
  isLoading?: boolean
}

export function RecommendButton({ songTitle, onRecommendationComplete, onRecommendationStart, isLoading: externalLoading }: RecommendButtonProps) {
  const [internalLoading, setInternalLoading] = React.useState(false)
  const isLoading = externalLoading || internalLoading

  const handleRecommend = async () => {
    setInternalLoading(true)
    onRecommendationStart?.()  // Call the loading state handler
    console.log("[v0] ===== RECOMMENDATION BUTTON START =====")
    console.log("[v0] Recommendation started at:", new Date().toISOString(), "for song:", songTitle)

    try {
      const startTime = Date.now()

      const requestPayload = {
        songTitle: songTitle,
      }
      console.log("[v0] Sending request payload:", JSON.stringify(requestPayload))
      console.log("[v0] Request URL: /api/recommend")

      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      })

      console.log("[v0] API response received in:", Date.now() - startTime, "ms")
      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response ok:", response.ok)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API error response:", errorText)
        console.error("[v0] Response status:", response.status)
        console.error("[v0] Response statusText:", response.statusText)
        throw new Error("Failed to get recommendation")
      }

      const parseStartTime = Date.now()
      const responseText = await response.text()
      console.log("[v0] Raw API response:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
        console.log("[v0] Parsed API response:", JSON.stringify(data))
      } catch (parseError) {
        console.error("[v0] Failed to parse API response:", parseError)
        console.error("[v0] Raw response that failed to parse:", responseText)
        throw new Error("Invalid JSON response from API")
      }

      console.log("[v0] Response parsed in:", Date.now() - parseStartTime, "ms")

      console.log("[v0] Checking response format...")
      console.log("[v0] data.ok:", data.ok)
      console.log("[v0] data.videoId:", data.videoId)
      console.log("[v0] data.success:", data.success)
      console.log("[v0] data.data:", data.data)

      if (data.ok && data.videoId) {
        console.log("[v0] Using direct backend response format")
        // Direct backend response format
        const result = {
          videoId: data.videoId,
          start: data.start,
          end: data.end,
          confidence: data.confidence,
          query: data.title || songTitle,
        }
        console.log("[v0] Calling onRecommendationComplete with:", JSON.stringify(result))
        onRecommendationComplete(result)
      } else if (data.success && data.data?.recommendation) {
        console.log("[v0] Using wrapped response format")
        // Wrapped response format
        const recommendation = data.data.recommendation
        const result = {
          videoId: recommendation.videoId,
          start: recommendation.start,
          end: recommendation.end,
          confidence: recommendation.confidence,
          query: recommendation.title || songTitle,
        }
        console.log("[v0] Calling onRecommendationComplete with:", JSON.stringify(result))
        onRecommendationComplete(result)
      } else {
        console.error("[v0] Invalid recommendation response format:", data)
        console.error("[v0] Expected either data.ok with data.videoId, or data.success with data.data.recommendation")
        throw new Error("Invalid recommendation response")
      }

      console.log("[v0] Total recommendation time:", Date.now() - startTime, "ms")
      console.log("[v0] ===== RECOMMENDATION BUTTON SUCCESS =====")
    } catch (err) {
      console.error("[v0] ===== RECOMMENDATION BUTTON ERROR =====")
      console.error("[v0] Recommendation error:", err)
      console.error("[v0] Error message:", err instanceof Error ? err.message : String(err))
      console.error("[v0] Error stack:", err instanceof Error ? err.stack : "No stack trace")
      console.error("[v0] ===== RECOMMENDATION BUTTON ERROR END =====")
      alert("sorry, we couldn't find a similar song. please try again.")
    } finally {
      setInternalLoading(false)
    }
  }

  return (
    <button
      onClick={handleRecommend}
      disabled={isLoading}
      className="w-full px-3 py-1.5 text-sm font-medium rounded-lg border border-muted-foreground/30 bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground shadow-sm transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
    >
      <Music className="w-4 h-4 text-muted-foreground" />
      <span className="animate-shimmer-rainbow">{isLoading ? "finding..." : "discover similar songs"}</span>
    </button>
  )
}
