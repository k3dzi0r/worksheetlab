import { describe, expect, it } from 'vitest'
import { parseProjectJson, parseWorksheetJson } from './worksheetIO'

const worksheet = {
  template: 'choice',
  instruction: 'Wskaż obrazek.',
  items: [],
  pairs: [],
}

describe('parseProjectJson', () => {
  it('nadaje ID także przy imporcie pojedynczej, starej karty', () => {
    const imported = parseWorksheetJson(JSON.stringify(worksheet))

    expect(imported?.id).toEqual(expect.any(String))
  })

  it('zachowuje unikalne identyfikatory stron z eksportu', () => {
    const project = parseProjectJson(
      JSON.stringify({
        pages: [{ ...worksheet, id: 'pierwsza' }, { ...worksheet, id: 'druga' }],
        activePageIndex: 1,
      }),
    )

    expect(project?.pages.map((page) => page.id)).toEqual(['pierwsza', 'druga'])
    expect(project?.activePageIndex).toBe(1)

    const roundTrip = parseProjectJson(JSON.stringify(project))
    expect(roundTrip?.pages.map((page) => page.id)).toEqual(['pierwsza', 'druga'])
  })

  it('nadaje brakujące ID i zastępuje duplikaty, aby DnD miało stabilne klucze', () => {
    const project = parseProjectJson(
      JSON.stringify({
        pages: [{ ...worksheet, id: 'powtórzone' }, { ...worksheet, id: 'powtórzone' }, worksheet],
      }),
    )
    const ids = project?.pages.map((page) => page.id) ?? []

    expect(ids).toHaveLength(3)
    expect(ids[0]).toBe('powtórzone')
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('normalizuje import mieszanych orientacji do jednej orientacji projektu', () => {
    const project = parseProjectJson(
      JSON.stringify({
        pages: [
          { ...worksheet, id: 'pion', orientation: 'portrait' },
          { ...worksheet, id: 'poziom', orientation: 'landscape' },
        ],
      }),
    )

    expect(project?.pages.map((page) => page.orientation)).toEqual(['portrait', 'portrait'])
  })

  it('wczytuje wiele niezależnych zadań na jednej stronie A4', () => {
    const project = parseProjectJson(
      JSON.stringify({
        pages: [
          {
            id: 'strona-z-zadaniami',
            orientation: 'portrait',
            tasks: [
              { ...worksheet, id: 'zadanie-obrazkowe' },
              { ...worksheet, id: 'zadanie-pisanie', template: 'handwriting' },
            ],
          },
        ],
        activeTaskIndex: 1,
      }),
    )

    expect(project?.pages[0].id).toBe('strona-z-zadaniami')
    expect(project?.pages[0].tasks.map((task) => task.id)).toEqual(['zadanie-obrazkowe', 'zadanie-pisanie'])
    expect(project?.activeTaskIndex).toBe(1)
  })
})
