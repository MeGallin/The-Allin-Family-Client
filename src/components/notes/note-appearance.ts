const papers = ['yellow', 'blue', 'purple', 'pink'] as const

/** Stable, scattered colours: a note keeps its stationery when sorted or refreshed. */
export function noteAppearance(id: string) {
  let seed = 2166136261
  for (const character of id) seed = Math.imul(seed ^ character.charCodeAt(0), 16777619)
  const hash = seed >>> 0
  return { paper: papers[hash % papers.length], tilt: (hash >>> 4) % 4 }
}
