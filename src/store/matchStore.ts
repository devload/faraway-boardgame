import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { MatchState, RegionCard } from '../game/types.ts'
import {
  botDraw,
  currentDrawer,
  endRound,
  fillBotSelection,
  initMatch,
  isDrawPhaseComplete,
  revealAndPlace,
  selectCard,
  takeDraw,
} from '../game/match.ts'

type MatchStore = {
  state: MatchState | null

  start: (seed?: number) => void
  reset: () => void

  /** Human selects a card from their hand → starts round resolution. */
  humanSelect: (card: RegionCard) => void

  /** Human takes their draw action (region + optional sanctuary). */
  humanDraw: (region: RegionCard, sanctuaryId: number | null) => void

  /** After human draws (or automatically), progress the round further. */
  progress: () => void
}

export const useMatch = create<MatchStore>()(
  immer((set, get) => ({
    state: null,

    start: (seed = Date.now() & 0xffffffff) => {
      set({ state: initMatch(seed) })
    },
    reset: () => {
      set({ state: null })
    },

    humanSelect: (card) => {
      const cur = get().state
      if (!cur) return
      let next = selectCard(cur, 'human', card)
      next = fillBotSelection(next)
      next = revealAndPlace(next)
      // After placement, we're in 'draw' phase. If bot goes first, auto-run it.
      const drawer = currentDrawer(next)
      if (drawer === 'bot') {
        next = botDraw(next)
      }
      set({ state: next })
    },

    humanDraw: (region, sanctuaryId) => {
      const cur = get().state
      if (!cur) return
      let next = takeDraw(cur, 'human', region, sanctuaryId)
      // If bot was queued next, run its draw automatically.
      while (currentDrawer(next) === 'bot') {
        next = botDraw(next)
      }
      // Round complete?
      if (isDrawPhaseComplete(next)) {
        next = endRound(next)
      }
      set({ state: next })
    },

    progress: () => {
      const cur = get().state
      if (!cur) return
      let next = cur
      // Advance any auto-runnable state (bot draws waiting, or round ending).
      while (currentDrawer(next) === 'bot') {
        next = botDraw(next)
      }
      if (isDrawPhaseComplete(next)) {
        next = endRound(next)
      }
      set({ state: next })
    },
  })),
)
