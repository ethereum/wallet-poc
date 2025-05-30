export type ActivityTransaction = {
  txId: string
  userOpHash?: string
  network: string
  chainId: number
  submittedAt: string
  txns: { id: string; amount: number; status: string }[][] | null
  legends: {
    activities: LegendActivity[]
    totalXp: number | null
  }
  version: string | null
}
export type ActivityResponse = {
  transactions: ActivityTransaction[]
  totalTransactionCount: number
  totalPages: number
  currentPage: number
}
export type LegendActivity = {
  action: string
  xp: number
  labelText: string
}
