export type WidgetMeal = { id: string; title: string; version: number }
export type DinnerSpin = {
  id: string
  widgetId: string
  mealId: string
  mealVersion: number
  meal: string
  actor: { id: number; name: string }
  occurredAt: string
}
export type DinnerResponse = 'agree' | 'another' | null
export type DinnerMember = {
  id: number
  name: string
  active: boolean
  choice: DinnerResponse
  version: number
  respondedAt: string | null
}
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'other'
export type DinnerPublication = {
  id: string
  spinId: string
  meal: string
  mealType: MealType
  current: boolean
  eatenAt: string | null
  eatenBy: { id: number; name: string } | null
  forDate: string
  publishedAt: string
  publisher: { id: number; name: string }
  members: DinnerMember[]
}
export type FamilyWidget = {
  id: string
  kind: 'dinner-spinner'
  title: string
  visibility: 'private' | 'family'
  owner: { id: number; name: string }
  version: number
  hidden: boolean
  createdAt: string
  updatedAt: string
  meals: WidgetMeal[]
  spins: DinnerSpin[]
  publications: DinnerPublication[]
}
export type WidgetDraft = {
  title: string
  visibility: 'private' | 'family'
  meals: { id?: string; title: string }[]
}
export type WidgetsSnapshot = {
  ownerId: number
  widgets: FamilyWidget[]
  selectedSpin?: DinnerSpin | null
}
export type WidgetWrite = {
  action:
    'add' | 'edit' | 'spin' | 'remove' | 'remove-meal' | 'hide' | 'publish' | 'respond' | 'eaten'
  body: object
}
