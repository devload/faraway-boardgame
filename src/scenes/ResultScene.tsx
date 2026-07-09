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

  // Bot's running score matches the human's tempo — same revealedCount.
  const runningRegionBot = scores.bot.entries
    .slice(0, revealedCount)
    .reduce((sum, e) => sum + e.earned, 0)
  const runningSanctuaryBot = done ? scores.bot.sanctuaryScore : 0
  const botTotal = runningRegionBot + runningSanctuaryBot

  const humanWon = humanTotal > botTotal
  const draw = humanTotal === botTotal

  return (
    <div className="w-full h-full flex flex-col pt-safe pb-safe px-4 overflow-y-auto">
      <div className="flex justify-between items-center pt-4 pb-2">
        <Chip variant="sunset" size="xs">RESULT</Chip>
        <div className="font-mono text-[10px] tracking-[0.2em] text-earth-brown uppercase">
          // {done ? 'FINAL' : `SCORING… ${revealedCount}/${totalReveals}`}
        </div>
      </div>

      {/* Live scoreboard — both players' running totals side by side */}
      <div className="grid grid-cols-2 gap-2 mt-3 mb-1">
        <ScoreCard
          label="내 여정"
          total={humanTotal}
          region={runningRegionHuman}
          sanctuary={runningSanctuaryHuman}
          leading={humanTotal >= botTotal}
          mine
        />
        <ScoreCard
          label={`${state.players.bot.name}의 여정`}
          total={botTotal}
          region={runningRegionBot}
          sanctuary={runningSanctuaryBot}
          leading={botTotal > humanTotal}
        />
      </div>

      {/* Bot tableau — compact right-to-left reveal in sync */}
      <div className="mt-4">
        <div className="font-mono text-[9px] tracking-widest text-mist-blue uppercase mb-1">
          상대의 여정 · 채점 진행 중
        </div>
        <TableauReveal
          tableau={state.players.bot.tableau}
          entries={scores.bot.entries}
          revealedCount={revealedCount}
          cardSize="xs"
          showDetail={false}
        />
      </div>

      {/* Human tableau — full detail */}
      <div className="mt-4">
        <div className="font-mono text-[9px] tracking-widest text-sunset-deep uppercase mb-1">
          내 여정 · 채점 상세
        </div>
        <TableauReveal
          tableau={state.players.human.tableau}
          entries={scores.human.entries}
          revealedCount={revealedCount}
          cardSize="sm"
          showDetail
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
  tableau, entries, revealedCount, cardSize = 'sm', showDetail = true,
}: {
  tableau: readonly import('../game/types.ts').RegionCard[]
  entries: readonly import('../game/types.ts').ScoreEntry[]
  revealedCount: number
  /** Card thumb size — xs for the ambient bot strip, sm for the focused human strip. */
  cardSize?: 'xs' | 'sm'
  /** Whether to render the per-icon condition-check panel below the strip. */
  showDetail?: boolean
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
                <RegionCardView card={card} size={cardSize} />
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

      {/* Current scoring line detail — icon-by-icon comparison.
          Rendered only when the caller opts in (main human strip); the
          ambient bot strip skips it to keep the ceremony readable. */}
      <AnimatePresence mode="wait">
        {showDetail && currentEntry && revealedCount > 0 && revealedCount <= entries.length && (
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

            {/* Icon-by-icon comparison. One row per required icon type:
                [🌙 ×2 필요] → [🌙🌙🌙 있음] [✓] — never wraps because
                the row is a flex line and the "found" cell truncates
                gracefully with a `+N` overflow indicator on huge counts. */}
            {Object.keys(currentEntry.card.requirement).length > 0 && (
              <div className="flex flex-col gap-1.5">
                {Object.entries(currentEntry.card.requirement).map(([icon, need]) => {
                  const found = currentEntry.leftIcons[icon as keyof typeof currentEntry.leftIcons] ?? 0
                  const met = found >= (need ?? 0)
                  const maxVisible = 5
                  const emoji = ICON_EMOJI[icon as keyof typeof ICON_EMOJI]
                  return (
                    <div
                      key={icon}
                      className={`flex items-center gap-2 py-1 px-2 rounded
                                  ${met ? 'bg-gold/10' : 'bg-earth-brown/5'}`}
                    >
                      {/* Need */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="emoji text-lg leading-none">{emoji}</span>
                        <span className="font-display text-sm text-night-indigo">×{need}</span>
                      </div>

                      <span className="font-mono text-[9px] text-earth-brown shrink-0 uppercase">필요</span>
                      <span className="text-earth-brown shrink-0">→</span>

                      {/* Found — icons animate in one by one so player can watch */}
                      <div className="flex-1 min-w-0 flex items-center gap-0.5 emoji flex-wrap">
                        {found === 0 ? (
                          <span className="font-mono text-[10px] text-earth-brown">왼쪽에 없음</span>
                        ) : (
                          <>
                            {Array.from({ length: Math.min(found, maxVisible) }).map((_, i) => (
                              <motion.span
                                key={i}
                                initial={{ opacity: 0, y: -4, scale: 0.5 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.12 * i, duration: 0.3 }}
                                className="text-base leading-none"
                              >
                                {emoji}
                              </motion.span>
                            ))}
                            {found > maxVisible && (
                              <span className="font-mono text-[10px] text-earth-brown ml-1">+{found - maxVisible}</span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Verdict */}
                      <span className={`font-mono text-sm font-bold shrink-0
                                       ${met ? 'text-gold' : 'text-earth-brown'}`}>
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

/** Live scoreboard tile — big total + region/sanctuary breakdown. */
function ScoreCard({
  label, total, region, sanctuary, leading, mine = false,
}: {
  label: string
  total: number
  region: number
  sanctuary: number
  leading: boolean
  mine?: boolean
}) {
  const border = mine
    ? 'border-sunset/60 bg-sunset/8'
    : 'border-mist-blue/50 bg-mist-blue/8'
  const totalColor = leading
    ? mine ? '#d4a574' : '#4a5c6a'
    : '#8b6f47'
  return (
    <div className={`relative px-3 py-2 border rounded-md ${border}
                    ${leading ? 'ring-1 ring-gold/40' : ''}`}>
      {leading && total > 0 && (
        <div className="absolute -top-2 right-2 font-mono text-[8px] tracking-widest uppercase
                        px-1.5 py-0.5 rounded bg-gold text-night-indigo font-bold">
          앞섬
        </div>
      )}
      <div className="font-serif italic text-xs text-mist-blue truncate">{label}</div>
      <div className="flex items-baseline gap-1 mt-0.5">
        <motion.span
          key={total}
          initial={{ scale: 1.4, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="font-display text-3xl leading-none"
          style={{ color: totalColor, textShadow: leading ? '0 0 10px rgba(212,165,116,0.6)' : undefined }}
        >
          {total}
        </motion.span>
        <span className="font-mono text-[9px] tracking-widest text-earth-brown">PTS</span>
      </div>
      <div className="flex gap-2 mt-1 font-mono text-[9px] text-earth-brown">
        <span>지역 <span className="font-display text-xs text-night-indigo">{region}</span></span>
        <span>성소 <span className="font-display text-xs text-night-indigo">{sanctuary}</span></span>
      </div>
    </div>
  )
}
