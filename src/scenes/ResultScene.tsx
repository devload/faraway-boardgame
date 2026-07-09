import { useMemo, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMatch } from '../store/matchStore.ts'
import { useUI } from '../store/uiStore.ts'
import { scorePlayer } from '../game/scoring.ts'
import { RegionCardView } from '../ui/RegionCardView.tsx'
import { SunsetCTA } from '../ui/SunsetCTA.tsx'
import { Chip } from '../ui/Chip.tsx'
import { ICON_EMOJI } from '../game/types.ts'

/**
 * ResultScene — the scoring ceremony.
 *
 * Sequence:
 *   1. Show both tableaux
 *   2. Reveal scores card-by-card, right → left, with a delay so the
 *      player can see the mechanic in action
 *   3. Show final totals + winner
 */
export function ResultScene() {
  const state = useMatch((s) => s.state)
  const reset = useMatch((s) => s.reset)
  const setScene = useUI((s) => s.setScene)
  const [revealedCount, setRevealedCount] = useState(0)

  const scores = useMemo(() => {
    if (!state) return null
    return {
      human: scorePlayer('human', state.players.human.tableau, state.players.human.sanctuaries),
      bot:   scorePlayer('bot',   state.players.bot.tableau,   state.players.bot.sanctuaries),
    }
  }, [state])

  const humanTableauLen = state?.players.human.tableau.length ?? 0
  const totalReveals = humanTableauLen // scan right-to-left

  useEffect(() => {
    if (!scores) return
    if (revealedCount >= totalReveals) return
    // Slower pacing so the player can actually watch each card's condition
    // check happen instead of numbers just jumping.
    const t = setTimeout(() => setRevealedCount((c) => c + 1), 1600)
    return () => clearTimeout(t)
  }, [revealedCount, totalReveals, scores])

  if (!state || !scores) return null

  // Running totals — count up card-by-card as scoring walks right→left.
  const runningRegionHuman = scores.human.entries
    .slice(0, revealedCount)
    .reduce((sum, e) => sum + e.earned, 0)
  const done = revealedCount >= totalReveals
  const runningSanctuaryHuman = done ? scores.human.sanctuaryScore : 0
  const humanTotal = runningRegionHuman + runningSanctuaryHuman

  const botTotal = done ? scores.bot.total : 0
  const humanWon = humanTotal > botTotal
  const draw = humanTotal === botTotal

  return (
    <div className="w-full h-full flex flex-col pt-safe pb-safe px-4 overflow-y-auto">
      <div className="flex justify-between items-center pt-4 pb-2">
        <Chip variant="sunset" size="xs">RESULT</Chip>
        <div className="font-mono text-[10px] tracking-[0.2em] text-earth-brown uppercase">
          // {done ? 'FINAL' : 'SCORING…'}
        </div>
      </div>

      {/* Human tableau + reveal */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <div className="font-serif italic text-lg text-night-indigo">내 여정</div>
          <div className="flex items-baseline gap-1">
            <motion.span
              key={humanTotal}
              initial={{ scale: 1.4, color: '#c48b6e' }}
              animate={{ scale: 1, color: '#d4a574' }}
              transition={{ duration: 0.4 }}
              className="font-display text-4xl leading-none"
              style={{ textShadow: '0 0 12px rgba(212,165,116,0.6)' }}
            >
              {humanTotal}
            </motion.span>
            <span className="font-mono text-[10px] tracking-widest text-earth-brown">PTS</span>
          </div>
        </div>

        {/* Region vs sanctuary breakdown */}
        <div className="flex gap-3 mt-1 mb-2 font-mono text-[10px] text-earth-brown">
          <span>지역 <span className="font-display text-sm text-night-indigo">{runningRegionHuman}</span></span>
          <span>성소 <span className="font-display text-sm text-night-indigo">{runningSanctuaryHuman}</span></span>
        </div>

        <TableauReveal
          tableau={state.players.human.tableau}
          entries={scores.human.entries}
          revealedCount={revealedCount}
        />

        {/* Sanctuaries */}
        {state.players.human.sanctuaries.length > 0 && (
          <div className="mt-2">
            <div className="font-mono text-[9px] tracking-widest text-gold uppercase mb-1">
              ✦ 획득한 성소
            </div>
            <div className="flex flex-wrap gap-2">
              {state.players.human.sanctuaries.map((s) => (
                <div key={s.id} className="px-2 py-1 border border-gold/40 bg-gold/10 rounded-md">
                  <div className="font-serif italic text-xs text-night-indigo">{s.name}</div>
                  <div className="font-mono text-[9px] text-earth-brown">{s.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bot summary */}
      <div className="mt-6 p-3 bg-mist-blue/5 border border-mist-blue/20 rounded-md">
        <div className="flex items-baseline justify-between">
          <div className="font-serif italic text-sm text-mist-blue">
            {state.players.bot.name}의 여정
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-2xl text-mist-blue leading-none">{botTotal}</span>
            <span className="font-mono text-[9px] tracking-widest text-earth-brown">PTS</span>
          </div>
        </div>
        <div className="flex gap-1 mt-2 overflow-x-auto">
          {state.players.bot.tableau.map((c, i) => (
            <RegionCardView key={i} card={c} size="xs" />
          ))}
        </div>
      </div>

      {/* Verdict */}
      {done && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <div className={`font-display text-4xl tracking-widest ${humanWon ? 'text-gold' : draw ? 'text-mist-blue' : 'text-earth-brown'}`}
               style={humanWon ? { textShadow: '0 0 16px rgba(212,165,116,0.7)' } : undefined}>
            {humanWon ? '승리' : draw ? '무승부' : '패배'}
          </div>
          <div className="font-serif italic text-mist-blue mt-1">
            {humanWon ? '여명의 챔피언' : draw ? '동등한 여정' : '더 좋은 여정을 기약하며'}
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <div className="mt-6 mb-4 flex flex-col gap-2">
        <SunsetCTA fullWidth
                   onClick={() => {
                     reset()
                     setScene('lobby')
                   }}>
          ✦ 다시 여정 떠나기
        </SunsetCTA>
      </div>
    </div>
  )
}

function TableauReveal({
  tableau, entries, revealedCount,
}: {
  tableau: readonly import('../game/types.ts').RegionCard[]
  entries: readonly import('../game/types.ts').ScoreEntry[]
  revealedCount: number
}) {
  // entries are already right-to-left. Match them by scanning tableau in reverse.
  const scoredIds = new Set(entries.slice(0, revealedCount).map((e) => e.card.id))
  const highlightedId = entries[revealedCount - 1]?.card.id
  const currentEntry = entries[revealedCount - 1]

  // Refs per slot so we can auto-scroll the currently scoring card into view.
  const stripRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({})

  // 1) On mount / any change to tableau length, scroll to the far RIGHT so
  //    the player sees where scoring is about to start.
  useEffect(() => {
    if (!stripRef.current) return
    stripRef.current.scrollTo({ left: stripRef.current.scrollWidth, behavior: 'auto' })
  }, [tableau.length])

  // 2) When the highlighted card changes, scroll it into the horizontal
  //    center of the strip so the player sees the animation.
  useEffect(() => {
    if (highlightedId == null) return
    const el = cardRefs.current[highlightedId]
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [highlightedId])

  return (
    <div className="flex flex-col gap-2">
      {/* Scan direction hint */}
      <div className="flex items-center justify-between font-mono text-[9px] tracking-widest uppercase text-earth-brown">
        <span>왼쪽 · R1 셋업</span>
        <span className="text-sunset-deep">◀ 채점 방향</span>
        <span>오른쪽 · R{tableau.length} 스코어러</span>
      </div>

      <div ref={stripRef} className="flex gap-2 overflow-x-auto py-4 scroll-smooth px-2">
        {tableau.map((card, i) => {
          const scored = scoredIds.has(card.id)
          const entry = entries.find((e) => e.card.id === card.id)
          const highlight = highlightedId === card.id
          return (
            <div
              key={i}
              ref={(el) => { cardRefs.current[card.id] = el }}
              className="relative flex flex-col items-center shrink-0 pt-6"
            >
              {/* Verdict badge — appears above the card when it gets scored.
                  Uses a ring color + icon to signal met vs missed clearly. */}
              <AnimatePresence>
                {scored && entry && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.3, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 260 }}
                    className={`absolute -top-1 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1
                                px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border
                                ${entry.earned > 0
                                  ? 'bg-gold/90 border-gold text-night-indigo shadow-gold-glow'
                                  : 'bg-earth-brown/90 border-earth-brown text-parch-cream'}`}
                  >
                    <span>{entry.earned > 0 ? '✓' : '✗'}</span>
                    <span>{entry.earned > 0 ? `+${entry.earned}` : '0'}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={`transition-all duration-500 ${scored ? 'opacity-100' : 'opacity-40'}
                              ${highlight ? 'scale-110 -translate-y-1' : ''}`}
                   style={highlight ? { filter: 'drop-shadow(0 0 14px rgba(212,165,116,0.75))' } : undefined}>
                <RegionCardView card={card} size="sm" />
              </div>

              {/* Success/fail pulse ring under the card that just got scored */}
              <AnimatePresence>
                {scored && entry && highlight && (
                  <motion.div
                    initial={{ opacity: 0.8, scale: 0.7 }}
                    animate={{ opacity: 0, scale: 1.4 }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                      boxShadow: entry.earned > 0
                        ? '0 0 0 3px #d4a574, 0 0 24px 4px rgba(212,165,116,0.65)'
                        : '0 0 0 3px #8b6f47, 0 0 20px 3px rgba(139,111,71,0.4)',
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Current scoring line detail — icon-by-icon comparison */}
      <AnimatePresence mode="wait">
        {currentEntry && revealedCount > 0 && revealedCount <= entries.length && (
          <motion.div
            key={revealedCount}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`px-3 py-3 rounded-md border-l-4
                        ${currentEntry.earned > 0
                          ? 'bg-gold/15 border-gold'
                          : 'bg-earth-brown/10 border-earth-brown/50'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-serif italic text-sm text-night-indigo">
                {currentEntry.card.name}
              </div>
              <div className={`font-mono text-[10px] tracking-widest uppercase font-bold
                              ${currentEntry.earned > 0 ? 'text-gold' : 'text-earth-brown'}`}>
                {Object.keys(currentEntry.card.requirement).length === 0
                  ? `기본 +${currentEntry.card.points}`
                  : currentEntry.metRequirement
                    ? `✓ 충족 · +${currentEntry.card.points}`
                    : '✗ 실패 · 0점'}
              </div>
            </div>

            {/* Icon-by-icon comparison table. Shows every required icon type
                with need-count vs found-count, colored per success. */}
            {Object.keys(currentEntry.card.requirement).length > 0 && (
              <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1 text-[11px]">
                {Object.entries(currentEntry.card.requirement).map(([icon, need]) => {
                  const found = currentEntry.leftIcons[icon as keyof typeof currentEntry.leftIcons] ?? 0
                  const met = found >= (need ?? 0)
                  return (
                    <div key={icon} className="col-span-3 grid grid-cols-subgrid items-center gap-x-3">
                      <span className="font-mono text-earth-brown">필요</span>
                      <div className="flex items-center gap-1.5">
                        <span className="emoji text-lg">{ICON_EMOJI[icon as keyof typeof ICON_EMOJI]}</span>
                        <span className="font-display text-sm text-night-indigo">×{need}</span>
                        <span className="mx-1 text-earth-brown">vs</span>
                        <span className="font-mono text-earth-brown">왼쪽</span>
                        <div className="flex gap-0.5 emoji">
                          {Array.from({ length: Math.min(found, 6) }).map((_, i) => (
                            <motion.span
                              key={i}
                              initial={{ opacity: 0, y: -4, scale: 0.5 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ delay: 0.15 * i, duration: 0.3 }}
                              className="text-lg leading-none"
                            >
                              {ICON_EMOJI[icon as keyof typeof ICON_EMOJI]}
                            </motion.span>
                          ))}
                          {found === 0 && <span className="text-earth-brown">없음</span>}
                          {found > 6 && <span className="font-mono text-earth-brown">+{found - 6}</span>}
                        </div>
                      </div>
                      <span className={`font-mono text-[10px] font-bold ${met ? 'text-gold' : 'text-earth-brown'}`}>
                        {met ? '✓' : '✗'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
