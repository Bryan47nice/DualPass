import { useState } from 'react'
import { Link } from 'react-router-dom'
import { t } from '@/i18n/zh-TW'
import { buildQuiz, type QuizQuestion } from '@/lib/quiz'
import { speak, ttsSupported } from '@/lib/tts'
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

export default function Quiz() {
  const lang = useUiStore((s) => s.lang)
  const jaFilter = useUiStore((s) => s.jaFilter)
  const injectMistake = useSrsStore((s) => s.injectMistake)
  const addProgress = useQuestStore((s) => s.addProgress)
  const addMistake = useMistakesStore((s) => s.add)
  const resolveMistake = useMistakesStore((s) => s.resolve)

  const [phase, setPhase] = useState<Phase>('start')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [noQuestions, setNoQuestions] = useState(false)

  const filter = lang === 'ja' ? jaFilter : undefined
  const accentBg = lang === 'en' ? 'bg-sky-500 active:bg-sky-600' : 'bg-rose-500 active:bg-rose-600'
  const ttsLang: 'ja-JP' | 'en-US' = lang === 'en' ? 'en-US' : 'ja-JP'

  const current = questions[index]

  function begin() {
    const qs = buildQuiz(lang, filter, QUIZ_SIZE)
    setQuestions(qs)
    setIndex(0)
    setChosen(null)
    setCorrectCount(0)
    setNoQuestions(qs.length === 0)
    setPhase(qs.length === 0 ? 'start' : 'playing')
  }

  function choose(i: number) {
    if (chosen !== null || !current) return
    setChosen(i)
    const isCorrect = i === current.answerIndex
    if (isCorrect) {
      setCorrectCount((c) => c + 1)
      resolveMistake(current.itemId) // 之前錯的這次對了 → 標記已解決
    } else {
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
        {noQuestions && <p className="mb-4 text-sm text-amber-400">{t.quiz.empty}</p>}
        <button
          onClick={begin}
          className={`rounded-xl px-8 py-4 font-semibold text-white ${accentBg}`}
        >
          {t.quiz.start}
        </button>
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
            onClick={begin}
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
  const answered = chosen !== null

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <header className="mb-4 flex items-center justify-between text-sm text-slate-400">
        <span>{tpl(t.quiz.question, { i: index + 1, n: questions.length })}</span>
        <span className="tabular-nums text-emerald-400">✓ {correctCount}</span>
      </header>

      {/* 題幹 */}
      <div className="rounded-2xl bg-slate-800 p-6 text-center">
        <p className="mb-2 text-xs text-slate-500">
          {current.mode === 'toMeaning' ? t.quiz.pickMeaning : t.quiz.pickWord}
        </p>
        <div className="flex items-center justify-center gap-2">
          <span
            lang={current.promptIsJa ? 'ja' : 'en'}
            className={`font-bold ${current.prompt.length > 10 ? 'text-xl' : 'text-3xl'}`}
          >
            {current.prompt}
          </span>
          {current.promptIsJa && ttsSupported() && (
            <button
              onClick={() => speak(current.prompt, ttsLang)}
              aria-label={t.flashcards.play}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 active:bg-slate-700"
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
