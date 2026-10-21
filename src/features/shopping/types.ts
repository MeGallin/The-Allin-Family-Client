export type Actor = { id: number; displayName: string }
export type ShoppingItem = {
  id: string
  title: string
  checked: boolean
  important: boolean
  version: number
  createdBy: Actor
  updatedBy: Actor
  createdAt: string
  updatedAt: string
}
export type ShoppingActivity = {
  id: string
  itemId: string
  action: 'created' | 'edited' | 'checked' | 'unchecked' | 'removed'
  actor: Actor
  occurredAt: string
  before: { title: string; checked: boolean; important?: boolean } | null
  after: { title: string; checked: boolean; important?: boolean } | null
}
export type ShoppingSnapshot = { items: ShoppingItem[]; activity: ShoppingActivity[] }
