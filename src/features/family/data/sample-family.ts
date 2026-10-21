import coastalIllustration from '../../../assets/coastal-memory.svg'
import type { FamilyEvent, FamilyMemory, ShoppingItem } from '../types'

function inDays(days: number, hour: number, minute = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

// Deliberate preview fixtures. No invented events are sent to the PHP API.
export function createSampleFamilyData(): {
  memories: FamilyMemory[]
  events: FamilyEvent[]
  shopping: ShoppingItem[]
} {
  return {
    memories: [
      {
        id: 'sample-memory',
        title: 'Sunday by the sea.',
        caption:
          'The little things worth keeping. This illustrated example will make way for your family’s own photos.',
        imageUrl: coastalIllustration,
        imageAlt: 'An illustrated blue coastline beneath a pale sun',
        author: 'The family',
        sample: true,
        reactions: 4,
        liked: false,
      },
    ],
    events: [
      {
        id: 'sample-shop',
        title: 'Food shop',
        startsAt: inDays(2, 10),
        detail: 'Take the shared shopping list',
      },
      {
        id: 'sample-call',
        title: 'Family catch-up',
        startsAt: inDays(3, 18),
        detail: 'A little time for a video call',
      },
      {
        id: 'sample-lunch',
        title: 'Lunch together',
        startsAt: inDays(4, 12, 30),
        detail: 'Bring something to share',
      },
    ],
    shopping: [
      { id: 'sample-milk', title: 'Milk', checked: false },
      { id: 'sample-bread', title: 'Bread', checked: false },
      { id: 'sample-sunday', title: 'Something for lunch', checked: false },
    ],
  }
}
