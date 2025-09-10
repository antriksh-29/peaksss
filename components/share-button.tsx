"use client"

import * as React from "react"
import { Share2, Check, Copy } from "lucide-react"

interface ShareButtonProps {
  videoId: string
  start: number
  end: number
  songName: string
  onShare?: () => void
}

export function ShareButton({ videoId, start, end, songName, onShare }: ShareButtonProps) {
  const [isSharing, setIsSharing] = React.useState(false)
  const [justShared, setJustShared] = React.useState(false)
  const [actualSongTitle, setActualSongTitle] = React.useState<string>(songName)

  React.useEffect(() => {
    const fetchVideoTitle = async () => {
      try {
        // Use YouTube oEmbed API to get video title
        const response = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        )
        if (response.ok) {
          const data = await response.json()
          if (data.title) {
            setActualSongTitle(data.title)
          }
        }
      } catch (error) {
        console.error("Failed to fetch video title:", error)
        // Keep using the search query as fallback
      }
    }

    fetchVideoTitle()
  }, [videoId])

  const handleShare = async () => {
    setIsSharing(true)

    try {
      // Create shareable link
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://peaksss.com"
      const shareableLink = `${baseUrl}/?v=${videoId}&start=${start}&end=${end}&q=${encodeURIComponent(songName)}`

      const clipboardMessage = `I just used Peaksss to listen to the best part of "${actualSongTitle}". You should also give it a listen - ${shareableLink}`

      // Copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(clipboardMessage)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea")
        textArea.value = clipboardMessage
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
      }

      setJustShared(true)
      if (onShare) onShare()

      // Reset the success state after 2 seconds
      setTimeout(() => setJustShared(false), 2000)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      // Could show error toast here if needed
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className="px-3 py-1.5 text-sm font-medium rounded-lg border border-muted-foreground/30 bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground shadow-sm transition-all duration-200 disabled:opacity-50"
    >
      <span className="flex items-center gap-2">
        {isSharing ? (
          <Copy className="h-4 w-4 animate-pulse" />
        ) : justShared ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        <span>{isSharing ? "Copying..." : justShared ? "Copied!" : "Share"}</span>
      </span>
    </button>
  )
}
