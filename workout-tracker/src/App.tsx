import { useState, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Check,
  Dumbbell,
  Flame,
  Trophy,
  Timer,
  Plus,
  Minus,
  Calendar,
  SkipForward,
  ArrowRightLeft,
} from 'lucide-react'
import './App.css'

type WorkoutPhase = 'select' | 'warmup' | 'strength' | 'complete'

interface WarmupExercise {
  name: string
  duration: number
  description: string
}

interface StrengthExercise {
  name: string
  sets: number
  reps: number | string
  suggestedWeight: number
  restSeconds: number
  description: string
}

interface SetLog {
  weight: number
  completed: boolean
}

interface WorkoutDay {
  name: string
  label: string
  exercises: StrengthExercise[]
}

interface WorkoutHistory {
  date: string
  workout: string
  exerciseLogs: Record<string, SetLog[]>
}

const WARMUP_EXERCISES: WarmupExercise[] = [
  { name: 'Jumping Jacks', duration: 60, description: 'Full range of motion, arms overhead' },
  { name: 'Arm Circles', duration: 30, description: 'Forward 15s, backward 15s' },
  { name: 'Leg Swings', duration: 30, description: 'Front-to-back, 15s each leg' },
  { name: 'Hip Circles', duration: 30, description: 'Wide circles, 15s each direction' },
  { name: 'Bodyweight Squats', duration: 45, description: 'Slow and controlled, full depth' },
  { name: 'Inchworms', duration: 45, description: 'Walk hands out to plank, walk back' },
]

const WORKOUT_DAYS: WorkoutDay[] = [
  {
    name: 'A',
    label: 'Workout A — Push & Squat',
    exercises: [
      { name: 'Barbell Squat', sets: 3, reps: 5, suggestedWeight: 135, restSeconds: 180, description: 'Feet shoulder-width, break parallel' },
      { name: 'Bench Press', sets: 3, reps: 5, suggestedWeight: 135, restSeconds: 180, description: 'Grip just outside shoulders, touch chest' },
      { name: 'Barbell Row', sets: 3, reps: 5, suggestedWeight: 115, restSeconds: 120, description: 'Hinge at hips, pull to lower chest' },
    ],
  },
  {
    name: 'B',
    label: 'Workout B — Pull & Press',
    exercises: [
      { name: 'Barbell Squat', sets: 3, reps: 5, suggestedWeight: 135, restSeconds: 180, description: 'Feet shoulder-width, break parallel' },
      { name: 'Overhead Press', sets: 3, reps: 5, suggestedWeight: 85, restSeconds: 180, description: 'Strict press, full lockout overhead' },
      { name: 'Deadlift', sets: 1, reps: 5, suggestedWeight: 185, restSeconds: 180, description: 'Hips back, flat back, drive through heels' },
    ],
  },
]

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getStoredWeights(): Record<string, number> {
  try {
    const stored = localStorage.getItem('workout-weights')
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function setStoredWeights(weights: Record<string, number>) {
  localStorage.setItem('workout-weights', JSON.stringify(weights))
}

function getWorkoutHistory(): WorkoutHistory[] {
  try {
    const stored = localStorage.getItem('workout-history')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveWorkoutHistory(entry: WorkoutHistory) {
  const history = getWorkoutHistory()
  history.push(entry)
  localStorage.setItem('workout-history', JSON.stringify(history))
}

function getLastWorkoutDay(): string {
  try {
    return localStorage.getItem('last-workout-day') || 'A'
  } catch {
    return 'A'
  }
}

function WarmupTimer({ onComplete }: { onComplete: () => void }) {
  const [currentExercise, setCurrentExercise] = useState(0)
  const [timeLeft, setTimeLeft] = useState(WARMUP_EXERCISES[0].duration)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const totalDuration = WARMUP_EXERCISES.reduce((sum, ex) => sum + ex.duration, 0)
  const elapsedBefore = WARMUP_EXERCISES.slice(0, currentExercise).reduce((sum, ex) => sum + ex.duration, 0)
  const elapsed = elapsedBefore + (WARMUP_EXERCISES[currentExercise]?.duration ?? 0) - timeLeft
  const progressPercent = (elapsed / totalDuration) * 100

  useEffect(() => {
    if (!isRunning || isFinished) return
    if (timeLeft <= 0) {
      if (currentExercise < WARMUP_EXERCISES.length - 1) {
        const next = currentExercise + 1
        setCurrentExercise(next)
        setTimeLeft(WARMUP_EXERCISES[next].duration)
      } else {
        setIsFinished(true)
        setIsRunning(false)
      }
      return
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [isRunning, timeLeft, currentExercise, isFinished])

  const reset = () => {
    setCurrentExercise(0)
    setTimeLeft(WARMUP_EXERCISES[0].duration)
    setIsRunning(false)
    setIsFinished(false)
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="w-10 h-10 text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-white">Warm-Up Complete!</h3>
        <p className="text-zinc-400">You&apos;re ready to lift.</p>
        <button
          onClick={onComplete}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-colors active:scale-95"
        >
          Start Strength Training <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    )
  }

  const exercise = WARMUP_EXERCISES[currentExercise]

  return (
    <div className="flex flex-col gap-6">
      <div className="w-full bg-zinc-800 rounded-full h-2">
        <div
          className="bg-orange-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="text-center">
        <p className="text-zinc-500 text-sm font-medium mb-1">
          Exercise {currentExercise + 1} of {WARMUP_EXERCISES.length}
        </p>
        <h3 className="text-3xl font-bold text-white mb-2">{exercise.name}</h3>
        <p className="text-zinc-400">{exercise.description}</p>
      </div>

      <div className="text-center">
        <span className="text-7xl font-mono font-bold text-orange-400 tabular-nums">
          {formatTime(timeLeft)}
        </span>
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-colors active:scale-95"
        >
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-6 py-4 rounded-2xl text-lg transition-colors active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={onComplete}
          className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-6 py-4 rounded-2xl text-lg transition-colors active:scale-95"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        {WARMUP_EXERCISES.map((ex, i) => (
          <div
            key={ex.name}
            className={`text-xs py-2 px-3 rounded-xl text-center font-medium transition-colors ${
              i < currentExercise
                ? 'bg-green-500/20 text-green-400'
                : i === currentExercise
                ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/50'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {ex.name}
          </div>
        ))}
      </div>
    </div>
  )
}

function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [timeLeft, setTimeLeft] = useState(seconds)

  useEffect(() => {
    if (timeLeft <= 0) {
      onDone()
      return
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [timeLeft, onDone])

  const progressPercent = ((seconds - timeLeft) / seconds) * 100

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-3xl p-8 max-w-sm w-full text-center border border-zinc-700">
        <Timer className="w-8 h-8 text-orange-400 mx-auto mb-4" />
        <p className="text-zinc-400 font-medium mb-2">Rest Timer</p>
        <span className="text-6xl font-mono font-bold text-white tabular-nums">
          {formatTime(timeLeft)}
        </span>
        <div className="w-full bg-zinc-800 rounded-full h-2 mt-6 mb-6">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <button
          onClick={onDone}
          className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors active:scale-95"
        >
          Skip Rest
        </button>
      </div>
    </div>
  )
}

function StrengthTraining({
  workout,
  onComplete,
}: {
  workout: WorkoutDay
  onComplete: (logs: Record<string, SetLog[]>) => void
}) {
  const storedWeights = getStoredWeights()
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, SetLog[]>>(() => {
    const initial: Record<string, SetLog[]> = {}
    workout.exercises.forEach((ex) => {
      const weight = storedWeights[ex.name] ?? ex.suggestedWeight
      initial[ex.name] = Array.from({ length: ex.sets }, () => ({
        weight,
        completed: false,
      }))
    })
    return initial
  })
  const [showRest, setShowRest] = useState<number | null>(null)

  const updateWeight = (exerciseName: string, setIndex: number, delta: number) => {
    setExerciseLogs((prev) => {
      const updated = { ...prev }
      const sets = [...updated[exerciseName]]
      sets[setIndex] = { ...sets[setIndex], weight: Math.max(0, sets[setIndex].weight + delta) }
      updated[exerciseName] = sets
      return updated
    })
  }

  const toggleSet = (exerciseName: string, setIndex: number, restSeconds: number) => {
    setExerciseLogs((prev) => {
      const updated = { ...prev }
      const sets = [...updated[exerciseName]]
      const wasCompleted = sets[setIndex].completed
      sets[setIndex] = { ...sets[setIndex], completed: !wasCompleted }
      updated[exerciseName] = sets

      if (!wasCompleted) {
        const weights = getStoredWeights()
        weights[exerciseName] = sets[setIndex].weight
        setStoredWeights(weights)
        setShowRest(restSeconds)
      }

      return updated
    })
  }

  const allComplete = Object.values(exerciseLogs).every((sets) =>
    sets.every((s) => s.completed)
  )

  const totalSets = Object.values(exerciseLogs).reduce((sum, sets) => sum + sets.length, 0)
  const completedSets = Object.values(exerciseLogs).reduce(
    (sum, sets) => sum + sets.filter((s) => s.completed).length,
    0
  )

  return (
    <div className="flex flex-col gap-6">
      {showRest !== null && (
        <RestTimer seconds={showRest} onDone={() => setShowRest(null)} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-sm font-medium">Progress</p>
          <p className="text-white font-bold text-lg">
            {completedSets} / {totalSets} sets
          </p>
        </div>
        <div className="text-right">
          <p className="text-zinc-500 text-sm font-medium">Workout</p>
          <p className="text-orange-400 font-bold text-lg">{workout.name}</p>
        </div>
      </div>

      <div className="w-full bg-zinc-800 rounded-full h-2">
        <div
          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(completedSets / totalSets) * 100}%` }}
        />
      </div>

      {workout.exercises.map((exercise) => (
        <div key={exercise.name} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white">{exercise.name}</h3>
            <p className="text-zinc-400 text-sm mt-1">{exercise.description}</p>
            <p className="text-zinc-500 text-xs mt-1">
              {exercise.sets} &times; {exercise.reps} reps &middot; {exercise.restSeconds / 60}min rest
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {exerciseLogs[exercise.name]?.map((setLog, setIndex) => (
              <div
                key={setIndex}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  setLog.completed ? 'bg-green-500/10' : 'bg-zinc-800/50'
                }`}
              >
                <button
                  onClick={() => toggleSet(exercise.name, setIndex, exercise.restSeconds)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors active:scale-90 ${
                    setLog.completed
                      ? 'bg-green-500 text-white'
                      : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                  }`}
                >
                  {setLog.completed ? <Check className="w-5 h-5" /> : <span className="text-sm font-bold">{setIndex + 1}</span>}
                </button>

                <span className="text-zinc-400 text-sm font-medium w-16">
                  Set {setIndex + 1}
                </span>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => updateWeight(exercise.name, setIndex, -5)}
                    className="w-9 h-9 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center active:scale-90 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-white font-bold text-lg w-16 text-center tabular-nums">
                    {setLog.weight} lb
                  </span>
                  <button
                    onClick={() => updateWeight(exercise.name, setIndex, 5)}
                    className="w-9 h-9 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center active:scale-90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {allComplete && (
        <button
          onClick={() => onComplete(exerciseLogs)}
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-colors active:scale-95 mt-2"
        >
          <Trophy className="w-6 h-6" /> Finish Workout
        </button>
      )}
    </div>
  )
}

function CompletionScreen({ onNewWorkout }: { onNewWorkout: () => void }) {
  const history = getWorkoutHistory()
  const recentHistory = history.slice(-7).reverse()

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
        <Trophy className="w-12 h-12 text-green-400" />
      </div>
      <h2 className="text-3xl font-bold text-white">Workout Complete!</h2>
      <p className="text-zinc-400 text-center">
        Great work! You&apos;re building strength one session at a time.
      </p>

      {recentHistory.length > 0 && (
        <div className="w-full bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mt-4">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-400" /> Recent Sessions
          </h3>
          <div className="flex flex-col gap-2">
            {recentHistory.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-800/50"
              >
                <span className="text-zinc-400 text-sm">{entry.date}</span>
                <span className="text-orange-400 font-semibold text-sm">
                  Workout {entry.workout}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onNewWorkout}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-colors active:scale-95 mt-4"
      >
        <RotateCcw className="w-5 h-5" /> Start Another Workout
      </button>
    </div>
  )
}

function WorkoutPicker({
  currentWorkout,
  onSelect,
  onStartWarmup,
  onSkipWarmup,
}: {
  currentWorkout: WorkoutDay
  onSelect: (workout: WorkoutDay) => void
  onStartWarmup: () => void
  onSkipWarmup: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Workout</h2>
        <p className="text-zinc-400 text-sm">Select a workout, then warm up or jump straight in.</p>
      </div>

      <div className="flex flex-col gap-3">
        {WORKOUT_DAYS.map((day) => (
          <button
            key={day.name}
            onClick={() => onSelect(day)}
            className={`w-full text-left p-5 rounded-2xl border transition-colors active:scale-98 ${
              currentWorkout.name === day.name
                ? 'bg-orange-500/10 border-orange-500/50 ring-1 ring-orange-500/30'
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-white">{day.label}</span>
              {currentWorkout.name === day.name && (
                <Check className="w-5 h-5 text-orange-400" />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {day.exercises.map((ex) => (
                <span
                  key={ex.name}
                  className="text-xs bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-lg"
                >
                  {ex.name} {ex.sets}&times;{ex.reps}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <button
          onClick={onStartWarmup}
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-colors active:scale-95"
        >
          <Flame className="w-5 h-5" /> Start with Warm-Up
        </button>
        <button
          onClick={onSkipWarmup}
          className="flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-colors active:scale-95"
        >
          <SkipForward className="w-5 h-5" /> Skip to Lifting
        </button>
      </div>
    </div>
  )
}

function App() {
  const [phase, setPhase] = useState<WorkoutPhase>('select')
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutDay>(() => {
    const lastDay = getLastWorkoutDay()
    const nextDay = lastDay === 'A' ? 'B' : 'A'
    return WORKOUT_DAYS.find((w) => w.name === nextDay) || WORKOUT_DAYS[0]
  })

  const handleWarmupComplete = useCallback(() => {
    setPhase('strength')
  }, [])

  const handleStrengthComplete = useCallback(
    (logs: Record<string, SetLog[]>) => {
      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
      saveWorkoutHistory({
        date: today,
        workout: currentWorkout.name,
        exerciseLogs: logs,
      })
      localStorage.setItem('last-workout-day', currentWorkout.name)
      setPhase('complete')
    },
    [currentWorkout]
  )

  const handleNewWorkout = useCallback(() => {
    const lastDay = getLastWorkoutDay()
    const nextDay = lastDay === 'A' ? 'B' : 'A'
    setCurrentWorkout(WORKOUT_DAYS.find((w) => w.name === nextDay) || WORKOUT_DAYS[0])
    setPhase('select')
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl font-bold">IronLog</h1>
          </div>
          <div className="flex items-center gap-2">
            {phase === 'select' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-zinc-700/50 text-zinc-300 px-3 py-1.5 rounded-full">
                <ArrowRightLeft className="w-3.5 h-3.5" /> Pick Workout
              </span>
            )}
            {phase === 'warmup' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-full">
                <Flame className="w-3.5 h-3.5" /> Warm-Up
              </span>
            )}
            {phase === 'strength' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-full">
                <Dumbbell className="w-3.5 h-3.5" /> {currentWorkout.label}
              </span>
            )}
            {phase === 'complete' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full">
                <Trophy className="w-3.5 h-3.5" /> Done
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {phase === 'select' && (
          <WorkoutPicker
            currentWorkout={currentWorkout}
            onSelect={setCurrentWorkout}
            onStartWarmup={() => setPhase('warmup')}
            onSkipWarmup={() => setPhase('strength')}
          />
        )}
        {phase === 'warmup' && <WarmupTimer onComplete={handleWarmupComplete} />}
        {phase === 'strength' && (
          <StrengthTraining
            workout={currentWorkout}
            onComplete={handleStrengthComplete}
          />
        )}
        {phase === 'complete' && <CompletionScreen onNewWorkout={handleNewWorkout} />}
      </main>

      <footer className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-zinc-600 text-xs">
          Built for strength. 3&times;5 program &middot; ~45 min sessions
        </p>
      </footer>
    </div>
  )
}

export default App
