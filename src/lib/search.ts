export const SEARCH_QUERY_LIMIT = 100
export const searchQuery = (value: string | null) => (value ?? '').slice(0, SEARCH_QUERY_LIMIT)
export const normaliseSearch = (value: string) =>
  value.normalize('NFC').trim().toLocaleLowerCase('en-GB')
/** Prepare once per collection; matching fields remain owned by each feature. */
export function createSearchMatcher(query: string) {
  const text = normaliseSearch(searchQuery(query))
  return (fields: readonly string[]) =>
    !text || fields.some((value) => normaliseSearch(value).includes(text))
}
export function filterOption<T extends string>(
  value: string | null,
  choices: readonly (readonly [T, string])[],
  fallback: T,
): T {
  return choices.find(([key]) => key === value)?.[0] ?? fallback
}
