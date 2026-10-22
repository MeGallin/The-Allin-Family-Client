import type { FamilyUser } from '../types/auth'
export const testUser: FamilyUser = {
  id: 101,
  username: 'isolated_owner',
  displayName: 'Test Owner',
  nickname: null,
  familyName: 'Owner',
  profileVersion: 1,
  role: 'member',
  mustChangePassword: false,
}
export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
export const jsonResponse = (data: unknown, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
