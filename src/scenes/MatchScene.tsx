import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMatch } from '../store/matchStore.ts'
import { useUI } from '../store/uiStore.ts'
import { RegionCardView } from '../ui/RegionCardView.tsx'
import { Chip } from '../ui/Chip.tsx'
import { SunsetCTA } from '../ui/SunsetCTA.tsx'
import { hasSanctuaryAccess, currentDrawer, isDrawPhaseComplete } from '../game/match.ts'
import type { RegionCard, SanctuaryCard } from '../game/types.ts'
import { ICON_EMOJI } from '../game/types.ts'

export function MatchScene() {
  const state = useMatch((s) => s.state)
  const humanSelect = useMatch((s) => s.humanSelect)
  const humanDraw = useMatch((s) => s.humanDraw)
  const progress = useMatch((s) => s.progress)
  const setScene = useUI((s) => s.setScene)
  const [pickedSanctuary, setPickedSanctuary] = useState<number | null>(null)

  if (!state) return null

  // End of match → go to result.
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

  const humanBotComparison = state.selections.human && state.selections.bot ? (
    <div className="flex items-center gap-2 justify-center font-mono text-[11px] text-earth-brown">
      <span>나 <span className="font-display text-lg text-sunset-deep">{state.selections.human.id}</span></span>
      <span>vs</span>
      <span>상대 <span className="font-display text-lg text-mist-blue">{state.selections.bot.id}</span></span>
    </div>
  ) : null

  return (
    <div className="w-full h-full flex flex-col pt-safe pb-safe overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <Chip variant="sunset" size="xs">R{state.round}/8</Chip>
        <RoundDots current={state.round} total={8} />
      </div>

      {/* Opponent (bot) — thin strip up top */}
      <PlayerStrip
        who="상대"
        icon={bot.icon}
        name={bot.name}
        tableauCount={bot.tableau.length}
        sanctuaryCount={bot.sanctuaries.length}
      />

      {/* Bot tableau — mini scale */}
      <TableauStrip tableau={bot.tableau} label="상대 여정" mini />

      {/* Center feedback: reveal or draw */}
      <div className="flex-1 flex flex-col justify-center px-4 gap-3 min-h-0">
        {state.phase === 'select' && (
          <div className="text-center font-serif italic text-lg text-mist-blue">
            손패에서 카드 한 장을 선택하세요.
          </div>
        )}

        {state.phase === 'draw' && humanBotComparison}

        {state.phase === 'draw' && humanCanDraw && (
          <DrawPanel
            state={state}
            pickedSanctuary={pickedSanctuary}
            setPickedSanctuary={setPickedSanctuary}
            onPick={(region, sanctuaryId) => {
              humanDraw(region, sanctuaryId)
              setPickedSanctuary(null)
            }}
            eligibleForSanctuary={hasSanctuaryAccess(state, 'human')}
          />
        )}

        {state.phase === 'draw' && !humanCanDraw && !isDrawPhaseComplete(state) && (
          <div className="text-center font-serif italic text-mist-blue">
            상대가 뽑는 중...
          </div>
        )}

        {/* If draw phase is done (shouldn't linger visibly) auto-progress */}
        {state.phase === 'draw' && isDrawPhaseComplete(state) && (
          <div className="flex justify-center">
            <SunsetCTA onClick={progress}>다음 라운드 →</SunsetCTA>
          </div>
        )}
      </div>

      {/* My tableau */}
      <TableauStrip tableau={human.tableau} label="내 여정" />

      {/* Hand at bottom (only in select phase) */}
      <div className="px-4 pb-2 pt-3">
        {state.phase === 'select' && (
          <div className="flex justify-center gap-2">
            <AnimatePresence>
              {human.hand.map((c) => (
                <motion.div key={c.id}
                            layout
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -40, opacity: 0, scale: 0.6 }}
                            transition={{ type: 'spring', damping: 18, stiffness: 240 }}>
                  <RegionCardView card={c} size="md" onClick={() => humanSelect(c)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        {state.phase === 'draw' && (
          <div className="flex justify-center gap-1.5">
            {human.hand.map((c) => (
              <RegionCardView key={c.id} card={c} size="sm" dim />
            ))}
          </div>
        )}
      </div>

      {/* My status strip */}
      <PlayerStrip who="나" icon={human.icon} name={human.name}
                   tableauCount={human.tableau.length}
                   sanctuaryCount={human.sanctuaries.length}
                   mine />
    </div>
  )
}

function PlayerStrip({
  who, icon, name, tableauCount, sanctuaryCount, mine = false,
}: {
  who: string
  icon: string
  name: string
  tableauCount: number
  sanctuaryCount: number
  mine?: boolean
}) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 border-y ${mine ? 'border-sunset/40 bg-sunset/5' : 'border-mist-blue/20 bg-mist-blue/5'}`}>
      <span className="text-lg">{icon}</span>
      <div className="min-w-0">
        <div className="font-serif italic text-sm text-night-indigo leading-none">{name}</div>
        <div className="font-mono text-[9px] tracking-widest text-earth-brown uppercase mt-0.5">{who}</div>
      </div>
      <div className="ml-auto flex gap-2">
        <div className="text-center">
          <div className="font-display text-lg text-night-indigo leading-none">{tableauCount}</div>
          <div className="font-mono text-[8px] tracking-widest text-earth-brown uppercase">여정</div>
        </div>
        <div className="text-center">
          <div className="font-display text-lg text-gold leading-none">{sanctuaryCount}</div>
          <div className="font-mono text-[8px] tracking-widest text-earth-brown uppercase">성소</div>
        </div>
      </div>
    </div>
  )
}

function RoundDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i}
              className={`w-1.5 h-1.5 rounded-full ${i < current ? 'bg-sunset' : 'bg-earth-brown/25'}`} />
      ))}
    </div>
  )
}

function TableauStrip({
  tableau, label, mini = false,
}: {
  tableau: readonly RegionCard[]
  label: string
  mini?: boolean
}) {
  const size = mini ? 'xs' : 'sm'
  return (
    <div className="px-3 py-2">
      <div className="font-mono text-[9px] tracking-widest text-earth-brown uppercase mb-1">
        {label} · {tableau.length}/8
      </div>
      <div className="flex gap-1 overflow-x-auto">
        {Array.from({ length: 8 }).map((_, i) => {
          const card = tableau[i]
          if (card) {
            return (
              <motion.div key={`${card.id}-${i}`}
                          initial={{ y: -20, opacity: 0, rotateY: 90 }}
                          animate={{ y: 0, opacity: 1, rotateY: 0 }}
                          transition={{ type: 'spring', damping: 16, stiffness: 240 }}>
                <RegionCardView card={card} size={size} />
              </motion.div>
            )
          }
          return (
            <div key={i}
                 className={`${mini ? 'w-[70px] h-[100px]' : 'w-[86px] h-[124px]'}
                             border-2 border-dashed border-earth-brown/30 rounded-lg
                             flex items-center justify-center font-mono text-[9px] text-earth-brown/40 uppercase`}>
              {i + 1}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DrawPanel({
  state, pickedSanctuary, setPickedSanctuary, onPick, eligibleForSanctuary,
}: {
  state: { regionMarket: readonly RegionCard[]; sanctuaryMarket: readonly SanctuaryCard[] }
  pickedSanctuary: number | null
  setPickedSanctuary: (id: number | null) => void
  onPick: (region: RegionCard, sanctuaryId: number | null) => void
  eligibleForSanctuary: boolean
}) {
  return (
    <div className="flex flex-col gap-3 items-stretch">
      {/* Sanctuary picker */}
      {eligibleForSanctuary && state.sanctuaryMarket.length > 0 && (
        <div>
          <div className="font-mono text-[9px] tracking-widest text-gold uppercase mb-1 text-center">
            ✦ 성소 접근권 · 하나 선택 (스킵 가능)
          </div>
          <div className="flex justify-center gap-2">
            {state.sanctuaryMarket.map((s) => (
              <button
                key={s.id}
                onClick={() => setPickedSanctuary(pickedSanctuary === s.id ? null : s.id)}
                className={`text-left px-2 py-1.5 rounded-md border-2 text-[10px] max-w-[110px]
                            ${pickedSanctuary === s.id
                              ? 'border-gold bg-gold/15 -translate-y-0.5'
                              : 'border-night-indigo/40 bg-night-indigo/5'}
                            transition-transform`}
              >
                <div className="font-serif italic text-night-indigo text-xs leading-tight">{s.name}</div>
                <div className="font-mono text-[8px] text-earth-brown mt-1 leading-tight">{s.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Region market picker */}
      <div>
        <div className="font-mono text-[9px] tracking-widest text-earth-brown uppercase mb-1 text-center">
          지역 시장 · 하나 뽑기 (필수)
        </div>
        <div className="flex justify-center gap-2">
          {state.regionMarket.map((c) => (
            <button
              key={c.id}
              onClick={() => onPick(c, eligibleForSanctuary ? pickedSanctuary : null)}
              className="hover:-translate-y-1 transition-transform"
            >
              <RegionCardView card={c} size="sm" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Suppress unused-var TS complaint for icon table.
void ICON_EMOJI
