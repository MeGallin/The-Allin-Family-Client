import { useEffect, useState } from 'react'
export function useEditingRecord<T extends { id: string }>(records: T[], id: string | null) {
  const current = records.find((record) => record.id === id)
  const [cached, setCached] = useState<T | undefined>(current)
  useEffect(() => {
    if (current) setCached(current)
    else if (!id) setCached(undefined)
  }, [current, id])
  return current ?? (cached?.id === id ? cached : undefined)
}
