import coastalIllustration from '../../../assets/coastal-memory.svg'
import type { FamilyMemory } from '../types'

// Deliberate preview fixtures. No invented events are sent to the PHP API.
export function createSampleFamilyData(): {
  memories: FamilyMemory[]
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
  }
}
