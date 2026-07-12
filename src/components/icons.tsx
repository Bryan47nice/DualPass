/**
 * 手寫 inline SVG 圖示（零依賴）。統一 24×24 viewBox、stroke 風格，
 * 顏色繼承 currentColor，大小由 className 控制（預設 w-5 h-5）。
 */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { className?: string }

function base(props: IconProps) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: props.className ?? 'h-5 w-5',
    ...props,
  }
}

/** 總覽：房子 */
export function IconHome(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
    </svg>
  )
}

/** 單字卡：疊起來的卡片 */
export function IconCards(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="7" width="14" height="12" rx="2" />
      <path d="M7 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2" />
    </svg>
  )
}

/** 刷題：鉛筆寫在紙上 */
export function IconQuiz(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
      <path d="m18.5 2.5 3 3L13 14l-4 1 1-4 8.5-8.5Z" />
    </svg>
  )
}

/** 錯題本：書 */
export function IconBook(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
    </svg>
  )
}

/** 設定：齒輪（簡化八角） */
export function IconSettings(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08A1.7 1.7 0 0 0 10.1 3.1V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.03Z" />
    </svg>
  )
}

/** 發音：喇叭 + 音波 */
export function IconSpeaker(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  )
}

/** streak：火焰 */
export function IconFlame(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 22c4.4 0 7-2.9 7-6.6 0-3.2-2.2-5.2-3.7-7C13.9 6.6 13 4.9 13 2c-3 2-4.4 4.4-4.6 6.9-.1 1.3.2 2.4.6 3.4-.9-.3-1.7-1-2.2-2C5.4 11.6 5 13.3 5 15.4 5 19.1 7.6 22 12 22Z" />
    </svg>
  )
}

/** 任務：圓圈勾（done 用實心） */
export function IconCheckCircle({ done, ...props }: IconProps & { done?: boolean }) {
  return (
    <svg {...base(props)} fill={done ? 'currentColor' : 'none'}>
      <circle cx="12" cy="12" r="9" />
      {done && (
        <path d="m8.5 12 2.5 2.5 4.5-5" stroke="#0f172a" strokeWidth="2.5" fill="none" />
      )}
    </svg>
  )
}
