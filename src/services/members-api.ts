import { request } from './api-client'
import { writeRequest } from './write-request'
import type { AdminMember, MemberResponse, MemberWrite } from '../features/members/types'
export const getAdminMembers = (signal?: AbortSignal) =>
  request<{ members: AdminMember[] }>('/admin/members', undefined, signal)
export const writeAdminMember = (write: MemberWrite) =>
  writeRequest<MemberResponse>('/admin/members/' + write.action, write.body)
