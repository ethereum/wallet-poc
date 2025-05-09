type LeaderboardEntry = {
  entries: Array<{
    rank: number
    account: string
    level: number
    xp: number
    weight: number
    image: string
    image_avatar: string
  }>
  currentUser: {
    rank: number
    account: string
    level: number
    xp: number
    weight: number
    image: string
    image_avatar: string
  }
}

interface LeaderboardResponse {
  leaderboard: Array<LeaderboardEntry>
  currentUser: LeaderboardEntry
  fullLeaderboard: LeaderboardEntry
  season0Leaderboard: LeaderboardEntry
  season1Leaderboard: LeaderboardEntry
}

export type { LeaderboardEntry, LeaderboardResponse }
