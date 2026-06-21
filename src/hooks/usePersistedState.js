import { useEffect, useState } from 'react'

const STORAGE_PREFIX = 'fitpulse:v1:'

function readPersistedValue(key, fallback) {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => readPersistedValue(key, initialValue))

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    } catch {
      // storage unavailable (quota exceeded, private mode, etc.) — ignore
    }
  }, [key, value])

  return [value, setValue]
}
