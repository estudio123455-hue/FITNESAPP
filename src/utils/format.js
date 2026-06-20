export function formatClock(totalSeconds) {
  const safe = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatDuration(totalSeconds) {
  const safe = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  if (m > 0) return `${m} min`
  return `${safe} seg`
}

export function formatDay(isoDate) {
  const date = new Date(isoDate)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  if (sameDay(date, today)) return 'Hoy'
  if (sameDay(date, yesterday)) return 'Ayer'

  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}
