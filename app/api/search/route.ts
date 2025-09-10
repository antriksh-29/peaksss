import { type NextRequest, NextResponse } from "next/server"

const API_BASE = "https://peaksss.vercel.app"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log("[v0] Search API called at:", new Date().toISOString())

  try {
    const parseStart = Date.now()
    const { query, sessionId } = await request.json()
    console.log("[v0] Request parsed in:", Date.now() - parseStart, "ms")

    if (!query || !sessionId) {
      console.log("[v0] Missing query or sessionId")
      return NextResponse.json({ error: "Query and sessionId are required" }, { status: 400 })
    }

    console.log("[v0] Making request to backend with query:", query, "sessionId:", sessionId)

    const fetchStart = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(`${API_BASE}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query.trim(),
        sessionId,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    console.log("[v0] Backend API responded in:", Date.now() - fetchStart, "ms")
    console.log("[v0] Backend response status:", response.status)

    if (!response.ok) {
      console.log("[v0] Backend API error:", response.status, response.statusText)
      throw new Error(`Backend API error: ${response.status}`)
    }

    const parseResponseStart = Date.now()
    const result = await response.json()
    console.log("[v0] Response parsed in:", Date.now() - parseResponseStart, "ms")
    console.log("[v0] Total request time:", Date.now() - startTime, "ms")
    console.log("[v0] Search result:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Search API error:", error)
    console.log("[v0] Total failed request time:", Date.now() - startTime, "ms")

    if (error.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout - please try again" }, { status: 408 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
