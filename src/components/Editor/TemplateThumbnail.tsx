import type { TemplateType } from '../../types/worksheet'

/**
 * Schematyczne miniatury szablonów rysowane w SVG.
 *
 * Miniatury są rysunkami, a nie pomniejszonym podglądem prawdziwej karty: przy 64 pikselach
 * szczegóły i tak zlałyby się w plamę, a rysowanie pełnego szablonu dla każdej z osiemnastu
 * kafelek spowalniałoby wybór. Zero plików graficznych - wszystko w kodzie, więc działa offline
 * i nie rozjeżdża się przy zmianie motywu.
 */

const STROKE = '#334155'
const ACCENT = '#2563eb'
const SOFT = '#cbd5e1'

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
      <rect x="4" y="2" width="56" height="60" rx="3" fill="#ffffff" stroke={SOFT} strokeWidth="1.5" />
      {children}
    </svg>
  )
}

/** Poziome kreski udające tekst - powtarzają się w kilku miniaturach. */
function TextLines({ y, count = 3, width = 34 }: { y: number; count?: number; width?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <line
          key={i}
          x1="12"
          y1={y + i * 6}
          x2={12 + width}
          y2={y + i * 6}
          stroke={SOFT}
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </>
  )
}

const THUMBNAILS: Record<TemplateType, React.ReactNode> = {
  wordSearch: (
    <>
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 5 }).map((_, col) => (
          <text
            key={`${row}-${col}`}
            x={14 + col * 9}
            y={16 + row * 9}
            fontSize="7"
            fill={row === 2 && col > 0 && col < 4 ? ACCENT : STROKE}
            textAnchor="middle"
          >
            {'AKOTMSEZBLRYPWU'[(row * 5 + col) % 15]}
          </text>
        )),
      )}
      <line x1="20" y1="31" x2="42" y2="31" stroke={ACCENT} strokeWidth="1.5" opacity="0.5" />
    </>
  ),
  maze: (
    <>
      <rect x="12" y="10" width="40" height="40" fill="none" stroke={STROKE} strokeWidth="1.5" />
      <path
        d="M12 22 h12 M32 10 v14 M40 20 h12 M20 30 h20 M24 38 v12 M32 30 v12 M40 38 h12 M20 42 h8"
        stroke={STROKE}
        strokeWidth="1.5"
        fill="none"
      />
      <path d="M12 16 h8 v10 h12 v12 h12 v14" stroke={ACCENT} strokeWidth="2" fill="none" opacity="0.6" />
    </>
  ),
  coloring: (
    <>
      <circle cx="32" cy="32" r="20" fill="none" stroke={STROKE} strokeWidth="1.5" />
      <circle cx="32" cy="32" r="12" fill="none" stroke={STROKE} strokeWidth="1.5" />
      <circle cx="32" cy="32" r="5" fill="none" stroke={STROKE} strokeWidth="1.5" />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4
        return (
          <line
            key={i}
            x1={32 + Math.cos(angle) * 12}
            y1={32 + Math.sin(angle) * 12}
            x2={32 + Math.cos(angle) * 20}
            y2={32 + Math.sin(angle) * 20}
            stroke={STROKE}
            strokeWidth="1.5"
          />
        )
      })}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4 + Math.PI / 8
        return (
          <circle key={i} cx={32 + Math.cos(angle) * 16} cy={32 + Math.sin(angle) * 16} r="2.4" fill={ACCENT} opacity="0.35" />
        )
      })}
    </>
  ),
  math: (
    <>
      {[0, 1, 2].map((row) => (
        <g key={row}>
          <text x="13" y={22 + row * 13} fontSize="9" fill={STROKE}>
            {['4 +', '7 −', '3 ×'][row]}
          </text>
          <text x="30" y={22 + row * 13} fontSize="9" fill={STROKE}>
            {['2 =', '5 =', '2 ='][row]}
          </text>
          <rect
            x="44"
            y={14 + row * 13}
            width="11"
            height="11"
            rx="2"
            fill="none"
            stroke={ACCENT}
            strokeWidth="1.5"
          />
        </g>
      ))}
    </>
  ),
  pattern: (
    <>
      {[0, 1, 2].map((row) => (
        <g key={row}>
          <line x1="10" y1={14 + row * 15} x2="54" y2={14 + row * 15} stroke={SOFT} strokeWidth="1" />
          <line x1="10" y1={26 + row * 15} x2="54" y2={26 + row * 15} stroke={SOFT} strokeWidth="1" />
          <path
            d={
              row === 0
                ? 'M10 26 q5 -12 10 0 q5 -12 10 0 q5 -12 10 0 q5 -12 10 0'
                : row === 1
                  ? 'M10 41 l5 -12 l5 12 l5 -12 l5 12 l5 -12 l5 12 l5 -12 l5 12'
                  : 'M10 56 q5 -12 10 0 q5 -12 10 0 q5 -12 10 0 q5 -12 10 0'
            }
            fill="none"
            stroke={row === 2 ? SOFT : STROKE}
            strokeWidth="1.5"
            strokeDasharray={row === 2 ? '3 3' : undefined}
          />
        </g>
      ))}
    </>
  ),
  crossword: (
    <>
      {[0, 1, 2, 3].map((row) => {
        const start = [14, 20, 11, 17][row]
        const cells = [4, 3, 5, 4][row]
        return (
          <g key={row}>
            {Array.from({ length: cells }).map((_, i) => (
              <rect
                key={i}
                x={start + i * 9}
                y={12 + row * 10}
                width="9"
                height="10"
                fill={start + i * 9 === 29 ? '#fef9c3' : 'none'}
                stroke={STROKE}
                strokeWidth="1.2"
              />
            ))}
          </g>
        )
      })}
      <TextLines y={58} count={1} width={40} />
    </>
  ),
  dotToDot: (
    <>
      {[
        [32, 12],
        [44, 20],
        [48, 34],
        [38, 46],
        [26, 46],
        [16, 34],
        [20, 20],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="2.4" fill={STROKE} />
          <text x={x + (x > 32 ? 6 : -6)} y={y + 2} fontSize="6" fill={ACCENT} textAnchor="middle">
            {i + 1}
          </text>
        </g>
      ))}
    </>
  ),
  clock: (
    <>
      <circle cx="32" cy="30" r="18" fill="none" stroke={STROKE} strokeWidth="1.8" />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * Math.PI) / 6 - Math.PI / 2
        return (
          <line
            key={i}
            x1={32 + Math.cos(angle) * 16}
            y1={30 + Math.sin(angle) * 16}
            x2={32 + Math.cos(angle) * 14}
            y2={30 + Math.sin(angle) * 14}
            stroke={STROKE}
            strokeWidth="1.2"
          />
        )
      })}
      <line x1="32" y1="30" x2="32" y2="20" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="30" x2="41" y2="34" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="22" y="51" width="20" height="9" rx="2" fill="none" stroke={ACCENT} strokeWidth="1.5" />
    </>
  ),
  handwriting: (
    <>
      {[0, 1, 2].map((row) => (
        <g key={row}>
          <line x1="10" y1={14 + row * 16} x2="54" y2={14 + row * 16} stroke="#93c5fd" strokeWidth="1.2" />
          <line
            x1="10"
            y1={21 + row * 16}
            x2="54"
            y2={21 + row * 16}
            stroke={SOFT}
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <line x1="10" y1={28 + row * 16} x2="54" y2={28 + row * 16} stroke="#fca5a5" strokeWidth="1.2" />
        </g>
      ))}
      <text x="13" y="28" fontSize="13" fill={STROKE} fontFamily="'Playwrite PL', cursive">
        ala
      </text>
      <text x="13" y="44" fontSize="13" fill={SOFT} fontFamily="'Playwrite PL', cursive">
        ala
      </text>
    </>
  ),
  choice: (
    <>
      <TextLines y={13} count={1} width={40} />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={11 + i * 15}
          y="26"
          width="12"
          height="12"
          rx="2"
          fill="none"
          stroke={i === 1 ? ACCENT : STROKE}
          strokeWidth={i === 1 ? 2 : 1.5}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={17 + i * 15} cy="48" r="4" fill="none" stroke={STROKE} strokeWidth="1.5" />
      ))}
    </>
  ),
  matchPairs: (
    <>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="11" y={14 + i * 14} width="12" height="12" rx="2" fill="none" stroke={STROKE} strokeWidth="1.5" />
          <rect x="41" y={14 + i * 14} width="12" height="12" rx="2" fill="none" stroke={STROKE} strokeWidth="1.5" />
        </g>
      ))}
      <path d="M23 20 L41 48 M23 34 L41 20 M23 48 L41 34" stroke={ACCENT} strokeWidth="1.5" fill="none" opacity="0.7" />
    </>
  ),
  count: (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <circle
          key={i}
          cx={15 + (i % 3) * 12}
          cy={20 + Math.floor(i / 3) * 12}
          r="4.5"
          fill="none"
          stroke={STROKE}
          strokeWidth="1.5"
        />
      ))}
      <rect x="40" y="38" width="16" height="14" rx="2" fill="none" stroke={ACCENT} strokeWidth="1.5" />
      <text x="48" y="48" fontSize="9" fill={ACCENT} textAnchor="middle">
        ?
      </text>
    </>
  ),
  yesNo: (
    <>
      <circle cx="32" cy="22" r="8" fill="none" stroke={STROKE} strokeWidth="1.5" />
      <rect x="11" y="38" width="18" height="14" rx="3" fill="none" stroke={STROKE} strokeWidth="1.5" />
      <rect x="35" y="38" width="18" height="14" rx="3" fill="none" stroke={STROKE} strokeWidth="1.5" />
      <path d="M15 45 l3 3 l6 -7" stroke={ACCENT} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M40 41 l8 8 M48 41 l-8 8" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  sequence: (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={9 + i * 10}
          y="26"
          width="8"
          height="12"
          rx="2"
          fill={i < 3 ? 'none' : '#f8fafc'}
          stroke={i < 3 ? STROKE : ACCENT}
          strokeWidth="1.5"
          strokeDasharray={i < 3 ? undefined : '3 2'}
        />
      ))}
      <text x="53" y="36" fontSize="9" fill={ACCENT}>
        ?
      </text>
    </>
  ),
  cutCards: (
    <>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={12 + (i % 2) * 21}
          y={14 + Math.floor(i / 2) * 21}
          width="19"
          height="19"
          rx="2"
          fill="none"
          stroke={STROKE}
          strokeWidth="1.3"
          strokeDasharray="3 2"
        />
      ))}
      <path d="M46 50 l6 6 M52 50 l-6 6" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  sameOrDifferent: (
    <>
      <rect x="24" y="12" width="16" height="14" rx="2" fill="none" stroke={ACCENT} strokeWidth="2" />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={11 + i * 15}
          y="36"
          width="13"
          height="14"
          rx="2"
          fill="none"
          stroke={STROKE}
          strokeWidth="1.5"
        />
      ))}
    </>
  ),
  categorize: (
    <>
      <rect x="10" y="30" width="20" height="24" rx="3" fill="none" stroke={STROKE} strokeWidth="1.5" />
      <rect x="34" y="30" width="20" height="24" rx="3" fill="none" stroke={STROKE} strokeWidth="1.5" />
      <circle cx="20" cy="16" r="4.5" fill="none" stroke={STROKE} strokeWidth="1.5" />
      <rect x="39" y="12" width="9" height="9" rx="1.5" fill="none" stroke={STROKE} strokeWidth="1.5" />
      <path d="M20 22 v6 M44 22 v6" stroke={ACCENT} strokeWidth="1.5" strokeDasharray="2 2" />
    </>
  ),
}

export function TemplateThumbnail({ template }: { template: TemplateType }) {
  return <Frame>{THUMBNAILS[template]}</Frame>
}
