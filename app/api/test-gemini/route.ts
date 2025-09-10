import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const { songTitle } = await request.json()
    
    if (!songTitle) {
      return NextResponse.json({ error: 'songTitle required' }, { status: 400 })
    }

    console.log('🔵 Testing Gemini API connection for:', songTitle)
    
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY not found')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' })

    const testPrompt = `
You are a music expert. For the song "${songTitle}", provide 2 similar songs.

Return JSON format:
{
  "recommendations": [
    {
      "song": "Song Title",
      "artist": "Artist Name", 
      "confidence": 0.95
    }
  ]
}
`

    console.log('🔵 Calling Gemini API...')
    const result = await model.generateContent(testPrompt)
    const response = result.response.text()
    
    console.log('🔵 Gemini response received:', response.substring(0, 200))
    
    return NextResponse.json({
      success: true,
      originalSong: songTitle,
      geminiResponse: response,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('🔴 Gemini test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}