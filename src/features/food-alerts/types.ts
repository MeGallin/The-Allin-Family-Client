export type FoodAlert = {
  id: string
  title: string
  publishedAt: string
  url: string
  kind: 'recall' | 'allergy' | 'food-alert'
  details?: {
    products: {
      name: string
      packSize: string | null
      productCode: string | null
      batches: { batchCode: string | null; bestBefore: string | null; useBy: string | null }[]
    }[]
    riskStatements: string[]
    consumerAdvice: string | null
  }
}

export type FoodAlertsFeed = {
  status: 'ready' | 'stale' | 'unavailable'
  updatedAt: string | null
  data: FoodAlert[] | null
}
