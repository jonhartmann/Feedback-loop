import { createContext, useContext, useState } from 'react'

interface TourContextValue {
  active: boolean
  step: number
  totalSteps: number
  startTour: () => void
  endTour: () => void
  nextStep: () => void
  prevStep: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

export const TOUR_TOTAL_STEPS = 8

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)

  function startTour() {
    setStep(0)
    setActive(true)
  }

  function endTour() {
    setActive(false)
  }

  function nextStep() {
    setStep(s => {
      if (s >= TOUR_TOTAL_STEPS - 1) { setActive(false); return 0 }
      return s + 1
    })
  }

  function prevStep() {
    setStep(s => Math.max(0, s - 1))
  }

  return (
    <TourContext.Provider value={{ active, step, totalSteps: TOUR_TOTAL_STEPS, startTour, endTour, nextStep, prevStep }}>
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within TourProvider')
  return ctx
}
