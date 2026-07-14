import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { t } from '@/i18n/zh-TW'
import { buildQuiz, type QuizMode, type QuizQuestion } from '@/lib/quiz'
import { speak, ttsSupported } from '@/lib/tts'
import { playCorrect, playWrong } from '@/lib/sfx'
import { IconSpeaker } from '@/components/icons'
import { useUiStore } from '@/stores/uiStore'
import { useSrsStore } from '@/stores/srsStore'
import { useQuestStore } from '@/stores/questStore'
import { useMistakesStore } from '@/stores/mistakesStore'

const QUIZ_SIZE = 10

type Phase = 'start' | 'playing' | 'done'

function tpl(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}

function captionFor(mode: QuizMode): string {
  switch (mode) {
    case 'toWord':
      return t.quiz.pickWord
    case 'cloze':
      return t.quiz.pickCloze
    case 'listenMeaning':
      return t.quiz.pickMeaningListen
    case 'listenWord':
      return t.quiz.pickWordListen
    default:
      return t.quiz.pickMeaning
  }
}

export default function Quiz() {
  const lang = useUiStore((s) => s.lang)
  const jaFilter = useUiStore((s) => s.jaFilter)
  const soundEnabled = useUiStore((s) => s.settings.soundEnabled !== false)
  const injectMistake = useSrsStore((s) => s.injectMistake)
  const addProgress = useQuestStore((s) => s.addProgress)
  const addMistake = useMistakesStore((s) => s.add)
  const recordCorrect = useMistakesStore((s) => s.recordCorrect)
  const mistakeEntries = useMistakesStore((s) => s.entries)

  const [searchParams] = useSearchParams()
  const [phase, setPhase] = useState<Phase>('start')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [emptyReason, setEmptyReason] = useState<'none' | 'normal' | 'retest'>('none')

  const filter = lang === 'ja' ? jaFilter : undefined
  const accentBg = lang === 'en' ? 'bg-sky-500 active:bg-sky-600' : 'bg-rose-500 active:bg-rose-600'
  const ttsLang: 'ja-JP' | 'en-US' = lang === 'en' ? 'en-US' : 'ja-JP'
  const allowTts = soundEnabled && ttsSupported()

  const current = questions[index]
  const answered = chosen !== null

  // 該語系未訂正的錯題
  const retestIds = useMemo(
    () =>
      Object.values(mistakeEntries)
        .filter((e) => !e.resolved && e.lang === lang)
        .map((e) => e.itemId),
    [mistakeEntries, lang],
  )

  function begin(retest = false) {
    let qs: QuizQuestion[]
    if (retest) {
      const ids = retestIds
      if (ids.length === 0) {
        setEmptyReason('retest')
        setPhase('start')
        return
      }
      qs = buildQuiz(lang, filter, Math.min(QUIZ_SIZE, ids.length), {
        onlyItemIds: ids,
        tts: allowTts,
      })
    } else {
      qs = buildQuiz(lang, filter, QUIZ_SIZE, { tts: allowTts })
    }
    setQuestions(qs)
    setIndex(0)
    setChosen(null)
    setCorrectCount(0)
    if (qs.length === 0) {
      setEmptyReason(retest ? 'retest' : 'normal')
      setPhase('start')
    } else {
      setEmptyReason('none')
      setPhase('playing')
    }
  }

  // ?mode=retest 進來自動開始重測（僅掛載時觸發一次）
  const autoStarted = useRef(false)
  useEffect(() => {
    if (autoStarted.current) return
    if (searchParams.get('mode') === 'retest') {
      autoStarted.current = true
      begin(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 聽力題出現時自動播放發音
  useEffect(() => {
    if (phase === 'playing' && current?.promptIsAudio && allowTts) {
      speak(current.audioText ?? current.prompt, ttsLang)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, phase])

  function choose(i: number) {
    if (chosen !== null || !current) return
    setChosen(i)
    const isCorrect = i === current.answerIndex
    if (isCorrect) {
      setCorrectCount((c) => c + 1)
      recordCorrect(current.itemId) // 推進精熟；連對達標才標記已訂正
      if (soundEnabled) playCorrect()
    } else {
      if (soundEnabled) playWrong()
      // 答錯：進 SRS 複習佇列 + 錯題本
      injectMistake(current.itemId)
      addMistake({
        itemId: current.itemId,
        deck: current.deck,
        lang,
        prompt: current.prompt,
        correctAnswer: current.choices[current.answerIndex],
        chosenAnswer: current.choices[i],
      })
    }
    // 答完自動唸出目標詞
    if (soundEnabled && ttsSupported()) {
      const word =
        current.audioText ??
        (current.mode === 'toMeaning' ? current.prompt : current.choices[current.answerIndex])
      window.setTimeout(() => speak(word, ttsLang), 380)
    }
  }

  function next() {
    if (index + 1 >= questions.length) {
      addProgress('readingDone') // 完成一輪測驗計入每日任務
      setPhase('done')
    } else {
      setIndex((n) => n + 1)
      setChosen(null)
    }
  }

  // 開始畫面
  if (phase === 'start') {
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
        <h1 className="mb-2 text-xl font-bold">{t.quiz.title}</h1>
        <p className="mb-1 text-sm text-slate-400">
          {t.quiz.scope}：{lang === 'en' ? 'TOEIC' : jaScopeLabel(jaFilter)}
        </p>
        <p className="mb-6 max-w-xs text-sm text-slate-400">
          {tpl(t.quiz.startHint, { n: QUIZ_SIZE })}
        </p>
        {emptyReason === 'normal' && <p className="mb-4 text-sm text-amber-400">{t.quiz.empty}</p>}
        {emptyReason === 'retest' && (
          <p className="mb-4 text-sm text-amber-400">{t.quiz.retestEmpty}</p>
        )}
        <button
          onClick={() => begin(false)}
          className={`rounded-xl px-8 py-4 font-semibold text-white ${accentBg}`}
        >
          {t.quiz.start}
        </button>
        {retestIds.length > 0 && (
          <button
            onClick={() => begin(true)}
            className="mt-3 rounded-xl bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-300 active:bg-slate-700"
          >
            {tpl(t.quiz.retestCount, { n: retestIds.length })}
          </button>
        )}
      </div>
    )
  }

  // 結果畫面
  if (phase === 'done') {
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
        <div className="mb-4 text-5xl font-bold">
          {correctCount}
          <span className="text-2xl text-slate-500"> / {questions.length}</span>
        </div>
        <p className="mb-1 text-lg font-semibold">{t.quiz.summaryTitle}</p>
        <p className="mb-6 text-sm text-slate-400">
          {tpl(t.quiz.score, { c: correctCount, n: questions.length })}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => begin(false)}
            className={`rounded-xl px-6 py-3 font-semibold text-white ${accentBg}`}
          >
            {t.quiz.retry}
          </button>
          <Link
            to="/mistakes"
            className="rounded-xl bg-slate-800 px-6 py-3 font-semibold text-slate-300 active:bg-slate-700"
          >
            {t.quiz.reviewWrong}
          </Link>
        </div>
      </div>
    )
  }

  // 作答畫面
  if (!current) return null

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <header className="mb-4 flex items-center justify-between text-sm text-slate-400">
        <span>{tpl(t.quiz.question, { i: index + 1, n: questions.length })}</span>
        <span className="tabular-nums text-emerald-400">✓ {correctCount}</span>
      </header>

      {/* 題幹 */}
      <div className="rounded-2xl bg-slate-800 p-6 text-center">
        <p className="mb-2 text-xs text-slate-500">{captionFor(current.mode)}</p>

        {current.promptIsAudio ? (
          // 聽力題：播放鈕，作答前不露字
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => speak(current.audioText ?? current.prompt, ttsLang)}
              aria-label={t.quiz.playAudio}
              className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-slate-200 active:bg-slate-700"
            >
              <IconSpeaker className="h-9 w-9" />
            </button>
            <span className="text-xs text-slate-500">{t.quiz.replay}</span>
            {answered && (
              <div className="mt-1">
                <span
                  lang={current.promptIsJa ? 'ja' : 'en'}
                  className="text-2xl font-bold"
                >
                  {current.prompt}
                </span>
                {current.promptReading && (
                  <div lang="ja" className="text-sm text-slate-400">
                    {current.promptReading}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // 文字題幹（含克漏字）
          <>
            <div className="flex items-center justify-center gap-2">
              <span
                lang={current.promptIsJa ? 'ja' : 'en'}
                className={`font-bold ${
                  current.mode === 'cloze'
                    ? 'text-xl leading-relaxed'
                    : current.prompt.length > 10
                      ? 'text-xl'
                      : 'text-3xl'
                }`}
              >
                {current.prompt}
              </span>
              {current.mode === 'toMeaning' && ttsSupported() && (
                <button
                  onClick={() => speak(current.prompt, ttsLang)}
                  aria-label={t.flashcards.play}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 active:bg-slate-700"
                >
                  <IconSpeaker className="h-5 w-5" />
                </button>
              )}
            </div>
            {current.promptReading && (
              <div lang="ja" className="mt-1 text-sm text-slate-400">
                {current.promptReading}
              </div>
            )}
            {answered && current.clozeTrans && (
              <div className="mt-3 text-sm text-slate-400">{current.clozeTrans}</div>
            )}
          </>
        )}
      </div>

      {/* 選項 */}
      <div className="mt-4 flex-1 space-y-3">
        {current.choices.map((c, i) => {
          const isAnswer = i === current.answerIndex
          const isChosen = i === chosen
          let cls = 'bg-slate-800 active:bg-slate-700'
          if (answered) {
            if (isAnswer) cls = 'bg-emerald-600/90 text-white'
            else if (isChosen) cls = 'bg-red-600/90 text-white'
            else cls = 'bg-slate-800 opacity-50'
          }
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={answered}
              lang={current.choicesAreJa ? 'ja' : 'en'}
              className={`w-full rounded-xl px-4 py-4 text-left text-base font-medium transition-colors ${cls}`}
            >
              {c}
            </button>
          )
        })}
      </div>

      {/* 回饋 + 下一題 */}
      {answered && (
        <div className="mt-4">
          <p
            className={`mb-2 text-center text-sm font-semibold ${
              chosen === current.answerIndex ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {chosen === current.answerIndex
              ? t.quiz.correct
              : `${t.quiz.wrong}　${t.quiz.correctAnswerIs}${current.choices[current.answerIndex]}`}
          </p>
          <button
            onClick={next}
            className={`w-full rounded-xl py-4 font-semibold text-white ${accentBg}`}
          >
            {index + 1 >= questions.length ? t.quiz.finish : t.quiz.next}
          </button>
        </div>
      )}
    </div>
  )
}

function jaScopeLabel(f: { type: string; level: string }): string {
  const type = f.type === 'vocab' ? t.flashcards.vocab : f.type === 'grammar' ? t.flashcards.grammar : t.flashcards.filterAll
  const level = f.level === 'all' ? t.flashcards.filterAll : f.level
  return `${type}・${level}`
}
