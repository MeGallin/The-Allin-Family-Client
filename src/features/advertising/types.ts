export type AdvertComposition = 'poster' | 'split' | 'image-led'
export type AdvertFormat = 'headline' | 'checklist' | 'process' | 'comparison'
export type AdvertFeature = {
  id: string
  title: string
  ctaId: string
  enabled: boolean
  weight: number
  expiresAt: string | null
  exclusions: string[]
  facts: { id: string; text: string }[]
}
export type AdvertConfig = {
  enabled: boolean
  paused: boolean
  manualApproval: boolean
  brand: { name: string; tone: string; exclusions: string[] }
  formats: AdvertFormat[]
  limits: { headline: number; message: number; item: number; maxItems: number }
  schedule: {
    mode: 'interval' | 'daily'
    intervalSeconds: number
    dailyAt: string
    timezone: string
    windowStart: string
    windowEnd: string
    idlePolicy: 'keep' | 'pause'
    idleSeconds: number
    preparationLeadSeconds: number
  }
  generation: {
    provider: 'openai'
    model: string
    effort: string
    maxOutputTokens: number
    timeoutSeconds: number
    retries: number
    backoffSeconds: number
  }
  review: { enabled: boolean; model: string; effort: string; maxOutputTokens: number }
  image: {
    layouts: AdvertComposition[]
    maxHeadlineWords: number
    enabled: boolean
    model: 'gpt-image-2.6-flare' | 'gpt-image-2.6-sunburst'
    quality: 'low' | 'medium' | 'high'
    complexity: 'low' | 'medium' | 'high'
    size: '1024x1024' | '1536x1024'
    timeoutSeconds: number
    promptStyle: string
    maxPromptCharacters: number
    reservationMicros: number
  }
  budget: {
    dailyImages: number
    monthlyImages: number
    dailyMicros: number
    monthlyMicros: number
    dailyCalls: number
    monthlyCalls: number
    dailyTokens: number
    monthlyTokens: number
  }
  prices: {
    checkedAt: string
    validDays: number
    models: Record<string, { input: number; output: number }>
  }
  features: AdvertFeature[]
}
export type AdvertPayload = {
  featureId: string
  ctaId: string
  format: AdvertFormat
  headline: string
  message: string
  scenario: string
  items: string[]
  factIds: string[]
  imageBrief?: string
  composition?: AdvertComposition
}
export type AdvertImage = {
  id: string
  width: number
  height: number
  bytes: number
  mime: 'image/jpeg'
}
export type AdvertRecord = {
  image?: AdvertImage
  id: string
  payload: AdvertPayload
  featureHash: string
  configRevision: number
  preparedAt: number
  approved: boolean
  promotedAt: number | null
  validUntil?: number | null
}
export type AdvertSnapshot = {
  version?: number
  enabled: boolean
  references: Record<string, string>
  current: AdvertRecord | null
  serverTime: number
}
export type AdvertAdmin = {
  version: number
  configRevision: number
  draftVersion: number
  config: AdvertConfig
  draft: AdvertConfig
  current: AdvertRecord | null
  candidate: AdvertRecord | null
  nextEligibleAt: number | null
  retryAt: number
  lastOutcome: string
  working: boolean
  provider: 'openai'
  credentials: { bridgeConfigured: boolean }
  models: Record<
    string,
    { efforts: string[]; inputPrice: number; outputPrice: number; priceCheckedAt: string }
  >
  usage: Record<
    string,
    { micros: number; calls: number; tokens: number; images?: number; imageTokens?: number }
  >
  audit: { event: string; at: number; revision: number; fence: number; actorId: number | null }[]
  excludedProposals: string[]
}
