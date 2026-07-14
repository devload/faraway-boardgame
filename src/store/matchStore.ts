import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { MatchState, RegionCard } from '../game/types.ts'
import {
  botDraft,
  currentDrafter,
  endRound,
  fillBotSelection,
  initMatch,
  isDraftPhaseComplete,
  revealAndFindSanctuaries,
  selectCard,
  takeDraft,
} from '../game/match.ts'

/**
 * Flow orchestrator on top of pure match functions.
 *
 * Single flow:
 *   humanSelect(card)  → selectCard → fillBotSelection → revealAndFindSanctuaries
 *                        (state now in 'draft')
 *                        If bot goes first and doesn't need human input to
 *                        keep a sanctuary → run botDraft immediately so the
 *                        human sees the draft screen at their turn.
 *   humanDraft(...)   → takeDraft(human) → auto-run any queued bot → if
 *                       draft complete → endRound → maybe end match.
 */
type MatchStore = {
  state: MatchState | null

  start: (seed?: number) => void
  reset: () => void

  /** Human selects a card from their hand → starts round resolution. */
  humanSelect: (card: RegionCard) => void

  /**
   * Human takes their draft turn.
   *   region: which market card they claim (null on R8, no draft).
   *   sanctuaryId: which of their sanctuary choices they keep, or null.
   */
  humanDraft: (region: RegionCard | null, sanctuaryId: number | null) => void

  /** After human drafts (or automatically), progress the round further. */
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
      next = revealAndFindSanctuaries(next)
      // If bot drafts first, let it go now.
      if (currentDrafter(next) === 'bot') {
        next = botDraft(next)
      }
      set({ state: next })
    },

    humanDraft: (region, sanctuaryId) => {
      const cur = get().state
      if (!cur) return
      let next = takeDraft(cur, 'human', region, sanctuaryId)
      while (currentDrafter(next) === 'bot') {
        next = botDraft(next)
      }
      if (isDraftPhaseComplete(next)) {
        next = endRound(next)
      }
      set({ state: next })
    },

    progress: () => {
      const cur = get().state
      if (!cur) return
      let next = cur
      while (currentDrafter(next) === 'bot') {
        next = botDraft(next)
      }
      if (isDraftPhaseComplete(next)) {
        next = endRound(next)
      }
      set({ state: next })
    },
  })),
)
