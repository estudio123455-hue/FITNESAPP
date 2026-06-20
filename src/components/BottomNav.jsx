import { Dumbbell, ListChecks, TrendingUp, Timer } from 'lucide-react'
import { useApp } from '../context/AppContext'

const TABS = [
  { key: 'train', label: 'Entrenar', icon: Dumbbell },
  { key: 'routines', label: 'Rutinas', icon: ListChecks },
  { key: 'progress', label: 'Progreso', icon: TrendingUp },
  { key: 'timer', label: 'Temporizador', icon: Timer },
]

export default function BottomNav() {
  const { state, setTab } = useApp()

  return (
    <nav
      className="flex shrink-0 items-stretch border-t border-border bg-surface/95 backdrop-blur px-1 pb-[max(env(safe-area-inset-bottom),10px)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 10px)' }}
    >
      {TABS.map(({ key, label, icon: Icon }) => {
        const active = state.activeTab === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="flex flex-1 flex-col items-center gap-1 pt-2.5 pb-1 transition-colors"
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.4 : 1.8}
              className={active ? 'text-accent' : 'text-muted'}
            />
            <span className={`text-[10.5px] font-medium ${active ? 'text-accent' : 'text-muted'}`}>
              {label}
            </span>
            <span
              className={`mt-0.5 h-1 w-6 rounded-full transition-opacity ${
                active ? 'bg-accent opacity-100' : 'opacity-0'
              }`}
            />
          </button>
        )
      })}
    </nav>
  )
}
