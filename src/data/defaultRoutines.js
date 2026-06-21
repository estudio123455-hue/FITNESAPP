let uid = 0
// Timestamp + counter, not just a counter: state now persists across reloads,
// so a counter restarting at 0 every session would collide with ids already
// saved in localStorage from a previous session.
const id = (prefix) => `${prefix}-${Date.now().toString(36)}-${(uid += 1)}`

export const createExercise = ({ name, sets, reps, restSeconds, unit = 'reps' }) => ({
  id: id('ex'),
  name,
  sets,
  reps,
  restSeconds,
  unit,
})

export const defaultRoutines = [
  {
    id: id('routine'),
    name: 'Full Body Fuerza',
    emoji: '🏋️',
    color: '#c6f135',
    exercises: [
      createExercise({ name: 'Sentadilla con barra', sets: 4, reps: 8, restSeconds: 90 }),
      createExercise({ name: 'Press de banca', sets: 4, reps: 8, restSeconds: 90 }),
      createExercise({ name: 'Remo con barra', sets: 3, reps: 10, restSeconds: 75 }),
      createExercise({ name: 'Press militar', sets: 3, reps: 10, restSeconds: 75 }),
      createExercise({ name: 'Plancha', sets: 3, reps: 45, restSeconds: 45, unit: 'seg' }),
    ],
  },
  {
    id: id('routine'),
    name: 'Empuje (Push)',
    emoji: '💪',
    color: '#34d399',
    exercises: [
      createExercise({ name: 'Press de banca inclinado', sets: 4, reps: 8, restSeconds: 90 }),
      createExercise({ name: 'Press militar mancuernas', sets: 3, reps: 10, restSeconds: 75 }),
      createExercise({ name: 'Fondos en paralelas', sets: 3, reps: 12, restSeconds: 60 }),
      createExercise({ name: 'Elevaciones laterales', sets: 3, reps: 15, restSeconds: 45 }),
      createExercise({ name: 'Extensión de tríceps', sets: 3, reps: 12, restSeconds: 45 }),
    ],
  },
  {
    id: id('routine'),
    name: 'Tren Inferior',
    emoji: '🔥',
    color: '#ffb238',
    exercises: [
      createExercise({ name: 'Sentadilla búlgara', sets: 4, reps: 10, restSeconds: 75 }),
      createExercise({ name: 'Peso muerto rumano', sets: 4, reps: 8, restSeconds: 90 }),
      createExercise({ name: 'Prensa de piernas', sets: 3, reps: 12, restSeconds: 75 }),
      createExercise({ name: 'Zancadas', sets: 3, reps: 12, restSeconds: 60 }),
      createExercise({ name: 'Elevación de talones', sets: 4, reps: 15, restSeconds: 45 }),
    ],
  },
]

export const routineColors = ['#c6f135', '#34d399', '#ffb238', '#60a5fa', '#f472b6', '#a78bfa']

export const nextId = id
