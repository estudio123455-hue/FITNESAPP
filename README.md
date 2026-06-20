# FitPulse

App de fitness móvil (web responsive, diseño tipo celular) construida con React + Vite y Tailwind CSS. Tema oscuro con acento verde lima. Todo el estado vive en memoria (Context + `useReducer`), sin backend ni base de datos.

## Secciones

- **Entrenar** — inicia un entrenamiento desde una rutina guardada o uno libre, registra series (peso × reps), márcalas como completadas y mira el volumen total en vivo.
- **Rutinas** — crea, edita y elimina plantillas de rutina con su lista de ejercicios y series/reps objetivo.
- **Progreso** — historial de entrenamientos, racha, volumen total, gráficas de volumen semanal y récords personales por ejercicio (con [recharts](https://recharts.org)).
- **Temporizador** — descansos rápidos configurables (30s/60s/90s/2min) y modo de intervalos (Tabata/HIIT/EMOM) con sonido y vibración al finalizar.

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Se ve mejor en una ventana angosta o con las devtools en modo móvil.

```bash
npm run build   # build de producción
npm run lint    # eslint
```
