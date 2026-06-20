import { useMemo } from 'react'
import { Flame, Dumbbell, Layers, Clock3, Trophy } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../context/AppContext'
import ScreenHeader from '../components/ScreenHeader'
import { formatDay, formatDuration, formatTime } from '../utils/format'

const tooltipStyle = {
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--color-text)',
}

function startOfWeek(dateInput) {
  const date = new Date(dateInput)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date
}

function computeStreak(history) {
  if (history.length === 0) return 0
  const days = new Set(history.map((h) => new Date(h.date).toDateString()))
  const cursor = new Date()
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while (days.has(cursor.toDateString())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function buildWeeklyVolume(history, weeks = 8) {
  const thisWeekStart = startOfWeek(new Date())
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = new Date(thisWeekStart)
    start.setDate(start.getDate() - (weeks - 1 - i) * 7)
    return { weekStart: start.getTime(), volume: 0 }
  })

  history.forEach((h) => {
    const weekStart = startOfWeek(h.date).getTime()
    const bucket = buckets.find((b) => b.weekStart === weekStart)
    if (bucket) bucket.volume += h.totalVolume
  })

  return buckets.map((b) => ({
    label: new Date(b.weekStart).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    volume: Math.round(b.volume),
  }))
}

function buildPersonalRecords(history) {
  const map = new Map()
  history.forEach((h) => {
    ;(h.exercises ?? []).forEach((ex) => {
      if (ex.unit === 'seg') return
      ex.sets.forEach((s) => {
        if (!s.weight) return
        const current = map.get(ex.name)
        if (!current || s.weight > current.weight) {
          map.set(ex.name, { weight: s.weight, reps: s.reps })
        }
      })
    })
  })

  return Array.from(map.entries())
    .map(([name, rec]) => ({ name, ...rec }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6)
}

export default function ProgressScreen() {
  const { state } = useApp()
  const { history } = state

  const stats = useMemo(() => {
    const totalVolume = history.reduce((sum, h) => sum + h.totalVolume, 0)
    const totalDuration = history.reduce((sum, h) => sum + h.durationSeconds, 0)
    return {
      count: history.length,
      streak: computeStreak(history),
      totalVolume,
      totalDuration,
    }
  }, [history])

  const weeklyVolume = useMemo(() => buildWeeklyVolume(history), [history])
  const records = useMemo(() => buildPersonalRecords(history), [history])

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Progreso" subtitle="Tu historial de entrenamientos" />

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Flame} label="Racha actual" value={`${stats.streak} día${stats.streak === 1 ? '' : 's'}`} />
          <StatCard icon={Dumbbell} label="Entrenamientos" value={stats.count} />
          <StatCard icon={Layers} label="Volumen total" value={`${Math.round(stats.totalVolume)} kg`} />
          <StatCard icon={Clock3} label="Tiempo total" value={formatDuration(stats.totalDuration)} />
        </div>

        {history.length > 0 && (
          <>
            <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
              <p className="text-sm font-semibold text-text">Volumen por semana</p>
              <div className="mt-3 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyVolume} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
                      axisLine={{ stroke: 'var(--color-border)' }}
                      tickLine={false}
                    />
                    <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip
                      cursor={{ fill: 'var(--color-surface-2)' }}
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: 'var(--color-muted)' }}
                      formatter={(value) => [`${value} kg`, 'Volumen']}
                    />
                    <Bar dataKey="volume" fill="var(--color-accent)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {records.length > 0 && (
              <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center gap-1.5">
                  <Trophy size={15} className="text-accent" />
                  <p className="text-sm font-semibold text-text">Récords personales (peso máx.)</p>
                </div>
                <div className="mt-2" style={{ height: records.length * 38 + 10 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={records} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={108}
                        tick={{ fill: 'var(--color-text)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'var(--color-surface-2)' }}
                        contentStyle={tooltipStyle}
                        formatter={(value, _name, { payload }) => [`${value} kg × ${payload.reps}`, 'PR']}
                      />
                      <Bar dataKey="weight" fill="var(--color-accent)" radius={[0, 4, 4, 0]} barSize={16}>
                        <LabelList
                          dataKey="weight"
                          position="right"
                          formatter={(value) => `${value} kg`}
                          style={{ fill: 'var(--color-text)', fontSize: 11, fontWeight: 600 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        <h2 className="mt-7 mb-3 text-sm font-semibold text-muted">Historial</h2>

        {history.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted">
            Aún no hay entrenamientos completados. ¡Ve a la pestaña Entrenar y empieza el primero!
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ backgroundColor: `${h.color}22` }}
                >
                  {h.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text">{h.routineName}</p>
                  <p className="text-xs text-muted">
                    {formatDay(h.date)} · {formatTime(h.date)} · {formatDuration(h.durationSeconds)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-accent">{h.completedSets}/{h.totalSets}</p>
                  <p className="text-[10px] text-muted">{Math.round(h.totalVolume)} kg</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <Icon size={18} className="text-accent" />
      <p className="mt-2 text-lg font-bold text-text">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  )
}
