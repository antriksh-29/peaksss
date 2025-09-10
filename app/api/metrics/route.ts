import { type NextRequest, NextResponse } from "next/server"

const API_BASE = "https://peaksss.vercel.app"

export async function POST(request: NextRequest) {
  try {
    const { type, videoId } = await request.json()

    if (!type || !videoId) {
      return NextResponse.json({ error: "Type and videoId are required" }, { status: 400 })
    }

    // Call the deployed Peaksss metrics API
    const response = await fetch(`${API_BASE}/api/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, videoId }),
    })

    if (!response.ok) {
      throw new Error(`Metrics API error: ${response.status}`)
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Metrics API error:", error)
    return NextResponse.json({ error: "Metrics tracking failed" }, { status: 500 })
  }
}
