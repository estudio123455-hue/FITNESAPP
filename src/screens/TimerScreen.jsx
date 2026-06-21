import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react'
import ScreenHeader from '../components/ScreenHeader'
import { formatClock } from '../utils/format'
import { vibrate } from '../utils/audio'
import useWakeLock from '../hooks/useWakeLock'

const PRESETS = [
  { label: 'Tabata', workSeconds: 20, restSeconds: 10, rounds: 8, mode: 'interval' },
  { label: 'HIIT', workSeconds: 40, restSeconds: 20, rounds: 10, mode: 'interval' },
  { label: 'EMOM', workSeconds: 50, restSeconds: 10, rounds: 12, mode: 'interval' },
]

const REST_CHIPS = [30, 60, 90, 120]

function useBeeper() {
  const ctxRef = useRef(null)

  function ctx() {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      ctxRef.current = new AudioCtx()
    }
    return ctxRef.current
  }

  function tone(freq, duration, volume = 0.18) {
    try {
      const audio = ctx()
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(volume, audio.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration)
      osc.connect(gain)
      gain.connect(audio.destination)
      osc.start()
      osc.stop(audio.currentTime + duration)
    } catch {
      // audio not available, ignore
    }
  }

  return {
    tick: () => tone(880, 0.08),
    transition: () => tone(1320, 0.18),
    done: () => {
      tone(660, 0.16)
      setTimeout(() => tone(990, 0.28), 180)
    },
  }
}

export default function TimerScreen() {
  const [config, setConfig] = useState({ workSeconds: 30, restSeconds: 15, rounds: 8, mode: 'interval' })
  const [phase, setPhase] = useState('idle') // idle | work | rest | done
  const [round, setRound] = useState(1)
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [running, setRunning] = useState(false)
  const beep = useBeeper()
  const wakeLock = useWakeLock()

  useEffect(() => {
    if (running) {
      wakeLock.acquire()
    } else {
      wakeLock.release()
    }
  }, [running])

  // Pure countdown: the only state change here is a deterministic decrement,
  // so it stays correct even though StrictMode double-invokes the updater.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(id)
  }, [running])

  // Phase transitions are deferred into a callback (not nested inside the
  // setSecondsLeft updater above, and not synchronous in the effect body) so
  // each transition's setState/side-effect calls run exactly once instead of
  // being duplicated by StrictMode's updater double-invocation.
  useEffect(() => {
    if (!running) return

    const id = setTimeout(() => {
      if (secondsLeft > 0) {
        if (secondsLeft <= 3) beep.tick()
        return
      }

      if (phase === 'work') {
        const isLastRound = round >= config.rounds
        if (isLastRound) {
          beep.done()
          vibrate([200, 80, 200])
          setRunning(false)
          setPhase('done')
          return
        }
        vibrate(100)
        beep.transition()
        if (config.restSeconds > 0) {
          setPhase('rest')
          setSecondsLeft(config.restSeconds)
        } else {
          setRound((r) => r + 1)
          setSecondsLeft(config.workSeconds)
        }
        return
      }

      vibrate(100)
      beep.transition()
      setRound((r) => r + 1)
      setPhase('work')
      setSecondsLeft(config.workSeconds)
    }, 0)

    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, running])

  function start() {
    if (phase === 'idle' || phase === 'done') {
      setPhase('work')
      setRound(1)
      setSecondsLeft(config.workSeconds)
    }
    setRunning(true)
  }

  function pause() {
    setRunning(false)
  }

  function reset() {
    setRunning(false)
    setPhase('idle')
    setRound(1)
    setSecondsLeft(config.workSeconds)
  }

  function applyPreset(preset) {
    setRunning(false)
    setPhase('idle')
    setRound(1)
    setConfig(preset)
    setSecondsLeft(preset.workSeconds)
  }

  function applyRestChip(seconds) {
    applyPreset({ workSeconds: seconds, restSeconds: 0, rounds: 1, mode: 'rest' })
  }

  function adjust(field, delta, min = 0) {
    setConfig((c) => ({ ...c, [field]: Math.max(min, (Number(c[field]) || 0) + delta) }))
  }

  const phaseTotal = phase === 'rest' ? config.restSeconds : config.workSeconds
  const fraction = phaseTotal > 0 ? secondsLeft / phaseTotal : 0
  const isIdle = phase === 'idle'
  const isDone = phase === 'done'
  const phaseLabel = isIdle
    ? 'Listo'
    : isDone
      ? '¡Completado!'
      : phase === 'rest'
        ? 'Descanso'
        : config.mode === 'rest'
          ? 'Descanso'
          : 'Trabajo'

  const ringColor = phase === 'rest' ? 'var(--color-muted)' : isDone ? 'var(--color-success)' : 'var(--color-accent)'

  const radius = 110
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Temporizador" subtitle="Entrenamiento por intervalos" />

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="flex flex-col items-center">
          <div className="relative flex h-64 w-64 items-center justify-center">
            <svg width="256" height="256" className="rotate-[-90deg]">
              <circle cx="128" cy="128" r={radius} stroke="var(--color-surface-2)" strokeWidth="14" fill="none" />
              <circle
                cx="128"
                cy="128"
                r={radius}
                stroke={ringColor}
                strokeWidth="14"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - (isIdle ? 1 : fraction))}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">{phaseLabel}</span>
              <span className="font-mono text-5xl font-bold text-text">
                {formatClock(isIdle ? config.workSeconds : secondsLeft)}
              </span>
              {!isIdle && !isDone && config.mode === 'interval' && (
                <span className="mt-1 text-xs text-muted">Ronda {round}/{config.rounds}</span>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              type="button"
              onClick={reset}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-muted hover:text-text"
            >
              <RotateCcw size={18} />
            </button>
            <button
              type="button"
              onClick={running ? pause : start}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-black"
            >
              {running ? <Pause size={26} fill="black" /> : <Play size={26} fill="black" />}
            </button>
            <div className="h-12 w-12" />
          </div>
        </div>

        <div className="mt-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Presets</p>
          <div className="flex gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="flex-1 rounded-xl border border-border bg-surface py-2.5 text-center text-sm font-medium text-text hover:border-accent"
              >
                {p.label}
                <span className="block text-[10px] text-muted">
                  {p.workSeconds}/{p.restSeconds}×{p.rounds}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Descanso rápido</p>
          <div className="flex gap-2">
            {REST_CHIPS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => applyRestChip(s)}
                className="flex-1 rounded-xl border border-border bg-surface py-2.5 text-center text-sm font-medium text-text hover:border-accent"
              >
                {s}s
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Personalizar</p>
          <div className="grid grid-cols-3 gap-3">
            <Stepper label="Trabajo" value={`${config.workSeconds}s`} onInc={() => adjust('workSeconds', 5, 5)} onDec={() => adjust('workSeconds', -5, 5)} />
            <Stepper label="Descanso" value={`${config.restSeconds}s`} onInc={() => adjust('restSeconds', 5, 0)} onDec={() => adjust('restSeconds', -5, 0)} />
            <Stepper label="Rondas" value={config.rounds} onInc={() => adjust('rounds', 1, 1)} onDec={() => adjust('rounds', -1, 1)} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Stepper({ label, value, onInc, onDec }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wide text-muted">{label}</span>
      <span className="font-mono text-base font-semibold text-text">{value}</span>
      <div className="flex gap-1.5">
        <button type="button" onClick={onDec} className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 text-muted hover:text-text">
          <Minus size={13} />
        </button>
        <button type="button" onClick={onInc} className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 text-muted hover:text-text">
          <Plus size={13} />
        </button>
      </div>
    </div>
  )
}
