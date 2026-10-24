import { withRequestTimeout } from './request-timeout'
import { request } from './api-client'
import { writeRequest } from './write-request'
import type { WidgetsSnapshot, WidgetWrite } from '../features/widgets/types'
export const getWidgets = (signal?: AbortSignal) =>
  withRequestTimeout(
    (timedSignal) => request<WidgetsSnapshot>('/widgets', undefined, timedSignal),
    signal,
    undefined,
    'Loading your widgets timed out. Please try again.',
  )
export const changeWidget = ({ action, body }: WidgetWrite, signal?: AbortSignal) =>
  withRequestTimeout(
    (timedSignal) => writeRequest<WidgetsSnapshot>('/widgets/' + action, body, timedSignal),
    signal,
  )
