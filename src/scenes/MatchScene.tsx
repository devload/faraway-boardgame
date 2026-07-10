import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMatch } from '../store/matchStore.ts'
import { useUI } from '../store/uiStore.ts'
import { RegionCardView } from '../ui/RegionCardView.tsx'
import { Chip } from '../ui/Chip.tsx'
import { SunsetCTA } from '../ui/SunsetCTA.tsx'
import { hasSanctuaryAccess, currentDrawer, isDrawPhaseComplete } from '../game/match.ts'
import type { RegionCard, SanctuaryCard } from '../game/types.ts'

/**
 * Match scene layout — top to bottom:
 *   1. Header (round dot bar)
 *   2. Opponent strip (single row: icon + name + tableau count + sanctuary count)
 *   3. Opponent tableau (xs cards — 8 slots visible)
 *   4. My tableau (sm cards)
 *   5. Phase-appropriate content:
 *        - select phase → hand + tap-to-play
 *        - draw phase   → market picker + hand preview
 *   6. Me strip (footer)
 *
 * Entire container scrolls vertically so nothing gets clipped on tall
 * or dense phases (draw phase in particular can be 500+px tall).
 */
export function MatchScene() {
  const state = useMatch((s) => s.state)
  const humanSelect = useMatch((s) => s.humanSelect)
  const humanDraw = useMatch((s) => s.humanDraw)
  const progress = useMatch((s) => s.progress)
  const setScene = useUI((s) => s.setScene)
  const [pickedSanctuary, setPickedSanctuary] = useState<number | null>(null)

  if (!state) return null

  if (state.phase === 'end') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6 px-6">
        <div className="font-serif italic text-2xl text-night-indigo">여정이 끝났습니다.</div>
        <SunsetCTA onClick={() => setScene('result')} size="lg">스코어링 →</SunsetCTA>
      </div>
    )
  }

  const human = state.players.human
  const bot = state.players.bot
  const drawer = currentDrawer(state)
  const humanCanDraw = drawer === 'human'

  return (
    <div className="w-full h-full overflow-y-auto pt-safe pb-safe">
      <div className="flex flex-col gap-2 px-3 py-3">

        {/* Header */}
        <div className="flex justify-between items-center">
          <Chip variant="sunset" size="xs">R{state.round}/8</Chip>
          <RoundDots current={state.round} total={8} />
        </div>

        {/* Opponent — compact strip (1 row) */}
        <CompactStrip
          side="foe"
          name={bot.name}
          icon={bot.icon}
          hand={bot.hand.length}
          sanctuaries={bot.sanctuaries.length}
        />

        {/* Opponent tableau */}
        <TableauStrip tableau={bot.tableau} label="상대 여정" size="xs" />

        {/* My tableau */}
        <TableauStrip tableau={human.tableau} label="내 여정" size="sm" mine />

        {/* Me — compact strip */}
        <CompactStrip
          side="me"
          name={human.name}
          icon={human.icon}
          hand={human.hand.length}
          sanctuaries={human.sanctuaries.length}
        />

        {/* Phase content */}
        {state.phase === 'select' && (
          <SelectPhase hand={human.hand} onPick={humanSelect} />
        )}

        {state.phase === 'draw' && (
          <div className="flex flex-col gap-3">
            {state.selections.human && state.selections.bot && (
              <PlayComparison humanNum={state.selections.human.id} botNum={state.selections.bot.id} />
            )}

            {humanCanDraw && (
              <DrawPanel
                state={state}
                pickedSanctuary={pickedSanctuary}
                setPickedSanctuary={setPickedSanctuary}
                onPick={(region, sanctId) => {
                  humanDraw(region, sanctId)
                  setPickedSanctuary(null)
                }}
                eligibleForSanctuary={hasSanctuaryAccess(state, 'human')}
                humanHand={human.hand}
              />
            )}

            {!humanCanDraw && !isDrawPhaseComplete(state) && (
              <div className="text-center font-serif italic text-mist-blue py-3">
                상대가 뽑는 중...
              </div>
            )}

            {isDrawPhaseComplete(state) && (
              <div className="flex justify-center py-2">
                <SunsetCTA onClick={progress}>다음 라운드 →</SunsetCTA>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Very thin single-row status strip. */
function CompactStrip({
  side, name, icon, hand, sanctuaries,
}: {
  side: 'me' | 'foe'
  name: string
  icon: string
  hand: number
  sanctuaries: number
}) {
  const tint = side === 'me'
    ? 'bg-sunset/8 border-sunset/30'
    : 'bg-mist-blue/8 border-mist-blue/30'
  return (
    <div className={`flex items-center gap-2 px-2 py-1 border rounded-md ${tint}`}>
      <span className="text-base">{icon}</span>
      <span className="font-serif italic text-sm text-night-indigo min-w-0 truncate">{name}</span>
      <div className="ml-auto flex items-center gap-3">
        <StatMini label="손패" value={hand} />
        <StatMini label="성소" value={sanctuaries} color="text-gold" />
      </div>
    </div>
  )
}

function StatMini({ label, value, color = 'text-night-indigo' }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-[9px] tracking-widest text-earth-brown uppercase">{label}</span>
      <span className={`font-display text-base leading-none ${color}`}>{value}</span>
    </div>
  )
}

function RoundDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < current ? 'bg-sunset' : 'bg-earth-brown/25'}`} />
      ))}
    </div>
  )
}

function TableauStrip({
  tableau, label, size, mine = false,
}: {
  tableau: readonly RegionCard[]
  label: string
  size: 'xs' | 'sm'
  mine?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-earth-brown uppercase">
          <span className="text-sunset-deep opacity-60">✦</span>
          {label}
        </span>
        <span className="font-mono text-[9px] tracking-widest text-earth-brown">
          {tableau.length}/8 {mine && '→ 오른쪽부터 채점'}
        </span>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {Array.from({ length: 8 }).map((_, i) => {
          const card = tableau[i]
          if (card) {
            return (
              <motion.div key={`${card.id}-${i}`}
                          initial={{ y: -20, opacity: 0, rotateY: 90 }}
                          animate={{ y: 0, opacity: 1, rotateY: 0 }}
                          transition={{ type: 'spring', damping: 16, stiffness: 240 }}
                          className="shrink-0">
                <RegionCardView card={card} size={size} />
              </motion.div>
            )
          }
          const w = size === 'xs' ? 'w-[70px] h-[105px]' : 'w-[92px] h-[138px]'
          return (
            <div key={i}
                 className={`shrink-0 ${w} border-2 border-dashed border-earth-brown/30 rounded-lg
                             flex items-center justify-center font-mono text-[9px] text-earth-brown/40 uppercase`}>
              {i + 1}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PlayComparison({ humanNum, botNum }: { humanNum: number; botNum: number }) {
  const humanFirst = humanNum <= botNum
  return (
    <div className="flex items-center gap-2 justify-center font-mono text-[11px] text-earth-brown">
      <span className={humanFirst ? 'text-sunset-deep font-bold' : ''}>
        나 <span className="font-display text-lg">{humanNum}</span>
      </span>
      <span className="opacity-60">vs</span>
      <span className={!humanFirst ? 'text-sunset-deep font-bold' : ''}>
        상대 <span className="font-display text-lg">{botNum}</span>
      </span>
      <span className="ml-2 text-[9px] tracking-widest uppercase text-earth-brown">
        {humanFirst ? '내가 먼저' : '상대 먼저'}
      </span>
    </div>
  )
}

function SelectPhase({
  hand, onPick,
}: {
  hand: readonly RegionCard[]
  onPick: (c: RegionCard) => void
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="font-serif italic text-mist-blue text-center">
        손패 3장 중 <span className="text-sunset-deep">1장을 탭</span>하세요
      </div>
      <div className="flex justify-center gap-2">
        <AnimatePresence>
          {hand.map((c) => (
            <motion.div key={c.id}
                        layout
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -40, opacity: 0, scale: 0.6 }}
                        transition={{ type: 'spring', damping: 18, stiffness: 240 }}>
              <RegionCardView card={c} size="md" onClick={() => onPick(c)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function DrawPanel({
  state, pickedSanctuary, setPickedSanctuary, onPick, eligibleForSanctuary, humanHand,
}: {
  state: { regionMarket: readonly RegionCard[]; sanctuaryMarket: readonly SanctuaryCard[] }
  pickedSanctuary: number | null
  setPickedSanctuary: (id: number | null) => void
  onPick: (region: RegionCard, sanctuaryId: number | null) => void
  eligibleForSanctuary: boolean
  humanHand: readonly RegionCard[]
}) {
  return (
    <div className="flex flex-col gap-3">

      {/* Explainer */}
      <div className="text-center">
        <div className="font-serif italic text-base text-night-indigo">🎴 손패 보충</div>
        <div className="font-mono text-[10px] text-earth-brown mt-0.5 leading-relaxed">
          방금 카드 냈으니 손패 <span className="font-display text-sm">{humanHand.length}</span>장 →
          아래 <span className="text-sunset-deep font-bold">1장 골라 손패 3장으로 채우기</span>
        </div>
      </div>

      {/* Sanctuary status — ALWAYS visible during draw so the player learns
          when they do/don't have access. If eligible + market has cards,
          it's a full picker. If not eligible, it's a short explanation
          of why. If eligible but market empty, an explicit note. */}
      {eligibleForSanctuary && state.sanctuaryMarket.length > 0 ? (
        <div className="border-2 border-gold rounded-lg bg-gold/8 p-3 shadow-[0_0_16px_rgba(212,165,116,0.15)]">
          <div className="text-center mb-2">
            <div className="font-display text-lg text-gold tracking-widest font-bold"
                 style={{ textShadow: '0 0 8px rgba(212,165,116,0.6)' }}>
              ✦ 성소 카드 획득 기회
            </div>
            <div className="font-mono text-[10px] text-earth-brown mt-1">
              직전보다 큰 번호를 냈어요! <span className="text-gold font-bold">1장 골라서 지역 카드 뽑기</span>
            </div>
            {pickedSanctuary === null ? (
              <div className="mt-1.5 font-mono text-[9px] text-sunset-deep font-bold animate-pulse uppercase">
                ⬇ 성소 하나를 먼저 탭하세요 (안 고르면 스킵)
              </div>
            ) : (
              <div className="mt-1.5 font-mono text-[9px] text-gold font-bold uppercase">
                ✓ 선택됨 · 아래 지역 카드 탭하면 함께 획득
              </div>
            )}
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            {state.sanctuaryMarket.map((s) => (
              <button
                key={s.id}
                onClick={() => setPickedSanctuary(pickedSanctuary === s.id ? null : s.id)}
                className={`text-left px-2.5 py-2 rounded-md border-2 max-w-[120px] transition-all
                            ${pickedSanctuary === s.id
                              ? 'border-gold bg-gold/25 -translate-y-1 shadow-gold-glow'
                              : 'border-earth-brown/50 bg-parch-light hover:border-gold/60 hover:-translate-y-0.5'}`}
              >
                <div className="font-serif italic text-night-indigo text-xs leading-tight font-semibold">
                  {s.name}
                </div>
                <div className="font-mono text-[8px] text-mist-blue mt-1 leading-tight">{s.description}</div>
              </button>
            ))}
          </div>
        </div>
      ) : eligibleForSanctuary ? (
        <div className="border border-earth-brown/40 rounded bg-parch-light/60 p-2 text-center">
          <div className="font-mono text-[10px] text-earth-brown">
            ✦ 성소 접근권 있음 · 다만 <span className="text-sunset-deep">시장에 남은 성소가 없음</span>
          </div>
        </div>
      ) : (
        <div className="border border-earth-brown/40 rounded bg-parch-light/60 p-2 text-center">
          <div className="font-mono text-[10px] text-earth-brown">
            ✦ 이번엔 성소 접근 <span className="text-sunset-deep font-bold">불가</span> · <span className="opacity-70">직전보다 낮은 번호를 냈음</span>
          </div>
        </div>
      )}

      {/* Region market */}
      <div>
        <div className="text-center mb-1.5">
          <div className="font-mono text-[10px] tracking-widest text-sunset-deep uppercase font-bold">
            ⬇ 지역 카드 3장 중 1장 (필수)
          </div>
          <div className="font-mono text-[9px] text-earth-brown">
            탭 → 손패로 · 다음 라운드에 낼 수 있음
          </div>
        </div>
        <div className="flex justify-center gap-2 flex-wrap">
          {state.regionMarket.map((c) => (
            <button
              key={c.id}
              onClick={() => onPick(c, eligibleForSanctuary ? pickedSanctuary : null)}
              className="hover:-translate-y-1 transition-transform"
            >
              <RegionCardView card={c} size="md" />
            </button>
          ))}
        </div>
      </div>

      {/* Current hand snapshot — sm size so condition/reward icons are legible */}
      <div>
        <div className="text-center font-mono text-[9px] tracking-widest text-earth-brown uppercase mb-1">
          현재 내 손패 · {humanHand.length}장 (조건/보상 확인용)
        </div>
        <div className="flex justify-center gap-1.5 items-center flex-wrap">
          {humanHand.map((c) => (
            <RegionCardView key={c.id} card={c} size="sm" dim />
          ))}
          <div className="flex items-center gap-1">
            <span className="font-display text-xl text-sunset animate-pulse">+</span>
            <div className="w-[92px] h-[138px] border-2 border-dashed border-sunset rounded-lg
                            flex items-center justify-center text-center px-2 bg-sunset/5">
              <div className="font-mono text-[9px] tracking-widest text-sunset-deep uppercase leading-relaxed">
                뽑는<br/>카드<br/>여기로
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
