import { create } from 'zustand'

export type Scene = 'lobby' | 'match' | 'result'

type UIState = {
  scene: Scene
  setScene: (s: Scene) => void
}

export const useUI = create<UIState>((set) => ({
  scene: 'lobby',
  setScene: (s) => set({ scene: s }),
}))
