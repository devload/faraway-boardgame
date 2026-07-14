import { test, expect, type Page } from '@playwright/test'

/**
 * Faraway solo E2E — 3 runs at iPhone SE portrait (375×812).
 *
 * Each run applies a different picking strategy so we exercise both
 * ascending-friendly play (low-first) and the reverse-scoring gambit
 * (holding highs for late rounds), plus a clue-focused pass.
 *
 * We interact strictly via the visible UI so the same clicks a human
 * would perform are tested — including phase transitions, sanctuary
 * chooser flow, R8 special rule, and result ceremony scrolling.
 */

type Strategy = 'low' | 'high' | 'clue'

type CardInfo = {
  el: import('@playwright/test').Locator
  index: number
  id: number
  hasClue: boolean
}

/** Read the printed number + clue badge presence from a card slot. */
async function readCards(cards: import('@playwright/test').Locator): Promise<CardInfo[]> {
  const count = await cards.count()
  const infos: CardInfo[] = []
  for (let i = 0; i < count; i++) {
    const el = cards.nth(i)
    // The number is the first font-display block inside the card
    const numText = await el.locator('.font-display').first().textContent()
    const idMatch = numText?.match(/\d+/)
    const id = idMatch ? parseInt(idMatch[0], 10) : NaN
    // Clue badge: card top-right shows 📜 if clues > 0
    const html = await el.innerHTML()
    const hasClue = html.includes('📜')
    infos.push({ el, index: i, id, hasClue })
  }
  return infos
}

/**
 * Pick from a card list according to the round's strategy.
 * `round` is the 1-indexed round number (1..8) so 'high' can rotate
 * behaviour late.
 */
function chooseCard(cards: CardInfo[], strategy: Strategy, round: number): CardInfo {
  const sortedAsc = [...cards].sort((a, b) => a.id - b.id)
  const sortedDesc = [...cards].sort((a, b) => b.id - a.id)
  switch (strategy) {
    case 'low':
      // Prefer lowest number — win draft priority.
      return sortedAsc[0]
    case 'high': {
      // Try to hold high cards for late rounds. In early rounds play
      // the lowest; from R6 onward release the highest we have.
      if (round <= 5) return sortedAsc[0]
      return sortedDesc[0]
    }
    case 'clue': {
      // Prefer cards with a clue badge; break ties by lowest number.
      const cluey = cards.filter((c) => c.hasClue)
      if (cluey.length > 0) return cluey.sort((a, b) => a.id - b.id)[0]
      return sortedAsc[0]
    }
  }
}

async function screenshot(page: Page, run: number, step: string) {
  const path = `e2e/screenshots/round-${run}/${step}.png`
  await page.screenshot({ path, fullPage: true })
}

async function waitForPhaseChip(page: Page, roundLabel: string) {
  // Chip in header reads "R{n}/8"
  await expect(page.locator('text=' + roundLabel)).toBeVisible({ timeout: 10_000 })
}

/**
 * Play the human's explore turn: read the 3 hand cards inside SelectPhase
 * and click one according to strategy.
 */
async function playExplore(page: Page, strategy: Strategy, round: number): Promise<number> {
  // The Explore panel has the exact prompt text — scope to the container
  // that also holds the hand cards. The hand cards live in a flex row
  // right below that prompt.
  const explorePrompt = page.locator('text=/손패 3장 중/')
  await expect(explorePrompt).toBeVisible({ timeout: 10_000 })

  // Hand cards are RegionCardView size="md" — 110px wide. But we can't
  // rely on size classes alone. Scope by proximity: the row directly
  // under the prompt inside SelectPhase.
  const panel = explorePrompt.locator('..')
  // Cards: divs with data-* — no test ids. Use role fallback: they render
  // as clickable divs with a specific width class 'w-[110px]'.
  const handCards = panel.locator('div.w-\\[110px\\]')
  await expect(handCards.first()).toBeVisible()
  const infos = await readCards(handCards)
  const pick = chooseCard(infos, strategy, round)
  await pick.el.click()
  return pick.id
}

/**
 * Drive the draft panel: pick sanctuary (or skip), then pick region
 * (unless last round). Handles the case where sanctuary chooser is
 * absent (no sanctuary access this round).
 */
async function playDraft(page: Page, opts: {
  strategy: Strategy
  round: number
  run: number
  onChooserOpen?: () => Promise<void>
}): Promise<{
  sanctuaryChoicesShown: number
  pickedSanctuary: boolean
  pickedRegionId: number | null
  regionMarketSize: number
  deadEndForced: boolean
}> {
  // Wait for draft panel to appear — step indicator "1 · 성소" is always
  // rendered inside the panel regardless of which sub-step is active.
  await expect(page.locator('text=/1 · 성소/')).toBeVisible({ timeout: 15_000 })

  let sanctuaryChoicesShown = 0
  let pickedSanctuary = false

  // Three sub-states of the sanctuary step:
  //   a) chooser heading "N장 중 1장 선택" visible → real chooser
  //   b) "성소 획득 실패" visible → 0-choice info panel with a skip CTA
  //   c) neither visible → DraftPanel started directly on 'region' step
  //      because humanSanctuaryChoices is empty (R1 rule or non-ascending)
  const chooserHeading = page.locator('text=/장 중 1장 선택/')
  const failHeading = page.locator('text=/성소 획득 실패/')

  const chooserVisible = await chooserHeading.isVisible().catch(() => false)
  const failVisible = await failHeading.isVisible().catch(() => false)

  let deadEndForced = false

  if (chooserVisible) {
    const headingText = await chooserHeading.textContent()
    const m = headingText?.match(/(\d+)장 중/)
    sanctuaryChoicesShown = m ? parseInt(m[1], 10) : 0

    // Capture chooser screenshot (only once per run when we see multi-card)
    if (opts.onChooserOpen && sanctuaryChoicesShown >= 2) {
      await opts.onChooserOpen()
    }

    const sanctCards = page.locator('.max-h-\\[380px\\] > *')
    const n = await sanctCards.count()
    if (n > 0) {
      await sanctCards.first().click()
      pickedSanctuary = true
    }
    const confirm = page.locator('button', { hasText: /획득/ }).first()
    if (!(await confirm.isEnabled().catch(() => false))) {
      const skipAll = page.locator('button', { hasText: /모두 반환/ }).first()
      await skipAll.click()
      pickedSanctuary = false
    } else {
      await confirm.click()
    }
  } else if (failVisible) {
    const nextBtn = page.locator('button', { hasText: /완료|다음/ }).first()
    await nextBtn.click()
  }
  // else: DraftPanel opened directly on 'region' step for non-R8 rounds —
  // no sanctuary interaction required; fall through to region picking.
  // (R8 always enters sanctuary step now — either chooser or fail branch.)

  // If R8, no region step — return here.
  if (opts.round >= 8) {
    return {
      sanctuaryChoicesShown,
      pickedSanctuary,
      pickedRegionId: null,
      regionMarketSize: 0,
      deadEndForced,
    }
  }

  // Region step
  await expect(page.locator('text=/지역 카드 뽑기/')).toBeVisible({ timeout: 10_000 })
  // The market is a 3-col grid. Use the grid-cols-3 container.
  const marketContainer = page.locator('.grid.grid-cols-3').first()
  const marketButtons = marketContainer.locator('button')
  await expect(marketButtons.first()).toBeVisible()
  const count = await marketButtons.count()
  // Pull card infos from buttons: reuse readCards
  const infos = await readCards(marketButtons)
  const pick = chooseCard(infos, opts.strategy, opts.round)
  await pick.el.click()
  return {
    sanctuaryChoicesShown,
    pickedSanctuary,
    pickedRegionId: pick.id,
    regionMarketSize: count,
    deadEndForced,
  }
}

/**
 * After the human region pick auto-advances (matchStore.humanDraft runs
 * endRound synchronously when the draft is complete), the UI is already
 * on the next explore phase — or on the "여정이 끝났습니다" end panel.
 *
 * If for some reason the "다음 라운드 →" / "점수 계산 →" button is shown
 * (draft complete but not yet ended — rare code path), click it. Then
 * wait for either the next round's explore panel or the end panel.
 */
async function advanceRound(page: Page, currentRound: number) {
  const nextRoundBtn = page.locator('button', { hasText: /다음 라운드|점수 계산/ }).first()
  if (await nextRoundBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await nextRoundBtn.click()
  }
  if (currentRound < 8) {
    await waitForPhaseChip(page, `R${currentRound + 1}/8`)
  } else {
    // End of match: match scene shows "여정이 끝났습니다" then a CTA to
    // enter the ResultScene via setScene('result').
    const scoringCta = page.locator('button', { hasText: /스코어링/ })
    await expect(scoringCta).toBeVisible({ timeout: 15_000 })
    await scoringCta.click()
  }
}

async function playFullMatch(page: Page, run: number, strategy: Strategy, log: string[]) {
  await page.goto('/')
  await page.waitForLoadState('networkidle').catch(() => {})

  // Lobby
  await expect(page.locator('h1', { hasText: 'FARAWAY' })).toBeVisible()
  await screenshot(page, run, '01-lobby')

  const startBtn = page.locator('button', { hasText: /새 여정/ })
  await startBtn.click()

  const roundNotes: string[] = []
  let chooserScreenshotDone = false

  for (let round = 1; round <= 8; round++) {
    await waitForPhaseChip(page, `R${round}/8`)

    // Explore
    if (round === 1) {
      await screenshot(page, run, `02-round-1-explore`)
    }
    const pickedId = await playExplore(page, strategy, round)
    log.push(`  R${round} explore pick: card #${pickedId}`)

    // Mid-round tableau snapshot
    if (round === 4) {
      // After play but before draft ready — wait for draft panel first
      await page.locator('text=/1 · 성소/').waitFor({ timeout: 10_000 })
      await screenshot(page, run, `03-round-4-tableau`)
    }

    // R8 special snapshot — capture as the draft panel opens, before we
    // interact with it. This is when the "성소만" chip is visible and,
    // if choices=0, when the dead-end null-state renders.
    if (round === 8) {
      await page.locator('text=/1 · 성소/').waitFor({ timeout: 10_000 })
      await screenshot(page, run, `05-round-8-sanct-only`)
    }

    // Draft — pass a callback so the chooser is captured mid-open
    // (multi-card sanctuary chooser is one of the required screenshots).
    let capturedChooser = chooserScreenshotDone
    const draftInfo = await playDraft(page, {
      strategy,
      round,
      run,
      onChooserOpen: capturedChooser
        ? undefined
        : async () => {
          await screenshot(page, run, `04-sanctuary-chooser-R${round}`)
          capturedChooser = true
        },
    })
    chooserScreenshotDone = capturedChooser
    roundNotes.push(
      `R${round}: pick=#${pickedId}, sanct choices=${draftInfo.sanctuaryChoicesShown}, ` +
      `kept sanctuary=${draftInfo.pickedSanctuary}, region=#${draftInfo.pickedRegionId ?? 'none'}, ` +
      `market=${draftInfo.regionMarketSize}${draftInfo.deadEndForced ? ' [R8-DEADEND-FORCED]' : ''}`,
    )
    if (draftInfo.deadEndForced) {
      log.push(`  ⚠ R${round} dead-end: SanctuaryStep 0-choice + isLastRound = no CTA — forced via store`)
    }

    // Advance
    await advanceRound(page, round)
  }

  // Result scene
  await expect(page.locator('text=RESULT')).toBeVisible({ timeout: 15_000 })
  await screenshot(page, run, `06-result-start`)
  // Mid-reveal
  await page.waitForTimeout(4500)
  await screenshot(page, run, `07-result-mid`)
  // Wait for FINAL marker
  await expect(page.locator('text=/\\/\\/ FINAL/')).toBeVisible({ timeout: 60_000 })
  // Verdict word
  const verdict = await page.locator('div.font-display.text-4xl').first().textContent().catch(() => '?')
  // Score cards' totals — span.font-display.text-3xl inside ScoreCard
  const totalsText = await page.locator('span.font-display.text-3xl').allTextContents()
  const [humanTotalTxt, botTotalTxt] = totalsText
  log.push(`  Verdict: ${verdict?.trim()}, human=${humanTotalTxt}, bot=${botTotalTxt}`)
  // Duration line
  const durationSpans = await page.locator('span.font-display.text-sm').allTextContents()
  log.push(`  Durations: ${durationSpans.join(' / ')}`)

  // Extra: scroll to bottom and capture verdict panel (fullPage on an
  // overflow-y-auto container clips to the viewport, so the winner line
  // may sit below the fold in the top-of-page screenshot).
  const verdictEl = page.locator('div.font-display.text-4xl').first()
  await verdictEl.scrollIntoViewIfNeeded().catch(() => {})
  await screenshot(page, run, `09-result-verdict`)

  await screenshot(page, run, `08-result-final`)

  // Detect tiebreaker verbiage
  const tieText = await page.locator('text=/동점 · 여정 짧음/').isVisible().catch(() => false)
  log.push(`  Tiebreaker verbose: ${tieText ? 'YES' : 'no'}`)

  // Restart to lobby
  const restart = page.locator('button', { hasText: /다시 여정/ })
  await restart.click()
  await expect(page.locator('h1', { hasText: 'FARAWAY' })).toBeVisible()

  log.push('  Per-round: ' + roundNotes.join(' | '))
}

test.describe('Faraway solo — mobile portrait × 3 runs', () => {
  const consoleErrors: string[] = []
  const consoleWarnings: string[] = []

  test.beforeEach(({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
      else if (msg.type() === 'warning') consoleWarnings.push(msg.text())
    })
    page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message))
  })

  test('Run 1 — low-number priority (draft-first strategy)', async ({ page }) => {
    const log: string[] = ['[Run 1: low-number priority]']
    await playFullMatch(page, 1, 'low', log)
    console.log(log.join('\n'))
    console.log(`  console errors: ${consoleErrors.length}, warnings: ${consoleWarnings.length}`)
    if (consoleErrors.length > 0) console.log('  errors:', consoleErrors.slice(0, 5))
  })

  test('Run 2 — hold high numbers late (reverse-scoring gambit)', async ({ page }) => {
    const log: string[] = ['[Run 2: hold highs late]']
    await playFullMatch(page, 2, 'high', log)
    console.log(log.join('\n'))
    console.log(`  console errors: ${consoleErrors.length}, warnings: ${consoleWarnings.length}`)
    if (consoleErrors.length > 0) console.log('  errors:', consoleErrors.slice(0, 5))
  })

  test('Run 3 — clue-priority picks (Sanctuary volume)', async ({ page }) => {
    const log: string[] = ['[Run 3: clue priority]']
    await playFullMatch(page, 3, 'clue', log)
    console.log(log.join('\n'))
    console.log(`  console errors: ${consoleErrors.length}, warnings: ${consoleWarnings.length}`)
    if (consoleErrors.length > 0) console.log('  errors:', consoleErrors.slice(0, 5))
  })
})
