import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMatch } from '../store/matchStore.ts'
import { useUI } from '../store/uiStore.ts'
import { RegionCardView } from '../ui/RegionCardView.tsx'
import { SanctuaryCardView } from '../ui/SanctuaryCardView.tsx'
import { Chip } from '../ui/Chip.tsx'
import { SunsetCTA } from '../ui/SunsetCTA.tsx'
import {
  currentDrafter,
  isDraftPhaseComplete,
  sanctuaryDrawSize,
  TOTAL_ROUNDS,
} from '../game/match.ts'
import type { RegionCard, SanctuaryCard } from '../game/types.ts'

/**
 * Match scene layout — top to bottom:
 *   1. Header (round dot bar + phase chip)
 *   2. Opponent strip
 *   3. Opponent tableau (xs cards)
 *   4. My tableau (sm cards)
 *   5. Phase content:
 *        - explore → hand + tap-to-play
 *        - draft   → sanctuary chooser (multi-card) → region picker
 *   6. Me strip (footer)
 */
export function MatchScene() {
  const state = useMatch((s) => s.state)
  const humanSelect = useMatch((s) => s.humanSelect)
  const humanDraft = useMatch((s) => s.humanDraft)
  const progress = useMatch((s) => s.progress)
  const setScene = useUI((s) => s.setScene)

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
  const drafter = currentDrafter(state)
  const humanCanDraft = drafter === 'human'
  const isLastRound = state.round >= TOTAL_ROUNDS

  return (
    <div className="w-full h-full overflow-y-auto pt-safe pb-safe">
      <div className="flex flex-col gap-2 px-3 py-3">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Chip variant="sunset" size="xs">R{state.round}/{TOTAL_ROUNDS}</Chip>
            {isLastRound && (
              <Chip variant="gold" size="xs">최종 · 성소만</Chip>
            )}
          </div>
          <RoundDots current={state.round} total={TOTAL_ROUNDS} />
        </div>

        {/* Opponent — compact strip (1 row) */}
        <CompactStrip
          side="foe"
          name={bot.name}
          icon={bot.icon}
          hand={bot.hand.length}
          sanctuaries={bot.sanctuaries.length}
          clues={countClues(bot)}
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
          clues={countClues(human)}
        />

        {/* Phase content */}
        {state.phase === 'explore' && (
          <SelectPhase
            hand={human.hand}
            onPick={humanSelect}
            drawSize={sanctuaryDrawSize(state, 'human')}
          />
        )}

        {state.phase === 'draft' && (
          <div className="flex flex-col gap-3">
            {state.selections.human && state.selections.bot && (
              <PlayComparison humanNum={state.selections.human.id} botNum={state.selections.bot.id} />
            )}

            {humanCanDraft && (
              <DraftPanel
                key={state.round}
                humanSanctuaryChoices={human.sanctuaryChoices}
                regionMarket={state.regionMarket}
                humanHand={human.hand}
                isLastRound={isLastRound}
                onSubmit={(region, sanctId) => humanDraft(region, sanctId)}
              />
            )}

            {!humanCanDraft && !isDraftPhaseComplete(state) && (
              <div className="text-center font-serif italic text-mist-blue py-3">
                상대가 결정 중...
              </div>
            )}

            {isDraftPhaseComplete(state) && (
              <div className="flex justify-center py-2">
                <SunsetCTA onClick={progress}>
                  {isLastRound ? '점수 계산 →' : '다음 라운드 →'}
                </SunsetCTA>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------- Compact strips ------------------------- */

function countClues(p: { tableau: readonly RegionCard[]; sanctuaries: readonly SanctuaryCard[] }): number {
  return p.tableau.reduce((s, c) => s + c.clues, 0)
    + p.sanctuaries.reduce((s, c) => s + c.clues, 0)
}

function CompactStrip({
  side, name, icon, hand, sanctuaries, clues,
}: {
  side: 'me' | 'foe'
  name: string
  icon: string
  hand: number
  sanctuaries: number
  clues: number
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
        <StatMini label="지도" value={clues} color="text-mist-blue" prefix="📜" />
      </div>
    </div>
  )
}

function StatMini({
  label, value, color = 'text-night-indigo', prefix,
}: {
  label: string
  value: number
  color?: string
  prefix?: string
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-[9px] tracking-widest text-earth-brown uppercase">{label}</span>
      {prefix && <span className="text-[10px]">{prefix}</span>}
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

/* ------------------------- Explore phase ------------------------- */

function SelectPhase({
  hand, onPick, drawSize,
}: {
  hand: readonly RegionCard[]
  onPick: (c: RegionCard) => void
  drawSize: number
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="font-serif italic text-mist-blue text-center">
        손패 3장 중 <span className="text-sunset-deep">1장을 탭</span>하세요
      </div>
      <div className="font-mono text-[10px] text-earth-brown text-center">
        오름차순 유지 시 성소 <span className="font-display text-gold">{drawSize}</span>장 뽑아 1장 선택
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

/* ------------------------- Draft phase ------------------------- */

/**
 * DraftPanel — two-step sequential dialog for End of Exploration.
 *
 *   Step 1: sanctuary chooser (any of choices OR skip)
 *   Step 2: region picker (skipped on R8)
 *
 * The parent passes a fresh instance per round via `key={state.round}` so
 * the internal step + pick state reset automatically at round start.
 */
function DraftPanel({
  humanSanctuaryChoices, regionMarket, humanHand, isLastRound, onSubmit,
}: {
  humanSanctuaryChoices: readonly SanctuaryCard[]
  regionMarket: readonly RegionCard[]
  humanHand: readonly RegionCard[]
  isLastRound: boolean
  onSubmit: (region: RegionCard | null, sanctuaryId: number | null) => void
}) {
  const hasChoices = humanSanctuaryChoices.length > 0
  // R8 has no region draft — always route through sanctuary step (its 0-choice branch handles "complete" CTA).
  const [step, setStep] = useState<'sanctuary' | 'region'>(
    hasChoices || isLastRound ? 'sanctuary' : 'region'
  )
  const [pickedSanctuary, setPickedSanctuary] = useState<number | null>(null)

  const advance = () => setStep(isLastRound ? 'sanctuary' : 'region')

  return (
    <div className="border-2 border-earth-brown/40 rounded-xl bg-parch-light/80 p-4 shadow-parchment">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <StepDot filled={step === 'sanctuary'} label="1 · 성소" />
        {!isLastRound && (
          <>
            <span className="text-earth-brown/50 text-xs">→</span>
            <StepDot filled={step === 'region'} label="2 · 지역" />
          </>
        )}
      </div>

      {step === 'sanctuary' && (
        <SanctuaryStep
          choices={humanSanctuaryChoices}
          pickedId={pickedSanctuary}
          onPick={setPickedSanctuary}
          isLastRound={isLastRound}
          onSkip={() => {
            setPickedSanctuary(null)
            if (isLastRound) onSubmit(null, null)
            else advance()
          }}
          onConfirm={() => {
            if (isLastRound) onSubmit(null, pickedSanctuary)
            else advance()
          }}
        />
      )}

      {step === 'region' && !isLastRound && (
        <RegionStep
          market={regionMarket}
          humanHand={humanHand}
          pickedSanctuaryId={pickedSanctuary}
          humanSanctuaryChoices={humanSanctuaryChoices}
          onPick={(region) => onSubmit(region, pickedSanctuary)}
        />
      )}
    </div>
  )
}

function StepDot({ filled, label }: { filled: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase
                     ${filled ? 'text-sunset-deep font-bold' : 'text-earth-brown/50'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${filled ? 'bg-sunset' : 'bg-earth-brown/30'}`} />
      {label}
    </span>
  )
}

function SanctuaryStep({
  choices, pickedId, onPick, onSkip, onConfirm, isLastRound,
}: {
  choices: readonly SanctuaryCard[]
  pickedId: number | null
  onPick: (id: number | null) => void
  onSkip: () => void
  onConfirm: () => void
  isLastRound: boolean
}) {
  // No sanctuary access this round.
  if (choices.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="text-center">
          <div className="font-display text-lg text-earth-brown tracking-widest">
            ✦ 성소 획득 실패
          </div>
          <div className="font-mono text-[10px] text-earth-brown mt-1">
            {isLastRound
              ? '이번엔 성소를 뽑지 못함'
              : '직전 라운드보다 낮은 번호 · 오름차순 유지 시 다음 기회'}
          </div>
        </div>
        <SunsetCTA size="sm" onClick={onSkip}>
          {isLastRound ? '완료 →' : '다음 →'}
        </SunsetCTA>
      </div>
    )
  }

  // Choices exist — pick one or skip all.
  return (
    <div className="flex flex-col gap-3">
      <div className="text-center">
        <div className="font-display text-lg text-gold tracking-widest font-bold"
             style={{ textShadow: '0 0 8px rgba(212,165,116,0.6)' }}>
          ✦ {choices.length}장 중 1장 선택
        </div>
        <div className="font-mono text-[10px] text-earth-brown mt-1">
          나머지는 성소 덱 하단으로
        </div>
      </div>

      <div className="flex justify-center gap-3 flex-wrap max-h-[380px] overflow-y-auto py-2">
        {choices.map((s) => (
          <SanctuaryCardView
            key={s.id}
            card={s}
            size="md"
            selected={pickedId === s.id}
            onClick={() => onPick(pickedId === s.id ? null : s.id)}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 mt-1">
        <SunsetCTA variant="ghost" size="sm" onClick={onSkip}>모두 반환 →</SunsetCTA>
        <SunsetCTA
          size="sm"
          disabled={pickedId === null}
          onClick={onConfirm}
        >
          획득 → {isLastRound ? '' : '지역 뽑기'}
        </SunsetCTA>
      </div>
    </div>
  )
}

function RegionStep({
  market, humanHand, pickedSanctuaryId, humanSanctuaryChoices, onPick,
}: {
  market: readonly RegionCard[]
  humanHand: readonly RegionCard[]
  pickedSanctuaryId: number | null
  humanSanctuaryChoices: readonly SanctuaryCard[]
  onPick: (c: RegionCard) => void
}) {
  const pickedSanctuary = pickedSanctuaryId != null
    ? humanSanctuaryChoices.find((s) => s.id === pickedSanctuaryId)
    : null

  return (
    <div className="flex flex-col gap-3">
      <div className="text-center">
        <div className="font-display text-lg text-sunset-deep tracking-widest font-bold">
          🎴 지역 카드 뽑기
        </div>
        <div className="font-mono text-[10px] text-earth-brown mt-1">
          시장에서 1장 → 손패로 (다음 라운드 후보)
        </div>
        {pickedSanctuary && (
          <div className="mt-1.5 font-mono text-[9px] text-gold font-bold uppercase">
            ✓ 성소 <span className="font-serif italic normal-case">{pickedSanctuary.name}</span> 함께 획득
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1 justify-items-center">
        {market.map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c)}
            className="hover:-translate-y-1 transition-transform"
          >
            <RegionCardView card={c} size="sm" />
          </button>
        ))}
      </div>

      {/* Current hand snapshot */}
      <div className="mt-1">
        <div className="text-center font-mono text-[9px] tracking-widest text-earth-brown uppercase mb-1">
          현재 내 손패 · {humanHand.length}장
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
