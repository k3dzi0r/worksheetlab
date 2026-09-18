import { useMemo } from 'react'
import type { WorksheetState } from '../types/worksheet'
import type { ClockMode, ClockPrecision, ClockTask } from '../clockTasks'
import { formatClockTime, generateClockTasks } from '../clockTasks'
import { usePageSpace } from '../usePageSpace'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface ClockTemplateProps {
  worksheet: WorksheetState
  seed: number
  showAnswerKey?: boolean
}

/** Tarczę rysujemy w stałym układzie współrzędnych i skalujemy przez viewBox. */
const FACE = 100
/** Szerokość jednego zegara razem z podpisem, przy itemScale = 1. */
const BASE_COLUMN = 150
/** Wysokość podpisu pod tarczą w stosunku do średnicy tarczy. */
const CAPTION_RATIO = 0.42
const MAX_CLOCKS = 40

/** Co jest napisane na tarczy. */
export const CLOCK_DIALS = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'quarters', label: '12, 3, 6, 9' },
  { value: 'none', label: 'Bez cyfr' },
] as const

export type ClockDial = (typeof CLOCK_DIALS)[number]['value']

export function ClockTemplate({ worksheet, seed, showAnswerKey = false }: ClockTemplateProps) {
  const {
    clockMode = 'read',
    clockPrecision = 'hour',
    clockFormat24 = false,
    clockDial = 'all',
    clockMinuteTicks = true,
    instruction,
    itemScale = 1,
    simpleMode = false,
  } = worksheet

  const { containerRef, width, height } = usePageSpace([
    clockMode,
    clockPrecision,
    clockFormat24,
    clockDial,
    clockMinuteTicks,
    itemScale,
    instruction,
    worksheet.header,
    worksheet.orientation,
    simpleMode,
  ])

  const columnWidth = BASE_COLUMN * itemScale
  const rowHeight = columnWidth * (1 + CAPTION_RATIO)

  // Zegary wypełniają kartkę: tyle kolumn i wierszy, ile realnie się mieści.
  // 2px zapasu, żeby zaokrąglenia przy drukowaniu nie zepchnęły ostatniego wiersza na kolejną stronę.
  const columns = width > 0 ? Math.max(1, Math.floor(width / columnWidth)) : 1
  const rows = height > 0 ? Math.max(1, Math.floor((height - 2) / rowHeight)) : 1
  const count = Math.min(MAX_CLOCKS, columns * rows)

  const tasks = useMemo(
    () =>
      generateClockTasks({
        count,
        mode: clockMode as ClockMode,
        precision: clockPrecision as ClockPrecision,
        format24: clockFormat24,
        seed,
      }),
    [count, clockMode, clockPrecision, clockFormat24, seed],
  )

  // Tarcza korzysta z realnej szerokości kolumny siatki, a nie z wartości użytej do jej
  // wyliczenia - inaczej przy nierównym podziale zostawałaby niewykorzystana ramka.
  const cellWidth = columns > 0 ? width / columns : 0
  const faceSize = Math.max(0, Math.min(cellWidth * 0.94, rowHeight / (1 + CAPTION_RATIO) * 0.94))

  return (
    <div className="flex flex-col w-full">
      {instruction.trim() && (
        <div className="mb-3">
          <InstructionText instruction={instruction} simpleMode={simpleMode} />
        </div>
      )}

      <div ref={containerRef} className="w-full overflow-hidden">
        <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {tasks.map((task, index) => (
            <div key={index} className="flex flex-col items-center" style={{ height: rowHeight }}>
              <ClockFace
                task={task}
                size={faceSize}
                dial={clockDial as ClockDial}
                minuteTicks={clockMinuteTicks}
                showHands={task.task === 'read' || showAnswerKey}
              />
              <ClockCaption
                task={task}
                width={faceSize}
                format24={clockFormat24}
                showAnswerKey={showAnswerKey}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface ClockFaceProps {
  task: ClockTask
  size: number
  dial: ClockDial
  minuteTicks: boolean
  showHands: boolean
}

/** Tarcza zegara: obwód, kreski, cyfry i - zależnie od zadania - wskazówki. */
function ClockFace({ task, size, dial, minuteTicks, showHands }: ClockFaceProps) {
  const center = FACE / 2
  const radius = center - 3

  // Wskazówka godzinowa przesuwa się razem z minutami: o wpół do trzeciej stoi między 2 a 3.
  const minuteAngle = task.minute * 6
  const hourAngle = (task.hour % 12) * 30 + task.minute * 0.5

  const hand = (angle: number, length: number) => {
    const radians = ((angle - 90) * Math.PI) / 180
    return { x: center + Math.cos(radians) * length, y: center + Math.sin(radians) * length }
  }

  const hourTip = hand(hourAngle, radius * 0.5)
  const minuteTip = hand(minuteAngle, radius * 0.78)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${FACE} ${FACE}`} className="block">
      <circle cx={center} cy={center} r={radius} fill="#ffffff" stroke="#111827" strokeWidth="2" />

      {minuteTicks &&
        Array.from({ length: 60 }).map((_, i) => {
          if (i % 5 === 0) return null
          const radians = ((i * 6 - 90) * Math.PI) / 180
          return (
            <line
              key={`m-${i}`}
              x1={center + Math.cos(radians) * (radius - 2)}
              y1={center + Math.sin(radians) * (radius - 2)}
              x2={center + Math.cos(radians) * (radius - 4)}
              y2={center + Math.sin(radians) * (radius - 4)}
              stroke="#9ca3af"
              strokeWidth="0.7"
            />
          )
        })}

      {Array.from({ length: 12 }).map((_, i) => {
        const radians = ((i * 30 - 90) * Math.PI) / 180
        return (
          <line
            key={`h-${i}`}
            x1={center + Math.cos(radians) * (radius - 1)}
            y1={center + Math.sin(radians) * (radius - 1)}
            x2={center + Math.cos(radians) * (radius - 5)}
            y2={center + Math.sin(radians) * (radius - 5)}
            stroke="#111827"
            strokeWidth="1.4"
          />
        )
      })}

      {dial !== 'none' &&
        Array.from({ length: 12 }).map((_, i) => {
          const number = i === 0 ? 12 : i
          if (dial === 'quarters' && number % 3 !== 0) return null
          const radians = ((i * 30 - 90) * Math.PI) / 180
          return (
            <text
              key={`n-${i}`}
              x={center + Math.cos(radians) * (radius - 14)}
              y={center + Math.sin(radians) * (radius - 14)}
              fontSize={FACE * 0.105}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#111827"
              fontFamily="Andika, sans-serif"
            >
              {number}
            </text>
          )
        })}

      {showHands && (
        <>
          <line
            x1={center}
            y1={center}
            x2={hourTip.x}
            y2={hourTip.y}
            stroke="#111827"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <line
            x1={center}
            y1={center}
            x2={minuteTip.x}
            y2={minuteTip.y}
            stroke="#111827"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
      <circle cx={center} cy={center} r="2" fill="#111827" />
    </svg>
  )
}

interface ClockCaptionProps {
  task: ClockTask
  width: number
  format24: boolean
  showAnswerKey: boolean
}

/**
 * Podpis pod tarczą. Przy odczytywaniu godziny jest to puste pole do wpisania,
 * przy rysowaniu wskazówek - podana godzina.
 */
function ClockCaption({ task, width, format24, showAnswerKey }: ClockCaptionProps) {
  const time = formatClockTime(task.hour, task.minute, format24)
  const fontSize = Math.max(12, width * 0.19)

  if (task.task === 'draw') {
    return (
      <span className="font-semibold text-gray-900 mt-1" style={{ fontSize }}>
        {time}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center justify-center border-2 rounded mt-1 ${
        showAnswerKey ? 'border-gray-300 text-blue-600 font-semibold' : 'border-gray-400'
      }`}
      style={{ width: width * 0.66, height: fontSize * 1.5, fontSize }}
    >
      {showAnswerKey ? time : ''}
    </span>
  )
}
