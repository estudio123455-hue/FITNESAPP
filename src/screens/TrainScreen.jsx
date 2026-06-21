import { useEffect, useMemo, useState } from 'react'
import { Play, Check, X, Plus, Minus, SkipForward, Flag, Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ScreenHeader from '../components/ScreenHeader'
import { formatClock, formatDuration } from '../utils/format'
import { beep, vibrate } from '../utils/audio'
import useWakeLock from '../hooks/useWakeLock'

export default function TrainScreen() {
  const { state } = useApp()

  if (state.activeWorkout) return <ActiveWorkout />
  return <RoutinePicker />
}

function RoutinePicker() {
  const { state, startWorkout, startFreeWorkout, setTab, dismissSummary } = useApp()
  const summary = state.lastFinishedWorkout

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        title="Entrenar"
        subtitle="Elige una rutina para empezar"
        action={
          <button
            type="button"
            onClick={startFreeWorkout}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold text-text hover:border-accent"
          >
            <Zap size={14} className="text-accent" /> Libre
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {summary && (
          <div className="mb-5 rounded-2xl border border-accent/40 bg-accent-soft p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-accent">¡Entrenamiento completado! {summary.emoji}</p>
              <button type="button" onClick={dismissSummary} className="text-muted">
                <X size={16} />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted">{summary.routineName}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Stat label="Duración" value={formatDuration(summary.durationSeconds)} />
              <Stat label="Series" value={`${summary.completedSets}/${summary.totalSets}`} />
              <Stat label="Volumen" value={`${Math.round(summary.totalVolume)} kg`} />
            </div>
          </div>
        )}

        {state.routines.length === 0 && (
          <div className="mt-10 text-center">
            <p className="text-sm text-muted">No tienes rutinas todavía.</p>
            <button
              type="button"
              onClick={() => setTab('routines')}
              className="mt-3 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black"
            >
              Crear una rutina
            </button>
          </div>
        )}

        <div className="space-y-3">
          {state.routines.map((routine) => {
            const totalSets = routine.exercises.reduce((sum, e) => sum + e.sets, 0)
            return (
              <button
                key={routine.id}
                type="button"
                onClick={() => startWorkout(routine.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left active:scale-[0.98] transition-transform"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                  style={{ backgroundColor: `${routine.color}22` }}
                >
                  {routine.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-text">{routine.name}</p>
                  <p className="text-xs text-muted">
                    {routine.exercises.length} ejercicios · {totalSets} series
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
                  <Play size={15} className="text-black" fill="black" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-sm font-bold text-text">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
    </div>
  )
}

function ActiveWorkout() {
  const { state, updateSet, toggleSetDone, addSet, removeSet, addExercise, finishWorkout, cancelWorkout } = useApp()
  const workout = state.activeWorkout
  const [elapsed, setElapsed] = useState(0)
  const [rest, setRest] = useState(null) // { total, secondsLeft }
  const [confirmFinish, setConfirmFinish] = useState(false)
  const [addingExercise, setAddingExercise] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState('')
  const wakeLock = useWakeLock()

  useEffect(() => {
    wakeLock.acquire()
  }, [])

  useEffect(() => {
    const start = new Date(workout.startedAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [workout.startedAt])

  useEffect(() => {
    if (!rest) return
    const t = setTimeout(() => {
      if (rest.secondsLeft <= 4 && rest.secondsLeft > 1) {
        beep(880, 0.08)
      }
      setRest((r) => {
        if (!r) return r
        if (r.secondsLeft <= 1) {
          beep(660, 0.15)
          vibrate([200, 80, 200])
          return null
        }
        return { ...r, secondsLeft: r.secondsLeft - 1 }
      })
    }, 1000)
    return () => clearTimeout(t)
  }, [rest])

  const { totalSets, completedSets, totalVolume } = useMemo(() => {
    let total = 0
    let done = 0
    let volume = 0
    workout.exercises.forEach((ex) =>
      ex.sets.forEach((s) => {
        total += 1
        if (s.done) {
          done += 1
          if (ex.unit !== 'seg') volume += (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0)
        }
      }),
    )
    return { totalSets: total, completedSets: done, totalVolume: volume }
  }, [workout])

  function handleToggle(exercise, setIndex, setObj) {
    toggleSetDone(exercise.id, setIndex)
    if (!setObj.done && exercise.restSeconds > 0) {
      setRest({ total: exercise.restSeconds, secondsLeft: exercise.restSeconds })
    }
  }

  function handleAddExercise() {
    const name = newExerciseName.trim()
    if (!name) return
    addExercise(name)
    setNewExerciseName('')
    setAddingExercise(false)
  }

  const progressPct = totalSets ? Math.round((completedSets / totalSets) * 100) : 0

  return (
    <div className="flex h-full flex-col">
      <header
        className="shrink-0 px-5 pb-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">{workout.emoji} En curso</p>
            <h1 className="text-xl font-bold text-text">{workout.routineName}</h1>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-accent">{formatClock(elapsed)}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted">tiempo</p>
          </div>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
          <span>{completedSets}/{totalSets} series completadas</span>
          <span className="font-semibold text-accent">{Math.round(totalVolume)} kg volumen</span>
        </div>
      </header>

      {rest && (
        <div className="mx-5 mb-3 flex shrink-0 items-center justify-between rounded-xl border border-warn/40 bg-warn/10 px-4 py-2.5">
          <span className="text-sm font-medium text-warn">Descanso: {formatClock(rest.secondsLeft)}</span>
          <button
            type="button"
            onClick={() => setRest(null)}
            className="flex items-center gap-1 text-xs font-semibold text-warn"
          >
            <SkipForward size={14} /> Saltar
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
        {workout.exercises.map((exercise) => (
          <div key={exercise.id} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-text">{exercise.name}</p>
              <span className="text-[11px] text-muted">descanso {exercise.restSeconds}s</span>
            </div>

            <div className="mt-3 grid grid-cols-[1.5rem_1fr_1fr_2.25rem] items-center gap-x-2 gap-y-2 text-xs text-muted">
              <span></span>
              <span>{exercise.unit === 'seg' ? 'Segundos' : 'Reps'}</span>
              <span>{exercise.unit === 'seg' ? '' : 'Peso (kg)'}</span>
              <span></span>

              {exercise.sets.map((set, idx) => (
                <SetRow
                  key={idx}
                  index={idx}
                  set={set}
                  unit={exercise.unit}
                  onChange={(field, value) => updateSet(exercise.id, idx, field, value)}
                  onToggle={() => handleToggle(exercise, idx, set)}
                />
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => addSet(exercise.id)}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:text-text"
              >
                <Plus size={13} /> Serie
              </button>
              {exercise.sets.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSet(exercise.id, exercise.sets.length - 1)}
                  className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:text-text"
                >
                  <Minus size={13} /> Serie
                </button>
              )}
            </div>
          </div>
        ))}

        {workout.exercises.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">
            Aún no has agregado ejercicios. Usa el botón de abajo para añadir el primero.
          </p>
        )}

        {addingExercise ? (
          <div className="rounded-2xl border border-accent/40 bg-surface p-3">
            <input
              autoFocus
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddExercise()}
              placeholder="Nombre del ejercicio"
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setAddingExercise(false)
                  setNewExerciseName('')
                }}
                className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-text"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddExercise}
                disabled={!newExerciseName.trim()}
                className="flex-1 rounded-lg bg-accent py-2 text-sm font-semibold text-black disabled:opacity-40"
              >
                Agregar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingExercise(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted hover:border-accent hover:text-accent"
          >
            <Plus size={16} /> Añadir ejercicio
          </button>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => setConfirmFinish(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent py-3 text-sm font-semibold text-black"
          >
            <Flag size={15} /> Finalizar entrenamiento
          </button>
        </div>
        <button
          type="button"
          onClick={cancelWorkout}
          className="w-full pt-1 text-center text-xs text-muted underline-offset-2 hover:underline"
        >
          Cancelar entrenamiento
        </button>
      </div>

      {confirmFinish && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 px-8">
          <div className="w-full rounded-2xl border border-border bg-surface-2 p-5 text-center">
            <p className="text-sm font-medium text-text">
              {completedSets}/{totalSets} series completadas
            </p>
            <p className="mt-1 text-xs text-muted">¿Finalizar y guardar este entrenamiento?</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmFinish(false)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-text"
              >
                Seguir
              </button>
              <button
                type="button"
                onClick={() => {
                  finishWorkout()
                  setConfirmFinish(false)
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent py-2.5 text-sm font-semibold text-black"
              >
                <Check size={16} /> Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SetRow({ index, set, unit, onChange, onToggle }) {
  return (
    <>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold text-muted">
        {index + 1}
      </span>
      <input
        type="number"
        inputMode="numeric"
        value={set.reps}
        onChange={(e) => onChange('reps', e.target.value)}
        className="w-full rounded-lg border border-border bg-surface-2 py-1.5 text-center text-sm text-text focus:border-accent focus:outline-none"
      />
      {unit === 'seg' ? (
        <span></span>
      ) : (
        <input
          type="number"
          inputMode="decimal"
          value={set.weight}
          placeholder="0"
          onChange={(e) => onChange('weight', e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-2 py-1.5 text-center text-sm text-text placeholder:text-muted/50 focus:border-accent focus:outline-none"
        />
      )}
      <button
        type="button"
        onClick={onToggle}
        className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
          set.done ? 'border-accent bg-accent text-black' : 'border-border text-muted'
        }`}
      >
        <Check size={14} />
      </button>
    </>
  )
}
