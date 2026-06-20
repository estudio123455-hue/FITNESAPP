import { useState } from 'react'
import { Plus, ChevronDown, Play, Pencil, Trash2, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ScreenHeader from '../components/ScreenHeader'
import RoutineForm from './RoutineForm'

export default function RoutinesScreen() {
  const { state, addRoutine, updateRoutine, deleteRoutine, startWorkout, setTab } = useApp()
  const [expandedId, setExpandedId] = useState(null)
  const [formMode, setFormMode] = useState(null) // null | 'new' | routine object
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const hasActiveWorkout = Boolean(state.activeWorkout)

  function handleStart(routineId) {
    startWorkout(routineId)
    setTab('train')
  }

  function handleSave(routine) {
    if (state.routines.some((r) => r.id === routine.id)) {
      updateRoutine(routine)
    } else {
      addRoutine(routine)
    }
    setFormMode(null)
  }

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        title="Rutinas"
        subtitle={`${state.routines.length} rutinas guardadas`}
        action={
          <button
            type="button"
            onClick={() => setFormMode('new')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-black"
          >
            <Plus size={20} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="space-y-3">
          {state.routines.map((routine) => {
            const expanded = expandedId === routine.id
            const totalSets = routine.exercises.reduce((sum, e) => sum + e.sets, 0)

            return (
              <div
                key={routine.id}
                className="overflow-hidden rounded-2xl border border-border bg-surface"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : routine.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
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
                  <ChevronDown
                    size={18}
                    className={`text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {expanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <ul className="space-y-2">
                      {routine.exercises.map((ex) => (
                        <li key={ex.id} className="flex items-center justify-between text-sm">
                          <span className="text-text">{ex.name}</span>
                          <span className="flex items-center gap-1 text-muted">
                            {ex.sets}×{ex.reps}
                            {ex.unit === 'seg' ? 's' : ''}
                            <Clock size={12} className="ml-1.5" />
                            {ex.restSeconds}s
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleStart(routine.id)}
                        disabled={hasActiveWorkout}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent py-2.5 text-sm font-semibold text-black disabled:opacity-40"
                      >
                        <Play size={15} fill="black" /> Iniciar
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormMode(routine)}
                        className="flex items-center justify-center rounded-xl border border-border px-3 text-muted hover:text-text"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(routine.id)}
                        className="flex items-center justify-center rounded-xl border border-border px-3 text-muted hover:text-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {hasActiveWorkout && (
                      <p className="mt-2 text-center text-xs text-warn">
                        Termina tu entrenamiento activo antes de iniciar otro
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {state.routines.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted">
            No tienes rutinas aún. Crea la primera con el botón +.
          </p>
        )}
      </div>

      {formMode && (
        <RoutineForm
          initial={formMode === 'new' ? null : formMode}
          onSave={handleSave}
          onClose={() => setFormMode(null)}
        />
      )}

      {confirmDeleteId && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 px-8">
          <div className="w-full rounded-2xl border border-border bg-surface-2 p-5 text-center">
            <p className="text-sm font-medium text-text">¿Eliminar esta rutina?</p>
            <p className="mt-1 text-xs text-muted">Esta acción no se puede deshacer.</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-text"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteRoutine(confirmDeleteId)
                  setExpandedId(null)
                  setConfirmDeleteId(null)
                }}
                className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-semibold text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
