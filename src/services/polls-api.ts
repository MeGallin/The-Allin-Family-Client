import { request } from './api-client'
import { writeRequest } from './write-request'
import type { PollSnapshot, PollWrite } from '../features/polls/types'
export const getPolls = (signal?: AbortSignal) => request<PollSnapshot>('/polls', undefined, signal)
export const changePoll = ({ action, body }: PollWrite, signal?: AbortSignal) =>
  writeRequest<PollSnapshot>('/polls/' + action, body, signal)
