/**
 * Generate UUID session ID, store in localStorage as 'peaksss-session'
 */
export function getSessionIdFromBrowser(): string {
  if (typeof window === "undefined") return ""

  let sessionId = localStorage.getItem("peaksss-session")
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem("peaksss-session", sessionId)
  }

  return sessionId
}