'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import type { BrandEngineAPI, BrandRules } from '@/lib/brand-engine'

interface BrandEngineContextValue {
  engine: BrandEngineAPI | null
  rules: BrandRules | null
}

const BrandEngineContext = createContext<BrandEngineContextValue>({ engine: null, rules: null })

export function BrandEngineProvider({ children }: { children: React.ReactNode }) {
  const [engine, setEngine] = useState<BrandEngineAPI | null>(null)
  const [rules, setRules] = useState<BrandRules | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    // Lazy-import to avoid SSR issues
    import('@/lib/brand-engine').then(({ getBrandEngine }) => {
      const e = getBrandEngine()
      setEngine(e)
      setRules(e.currentRules())
      // Subscribe to rule changes
      unsubRef.current = e.subscribe((newRules) => {
        setRules(newRules)
      })
    })
    return () => {
      if (unsubRef.current) unsubRef.current()
    }
  }, [])

  return (
    <BrandEngineContext.Provider value={{ engine, rules }}>
      {children}
    </BrandEngineContext.Provider>
  )
}

export function useBrandEngine(): BrandEngineContextValue {
  return useContext(BrandEngineContext)
}
