export type WhereItem = {
  id: string
  widgetId: string
  title: string
  location: string
  note: string
  photoKey: string | null
  version: number
  updatedAt: string
}
export type WhereSnapshot = { ownerId: number; items: WhereItem[] }
export type WhereWrite = { action: 'add' | 'edit' | 'remove'; body: object; photo?: File }
export const wherePhoto = (item: WhereItem) =>
  apiUrl('/where-is-it/photo?id=' + item.id + '&v=' + item.photoKey)
import { apiUrl } from '../../services/api-client'
