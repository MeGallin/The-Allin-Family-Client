const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
})
function formatWithUkZone(format: Intl.DateTimeFormat, value: string) {
  // Browsers can label London's winter zone GMT+0; use the familiar GMT spelling.
  return format
    .formatToParts(new Date(value))
    .map((part) =>
      part.type === 'timeZoneName' && /^GMT[+-]0(?::00)?$/.test(part.value) ? 'GMT' : part.value,
    )
    .join('')
}

export function formatUkDateTime(value: string) {
  return formatWithUkZone(formatter, value)
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
})

export function formatUkDate(value: string) {
  return dateFormatter.format(new Date(value))
}

export function formatUkTime(value: string) {
  return formatWithUkZone(timeFormatter, value)
}
