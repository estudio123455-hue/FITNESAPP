import { AppProvider, useApp } from './context/AppContext'
import PhoneShell from './components/PhoneShell'
import BottomNav from './components/BottomNav'
import TrainScreen from './screens/TrainScreen'
import RoutinesScreen from './screens/RoutinesScreen'
import ProgressScreen from './screens/ProgressScreen'
import TimerScreen from './screens/TimerScreen'

const SCREENS = {
  train: TrainScreen,
  routines: RoutinesScreen,
  progress: ProgressScreen,
  timer: TimerScreen,
}

function AppShell() {
  const { state } = useApp()
  const Screen = SCREENS[state.activeTab] ?? TrainScreen

  return (
    <PhoneShell>
      <main className="relative flex-1 overflow-hidden">
        <Screen />
      </main>
      <BottomNav />
    </PhoneShell>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
