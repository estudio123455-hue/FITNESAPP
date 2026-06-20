import { createContext, useContext, useMemo, useReducer } from 'react'
import { defaultRoutines, nextId } from '../data/defaultRoutines'

const AppContext = createContext(null)

const initialState = {
  activeTab: 'train',
  routines: defaultRoutines,
  activeWorkout: null,
  lastFinishedWorkout: null,
  history: [],
}

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

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.tab }

    case 'ADD_ROUTINE':
      return { ...state, routines: [...state.routines, action.routine] }

    case 'UPDATE_ROUTINE':
      return {
        ...state,
        routines: state.routines.map((r) => (r.id === action.routine.id ? action.routine : r)),
      }

    case 'DELETE_ROUTINE':
      return { ...state, routines: state.routines.filter((r) => r.id !== action.routineId) }

    case 'START_WORKOUT': {
      const routine = state.routines.find((r) => r.id === action.routineId)
      if (!routine) return state
      return {
        ...state,
        lastFinishedWorkout: null,
        activeWorkout: {
          routineId: routine.id,
          routineName: routine.name,
          emoji: routine.emoji,
          color: routine.color,
          startedAt: new Date().toISOString(),
          exercises: buildWorkoutExercises(routine),
        },
      }
    }

    case 'START_FREE_WORKOUT':
      return {
        ...state,
        lastFinishedWorkout: null,
        activeWorkout: {
          routineId: null,
          routineName: 'Entrenamiento libre',
          emoji: '⚡',
          color: '#c6f135',
          startedAt: new Date().toISOString(),
          exercises: [],
        },
      }

    case 'ADD_EXERCISE': {
      if (!state.activeWorkout) return state
      const newExercise = {
        id: nextId('ex'),
        name: action.name,
        unit: 'reps',
        restSeconds: 60,
        sets: [{ reps: 10, weight: '', done: false }],
      }
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          exercises: [...state.activeWorkout.exercises, newExercise],
        },
      }
    }

    case 'UPDATE_SET': {
      if (!state.activeWorkout) return state
      const { exerciseId, setIndex, field, value } = action
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map((ex) =>
            ex.id !== exerciseId
              ? ex
              : {
                  ...ex,
                  sets: ex.sets.map((s, i) => (i === setIndex ? { ...s, [field]: value } : s)),
                },
          ),
        },
      }
    }

    case 'TOGGLE_SET_DONE': {
      if (!state.activeWorkout) return state
      const { exerciseId, setIndex } = action
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map((ex) =>
            ex.id !== exerciseId
              ? ex
              : {
                  ...ex,
                  sets: ex.sets.map((s, i) => (i === setIndex ? { ...s, done: !s.done } : s)),
                },
          ),
        },
      }
    }

    case 'ADD_SET': {
      if (!state.activeWorkout) return state
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map((ex) =>
            ex.id !== action.exerciseId
              ? ex
              : { ...ex, sets: [...ex.sets, { ...ex.sets[ex.sets.length - 1], done: false }] },
          ),
        },
      }
    }

    case 'REMOVE_SET': {
      if (!state.activeWorkout) return state
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map((ex) =>
            ex.id !== action.exerciseId
              ? ex
              : { ...ex, sets: ex.sets.filter((_, i) => i !== action.setIndex) },
          ),
        },
      }
    }

    case 'FINISH_WORKOUT': {
      const workout = state.activeWorkout
      if (!workout) return state

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

      return {
        ...state,
        activeWorkout: null,
        lastFinishedWorkout: summary,
        history: [summary, ...state.history],
      }
    }

    case 'CANCEL_WORKOUT':
      return { ...state, activeWorkout: null }

    case 'DISMISS_SUMMARY':
      return { ...state, lastFinishedWorkout: null }

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const actions = useMemo(
    () => ({
      setTab: (tab) => dispatch({ type: 'SET_TAB', tab }),
      addRoutine: (routine) => dispatch({ type: 'ADD_ROUTINE', routine }),
      updateRoutine: (routine) => dispatch({ type: 'UPDATE_ROUTINE', routine }),
      deleteRoutine: (routineId) => dispatch({ type: 'DELETE_ROUTINE', routineId }),
      startWorkout: (routineId) => dispatch({ type: 'START_WORKOUT', routineId }),
      startFreeWorkout: () => dispatch({ type: 'START_FREE_WORKOUT' }),
      addExercise: (name) => dispatch({ type: 'ADD_EXERCISE', name }),
      updateSet: (exerciseId, setIndex, field, value) =>
        dispatch({ type: 'UPDATE_SET', exerciseId, setIndex, field, value }),
      toggleSetDone: (exerciseId, setIndex) => dispatch({ type: 'TOGGLE_SET_DONE', exerciseId, setIndex }),
      addSet: (exerciseId) => dispatch({ type: 'ADD_SET', exerciseId }),
      removeSet: (exerciseId, setIndex) => dispatch({ type: 'REMOVE_SET', exerciseId, setIndex }),
      finishWorkout: () => dispatch({ type: 'FINISH_WORKOUT' }),
      cancelWorkout: () => dispatch({ type: 'CANCEL_WORKOUT' }),
      dismissSummary: () => dispatch({ type: 'DISMISS_SUMMARY' }),
    }),
    [],
  )

  const value = useMemo(() => ({ state, ...actions }), [state, actions])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider')
  return ctx
}
