let ctx = null

function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    ctx = new AudioCtx()
  }
  return ctx
}

export function beep(freq = 880, duration = 0.08, volume = 0.18) {
  try {
    const audio = getCtx()
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

export function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern)
}
