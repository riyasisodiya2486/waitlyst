'use client'

import { createContext, useContext } from 'react'

type SessionView = {
  founderId: string | null
  founderName: string | null
}

const SessionContext = createContext<SessionView>({
  founderId: null,
  founderName: null,
})

export function SessionProvider({ value, children }: { value: SessionView; children: React.ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSessionView() {
  return useContext(SessionContext)
}
