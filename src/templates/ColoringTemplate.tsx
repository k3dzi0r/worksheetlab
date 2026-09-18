import { useMemo } from 'react'
import type { WorksheetState } from '../types/worksheet'
import { COLORING_PALETTE, COLOR_COUNT_MAX, COLOR_COUNT_MIN, generateColoring, getColoringLevel } from '../coloring'
import type { CrownStyle } from '../coloring'
import { usePageSpace } from '../usePageSpace'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface ColoringTemplateProps {
  worksheet: WorksheetState
  seed: number
  showAnswerKey?: boolean
}

/** Rysunek liczymy w stałym układzie współrzędnych, a na kartkę skalujemy przez viewBox. */
const CANVAS = 1000

export function ColoringTemplate({ worksheet, seed, showAnswerKey = false }: ColoringTemplateProps) {
  const {
    coloringLevel,
    coloringMode = 'blank',
    coloringColorCount = 4,
    coloringSectors = 0,
    coloringCrown = 'auto',
    coloringStroke = 1,
    instruction,
    simpleMode = false,
  } = worksheet

  const level = getColoringLevel(coloringLevel)
  const byNumbers = coloringMode === 'numbers'
  const colorCount = Math.max(COLOR_COUNT_MIN, Math.min(coloringColorCount, COLOR_COUNT_MAX))
  const palette = COLORING_PALETTE.slice(0, colorCount)

  const { containerRef, width, height } = usePageSpace([
    coloringLevel,
    coloringMode,
    coloringColorCount,
    coloringSectors,
    coloringCrown,
    coloringStroke,
    instruction,
    worksheet.header,
    worksheet.orientation,
    simpleMode,
  ])

  const coloring = useMemo(
    () =>
      generateColoring({
        size: CANVAS,
        rings: level.rings,
        sectors: coloringSectors,
        crown: coloringCrown as CrownStyle,
        colorCount,
        seed,
        fields: byNumbers ? 'large' : 'any',
      }),
    [level.rings, coloringSectors, coloringCrown, colorCount, seed, byNumbers],
  )

  // Legenda kolorów stoi pod rysunkiem, więc rezerwujemy na nią miejsce zanim policzymy bok.
  const legendHeight = byNumbers ? 52 : 0
  // Mandala jest kwadratowa, więc mieści się w mniejszym z dostępnych wymiarów.
  // 1px zapasu na zaokrąglenia przy drukowaniu.
  const side = Math.max(0, Math.min(width, height - legendHeight) - 1)
  // Kontur musi być gruby, żeby dziecko kolorowało kredką bez wychodzenia za linię,
  // ale przy gęstym wzorze cieńszy - inaczej małe pola zlałyby się w plamę.
  const stroke = (CANVAS / 320) * (3 / level.rings + 0.6) * coloringStroke

  return (
    <div className="flex flex-col w-full">
      {instruction.trim() && (
        <div className="mb-3">
          <InstructionText instruction={instruction} simpleMode={simpleMode} />
        </div>
      )}

      {/* Kwadratowy rysunek nigdy nie wypełni prostokątnej kartki, więc centrujemy go
          w pozostałym miejscu zamiast zostawiać pustkę pod spodem. */}
      <div
        ref={containerRef}
        className="w-full overflow-hidden flex flex-col items-center justify-center"
        style={{ height: height || undefined }}
      >
        {side > 0 && (
          <svg width={side} height={side} viewBox={`0 0 ${CANVAS} ${CANVAS}`} className="block">
            {coloring.regions.map((region, index) => (
              <path
                key={index}
                d={region.path}
                // Poza kluczem odpowiedzi pola zostają białe - to one są do pokolorowania.
                fill={showAnswerKey ? palette[region.colorIndex % palette.length].hex : '#ffffff'}
                stroke="#111827"
                strokeWidth={stroke}
                strokeLinejoin="round"
                // Jednolita obręcz to dwa okręgi w jednej ścieżce - dziura musi zostać dziurą.
                fillRule="evenodd"
              />
            ))}

            {byNumbers &&
              !showAnswerKey &&
              coloring.regions.map((region, index) => {
                // `room` to promień największego kółka mieszczącego się w polu z zapasem na kontur,
                // więc cyfra tej wielkości nie dotyka linii. Poniżej progu czytelności numer i tak
                // musi się pojawić - każde pole potrzebuje swojego koloru - dlatego dostaje wtedy
                // białą otoczkę i pozostaje widoczny nawet na kresce.
                const fontSize = Math.max(
                  Math.min(region.room * 1.4, CANVAS * 0.042),
                  CANVAS * 0.019,
                )
                const needsHalo = region.room * 1.4 < CANVAS * 0.019
                return (
                  <text
                    key={`label-${index}`}
                    x={region.labelX}
                    y={region.labelY}
                    fontSize={fontSize}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#4b5563"
                    fontFamily="Andika, sans-serif"
                    stroke={needsHalo ? '#ffffff' : undefined}
                    strokeWidth={needsHalo ? fontSize * 0.3 : undefined}
                    paintOrder="stroke"
                  >
                    {(region.colorIndex % palette.length) + 1}
                  </text>
                )
              })}
          </svg>
        )}

        {byNumbers && side > 0 && (
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-3">
            {palette.map((color, index) => (
              <span key={color.name} className="flex items-center gap-2 text-sm text-gray-800 whitespace-nowrap">
                <span className="font-bold">{index + 1}</span>
                <span
                  className="inline-block w-5 h-5 rounded border border-gray-400"
                  style={{ backgroundColor: color.hex }}
                />
                {color.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
