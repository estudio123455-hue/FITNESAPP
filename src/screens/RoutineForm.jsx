import { useState } from 'react'
import { X, Plus, Trash2, Check } from 'lucide-react'
import { nextId, routineColors } from '../data/defaultRoutines'

const EMOJIS = ['🏋️', '💪', '🔥', '🏃', '🦵', '🧘', '🤸', '⚡']

function emptyExercise() {
  return { id: nextId('ex'), name: '', sets: 3, reps: 10, restSeconds: 60, unit: 'reps' }
}

export default function RoutineForm({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? EMOJIS[0])
  const [color, setColor] = useState(initial?.color ?? routineColors[0])
  const [exercises, setExercises] = useState(
    initial ? initial.exercises.map((e) => ({ ...e })) : [emptyExercise()],
  )

  const isEditing = Boolean(initial)
  const canSave = name.trim().length > 0 && exercises.every((e) => e.name.trim().length > 0)

  function updateExercise(id, field, value) {
    setExercises((list) => list.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  function addExercise() {
    setExercises((list) => [...list, emptyExercise()])
  }

  function removeExercise(id) {
    setExercises((list) => list.filter((e) => e.id !== id))
  }

  function handleSave() {
    if (!canSave) return
    onSave({
      id: initial?.id ?? nextId('routine'),
      name: name.trim(),
      emoji,
      color,
      exercises: exercises.map((e) => ({
        ...e,
        sets: Number(e.sets) || 1,
        reps: Number(e.reps) || 1,
        restSeconds: Number(e.restSeconds) || 0,
      })),
    })
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-base">
      <header
        className="flex shrink-0 items-center justify-between px-4 pb-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
      >
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:text-text">
          <X size={22} />
        </button>
        <h2 className="text-base font-semibold">{isEditing ? 'Editar rutina' : 'Nueva rutina'}</h2>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-black disabled:opacity-40"
        >
          <Check size={16} /> Guardar
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <div className="flex items-center gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
            style={{ backgroundColor: `${color}22` }}
          >
            {emoji}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la rutina"
            className="flex-1 rounded-xl border border-border bg-surface px-3.5 py-3 text-sm font-medium text-text placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${
                emoji === e ? 'bg-accent-soft ring-1 ring-accent' : 'bg-surface'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          {routineColors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-7 w-7 rounded-full ring-offset-2 ring-offset-base"
              style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : 'none' }}
            />
          ))}
        </div>

        <h3 className="mt-7 mb-3 text-sm font-semibold text-muted">Ejercicios</h3>
        <div className="space-y-3">
          {exercises.map((ex, idx) => (
            <div key={ex.id} className="rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-muted">
                  {idx + 1}
                </span>
                <input
                  value={ex.name}
                  onChange={(e) => updateExercise(ex.id, 'name', e.target.value)}
                  placeholder="Nombre del ejercicio"
                  className="flex-1 rounded-lg bg-transparent text-sm font-medium text-text placeholder:text-muted focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeExercise(ex.id)}
                  className="rounded-full p-1.5 text-muted hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <Field label="Series">
                  <input
                    type="number"
                    min={1}
                    value={ex.sets}
                    onChange={(e) => updateExercise(ex.id, 'sets', e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-2 py-1.5 text-center text-sm focus:border-accent focus:outline-none"
                  />
                </Field>
                <Field label={ex.unit === 'seg' ? 'Segundos' : 'Reps'}>
                  <input
                    type="number"
                    min={1}
                    value={ex.reps}
                    onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-2 py-1.5 text-center text-sm focus:border-accent focus:outline-none"
                  />
                </Field>
                <Field label="Descanso">
                  <input
                    type="number"
                    min={0}
                    value={ex.restSeconds}
                    onChange={(e) => updateExercise(ex.id, 'restSeconds', e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-2 py-1.5 text-center text-sm focus:border-accent focus:outline-none"
                  />
                </Field>
                <Field label="Unidad">
                  <button
                    type="button"
                    onClick={() => updateExercise(ex.id, 'unit', ex.unit === 'seg' ? 'reps' : 'seg')}
                    className="w-full rounded-lg border border-border bg-surface-2 py-1.5 text-center text-xs font-medium text-accent"
                  >
                    {ex.unit === 'seg' ? 'seg' : 'reps'}
                  </button>
                </Field>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addExercise}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted hover:border-accent hover:text-accent"
        >
          <Plus size={16} /> Añadir ejercicio
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-muted">{label}</span>
      {children}
    </div>
  )
}
