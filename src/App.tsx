import { motion, AnimatePresence } from 'framer-motion'
import { useUI } from './store/uiStore.ts'
import { LobbyScene } from './scenes/LobbyScene.tsx'
import { MatchScene } from './scenes/MatchScene.tsx'
import { ResultScene } from './scenes/ResultScene.tsx'
import { DustParticles } from './ui/DustParticles.tsx'

/**
 * Faraway — solo mobile fan remake.
 *
 * Three scenes for MVP:
 *   lobby  → title / start
 *   match  → 8 rounds of hand/tableau/market interaction
 *   result → reverse-scan scoring ceremony + verdict
 *
 * Scene routing is a single string in uiStore. No React Router.
 */
export default function App() {
  const scene = useUI((s) => s.scene)

  return (
    <div className="w-full h-full relative">
      {/* Ambient drifting dust across every scene for atmosphere. */}
      <DustParticles count={16} />

      <AnimatePresence mode="wait">
        <motion.div
          key={scene}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 z-10"
        >
          {scene === 'lobby' && <LobbyScene />}
          {scene === 'match' && <MatchScene />}
          {scene === 'result' && <ResultScene />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
