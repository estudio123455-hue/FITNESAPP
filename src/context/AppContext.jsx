import { createContext, useContext, useState } from 'react'
import { defaultRoutines, nextId } from '../data/defaultRoutines'
import { usePersistedState } from '../hooks/usePersistedState'

const AppContext = createContext(null)

function buildWorkoutExercises(routine) {
  return routine.exercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    unit: exercise.unit,
    restSeconds: exercise.restSeconds,
    sets: Array.from({ length: exercise.sets }, () => ({
      reps: exercise.reps,
      weight: '',
      done: false,
    })),
  }))
}

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState('train')
  const [lastFinishedWorkout, setLastFinishedWorkout] = useState(null)
  const [routines, setRoutines] = usePersistedState('routines', defaultRoutines)
  const [history, setHistory] = usePersistedState('history', [])
  const [activeWorkout, setActiveWorkout] = usePersistedState('activeWorkout', null)

  function addRoutine(routine) {
    setRoutines([...routines, routine])
  }

  function updateRoutine(routine) {
    setRoutines(routines.map((r) => (r.id === routine.id ? routine : r)))
  }

  function deleteRoutine(routineId) {
    setRoutines(routines.filter((r) => r.id !== routineId))
  }

  function startWorkout(routineId) {
    const routine = routines.find((r) => r.id === routineId)
    if (!routine) return
    setLastFinishedWorkout(null)
    setActiveWorkout({
      routineId: routine.id,
      routineName: routine.name,
      emoji: routine.emoji,
      color: routine.color,
      startedAt: new Date().toISOString(),
      exercises: buildWorkoutExercises(routine),
    })
  }

  function startFreeWorkout() {
    setLastFinishedWorkout(null)
    setActiveWorkout({
      routineId: null,
      routineName: 'Entrenamiento libre',
      emoji: '⚡',
      color: '#c6f135',
      startedAt: new Date().toISOString(),
      exercises: [],
    })
  }

  function addExercise(name) {
    if (!activeWorkout) return
    const newExercise = {
      id: nextId('ex'),
      name,
      unit: 'reps',
      restSeconds: 60,
      sets: [{ reps: 10, weight: '', done: false }],
    }
    setActiveWorkout({ ...activeWorkout, exercises: [...activeWorkout.exercises, newExercise] })
  }

  function updateSet(exerciseId, setIndex, field, value) {
    if (!activeWorkout) return
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex) =>
        ex.id !== exerciseId
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s, i) => (i === setIndex ? { ...s, [field]: value } : s)),
            },
      ),
    })
  }

  function toggleSetDone(exerciseId, setIndex) {
    if (!activeWorkout) return
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex) =>
        ex.id !== exerciseId
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s, i) => (i === setIndex ? { ...s, done: !s.done } : s)),
            },
      ),
    })
  }

  function addSet(exerciseId) {
    if (!activeWorkout) return
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex) =>
        ex.id !== exerciseId
          ? ex
          : { ...ex, sets: [...ex.sets, { ...ex.sets[ex.sets.length - 1], done: false }] },
      ),
    })
  }

  function removeSet(exerciseId, setIndex) {
    if (!activeWorkout) return
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex) =>
        ex.id !== exerciseId ? ex : { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) },
      ),
    })
  }

  function finishWorkout() {
    const workout = activeWorkout
    if (!workout) return

    const startedAt = new Date(workout.startedAt)
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 1000))

    let totalSets = 0
    let completedSets = 0
    let totalVolume = 0

    const exercises = workout.exercises.map((ex) => {
      const completedSetLogs = []
      ex.sets.forEach((s) => {
        totalSets += 1
        if (s.done) {
          completedSets += 1
          const weight = parseFloat(s.weight) || 0
          const reps = parseFloat(s.reps) || 0
          if (ex.unit !== 'seg') totalVolume += weight * reps
          completedSetLogs.push({ weight, reps })
        }
      })
      return { name: ex.name, unit: ex.unit, sets: completedSetLogs }
    })

    const summary = {
      id: nextId('history'),
      routineId: workout.routineId,
      routineName: workout.routineName,
      emoji: workout.emoji,
      color: workout.color,
      date: new Date().toISOString(),
      durationSeconds,
      totalSets,
      completedSets,
      totalVolume,
      exercises,
    }

    setActiveWorkout(null)
    setLastFinishedWorkout(summary)
    setHistory([summary, ...history])
  }

  function cancelWorkout() {
    setActiveWorkout(null)
  }

  function dismissSummary() {
    setLastFinishedWorkout(null)
  }

  const state = { activeTab, routines, activeWorkout, lastFinishedWorkout, history }

  const value = {
    state,
    setTab: setActiveTab,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    startWorkout,
    startFreeWorkout,
    addExercise,
    updateSet,
    toggleSetDone,
    addSet,
    removeSet,
    finishWorkout,
    cancelWorkout,
    dismissSummary,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider')
  return ctx
}
