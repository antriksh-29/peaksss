import { type NextRequest, NextResponse } from "next/server"
import { getSessionIdFromBrowser } from "@/lib/get-session-id-from-browser"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] ===== RECOMMEND API START =====")
    console.log("[v0] Recommend API called at:", new Date().toISOString())
    const startTime = Date.now()

    const requestBody = await request.text()
    console.log("[v0] Raw request body:", requestBody)

    let parsedBody
    try {
      parsedBody = JSON.parse(requestBody)
      console.log("[v0] Parsed request body:", JSON.stringify(parsedBody))
    } catch (parseError) {
      console.error("[v0] Failed to parse request body:", parseError)
      throw new Error("Invalid JSON in request body")
    }

    const { songTitle } = parsedBody
    console.log("[v0] Request parsed in:", Date.now() - startTime, "ms")
    console.log("[v0] Extracted songTitle:", songTitle)

    const sessionStartTime = Date.now()
    const sessionId = getSessionIdFromBrowser()
    console.log("[v0] Session ID generated in:", Date.now() - sessionStartTime, "ms")
    console.log("[v0] Session ID:", sessionId)

    const backendStartTime = Date.now()
    console.log("[v0] Making request to backend with songTitle:", songTitle, "sessionId:", sessionId)
    console.log("[v0] Backend URL: https://peaksss.vercel.app/api/recommend")

    const requestPayload = {
      songTitle,
      sessionId,
    }
    console.log("[v0] Request payload:", JSON.stringify(requestPayload))

    const response = await fetch("https://peaksss.vercel.app/api/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    })

    console.log("[v0] Backend API responded in:", Date.now() - backendStartTime, "ms")
    console.log("[v0] Backend response status:", response.status)
    console.log("[v0] Backend response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Backend error response:", errorText)
      console.error("[v0] Backend error status:", response.status)
      console.error("[v0] Backend error statusText:", response.statusText)

      let backendError = "Unknown backend error"
      try {
        const errorData = JSON.parse(errorText)
        backendError = errorData.error || errorData.message || "Backend returned error without details"
        console.error("[v0] Parsed backend error:", errorData)
      } catch (parseError) {
        console.error("[v0] Could not parse backend error response:", parseError)
        backendError = `Backend returned status ${response.status}: ${errorText}`
      }

      throw new Error(`Backend Error: ${backendError}`)
    }

    const parseStartTime = Date.now()
    const responseText = await response.text()
    console.log("[v0] Raw backend response:", responseText)

    let data
    try {
      data = JSON.parse(responseText)
      console.log("[v0] Parsed backend response:", JSON.stringify(data))
    } catch (parseError) {
      console.error("[v0] Failed to parse backend response:", parseError)
      console.error("[v0] Raw response that failed to parse:", responseText)
      throw new Error("Invalid JSON response from backend")
    }

    console.log("[v0] Response parsed in:", Date.now() - parseStartTime, "ms")
    console.log("[v0] Total request time:", Date.now() - startTime, "ms")
    console.log("[v0] ===== RECOMMEND API SUCCESS =====")

    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    console.error("[v0] ===== RECOMMEND API ERROR =====")
    console.error("[v0] Recommendation API error:", error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("[v0] ===== RECOMMEND API ERROR END =====")

    const errorMessage = error instanceof Error ? error.message : "Failed to get recommendation"

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        debug: {
          originalError: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
