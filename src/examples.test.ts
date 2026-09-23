import { describe, expect, it } from 'vitest'
import { EXAMPLE_THEMES, WORKSHEET_EXAMPLES } from './examples'
import { buildCrossword, parseCrosswordLines } from './crossword'
import { generateWordSearch, parseWords } from './wordSearch'
import { applyExample, createBlankProject } from './projectFactory'
import { parseProjectJson } from './worksheetIO'
import { TEMPLATE_OPTIONS } from './types/worksheet'

describe('przykładowe karty', () => {
  it('mają unikalne id i znane szablony', () => {
    const ids = WORKSHEET_EXAMPLES.map((example) => example.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const example of WORKSHEET_EXAMPLES) {
      expect(TEMPLATE_OPTIONS.some((option) => option.value === example.template)).toBe(true)
    }
  })

  it('każdy temat ma co najmniej jeden przykład', () => {
    for (const theme of EXAMPLE_THEMES.filter((theme) => theme.value !== 'all')) {
      expect(WORKSHEET_EXAMPLES.some((example) => example.theme === theme.value), theme.label).toBe(true)
    }
  })

  // Krzyżówka z hasłem, w której brakuje litery, wygląda na kartce na zepsutą.
  it.each(WORKSHEET_EXAMPLES.filter((example) => example.template === 'crossword').map((example) => [example.title, example]))(
    'krzyżówka „%s" układa całe hasło z wszystkich słów',
    (_title, example) => {
      const crossword = buildCrossword(parseCrosswordLines(example.task.crosswordWords ?? ''), {
        keyword: example.task.crosswordKeyword ?? '',
        seed: 1,
      })
      expect(example.task.crosswordKeyword, 'przykład powinien mieć hasło').toBeTruthy()
      expect(crossword.missingLetters).toEqual([])
      expect(crossword.unusedWords).toEqual([])
      expect(crossword.entries.every((entry) => entry.clue.length > 0)).toBe(true)
    },
  )

  it.each(WORKSHEET_EXAMPLES.filter((example) => example.template === 'wordSearch').map((example) => [example.title, example]))(
    'wykreślanka „%s" mieści wszystkie słowa',
    (_title, example) => {
      const size = example.task.wordSearchGridSize ?? 10
      // Kilka ziaren, bo układ jest losowy, a karta ma działać przy każdym wariancie.
      for (let seed = 1; seed <= 20; seed++) {
        const result = generateWordSearch(parseWords(example.task.wordSearchWords ?? ''), {
          cols: size,
          rows: size,
          allowHorizontal: true,
          allowVertical: true,
          allowDiagonals: false,
          allowReverse: false,
          filler: 'random',
          seed,
        })
        expect(result.skipped, `ziarno ${seed}`).toEqual([])
      }
    },
  )

  it.each(WORKSHEET_EXAMPLES.map((example) => [example.title, example]))(
    '„%s" przeżywa zapis i odczyt projektu bez utraty ustawień',
    (_title, example) => {
      const project = applyExample(createBlankProject(), example)
      const restored = parseProjectJson(JSON.stringify(project))
      expect(restored).not.toBeNull()
      const task = restored!.pages[0].tasks[0]
      expect(task.template).toBe(example.template)
      for (const [key, value] of Object.entries(example.task)) {
        expect(task[key as keyof typeof task], key).toEqual(value)
      }
      const header = restored!.pages[0].header
      for (const [key, value] of Object.entries(example.header)) {
        expect(header[key as keyof typeof header], key).toEqual(value)
      }
    },
  )
})

describe('applyExample', () => {
  it('podmienia tylko aktywne zadanie i zachowuje orientację strony', () => {
    const project = createBlankProject()
    project.pages[0] = { ...project.pages[0], orientation: 'landscape', tasks: [...project.pages[0].tasks, ...createBlankProject().pages[0].tasks] }
    project.activeTaskIndex = 1
    const next = applyExample(project, WORKSHEET_EXAMPLES[0])
    expect(next.pages[0].tasks[0]).toBe(project.pages[0].tasks[0])
    expect(next.pages[0].tasks[1].template).toBe(WORKSHEET_EXAMPLES[0].template)
    expect(next.pages[0].tasks[1].orientation).toBe('landscape')
  })
})
