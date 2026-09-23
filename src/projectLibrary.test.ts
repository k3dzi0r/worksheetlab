import { describe, expect, it } from 'vitest'
import { buildProjectMeta, createProjectMeta, isBlankProject, suggestProjectName, summarizeTemplates, UNTITLED_PROJECT_NAME } from './projectLibrary'
import { applyExample, createBlankProject, createWorksheet } from './projectFactory'
import { WORKSHEET_EXAMPLES } from './examples'
import { projectFileName } from './worksheetIO'
import type { ProjectState } from './types/worksheet'

function projectWith(templates: Array<ProjectState['pages'][number]['tasks'][number]['template']>): ProjectState {
  const project = createBlankProject()
  project.pages[0] = { ...project.pages[0], tasks: templates.map((template) => createWorksheet({ template })) }
  return project
}

describe('Moje karty - nazwy i podsumowanie', () => {
  it('pusta karta jest pusta, a karta z szablonem już nie', () => {
    expect(isBlankProject(createBlankProject())).toBe(true)
    expect(isBlankProject(projectWith(['maze']))).toBe(false)
  })

  it('karta z samym tytułem nie jest pusta', () => {
    const project = createBlankProject()
    project.pages[0] = { ...project.pages[0], header: { ...project.pages[0].header, title: 'Moja karta' } }
    expect(isBlankProject(project)).toBe(false)
  })

  it('nazwa pochodzi z widocznego tytułu strony', () => {
    const project = applyExample(createBlankProject(), WORKSHEET_EXAMPLES[0])
    expect(suggestProjectName(project)).toBe('Zwierzęta na wsi')
  })

  it('bez tytułu nazwa pochodzi z typów kart', () => {
    expect(suggestProjectName(projectWith(['maze', 'clock']))).toBe('Labirynt, Zegar')
    expect(suggestProjectName(projectWith(['maze', 'clock', 'math']))).toBe('Labirynt, Zegar i inne')
    expect(suggestProjectName(createBlankProject())).toBe(UNTITLED_PROJECT_NAME)
  })

  it('szablony liczone bez powtórzeń, w kolejności', () => {
    expect(summarizeTemplates(projectWith(['math', null, 'maze', 'math']))).toEqual(['math', 'maze'])
  })

  it('ręcznie nadana nazwa nie jest nadpisywana tytułem', () => {
    const project = applyExample(createBlankProject(), WORKSHEET_EXAMPLES[0])
    const custom = { ...createProjectMeta(0), name: 'Klasa 2b', customName: true }
    expect(buildProjectMeta(project, custom, 1).name).toBe('Klasa 2b')
    expect(buildProjectMeta(project, createProjectMeta(0), 1).name).toBe('Zwierzęta na wsi')
  })
})

describe('projectFileName', () => {
  const date = new Date('2026-09-23T10:00:00Z')

  it('zamienia polskie znaki i spacje', () => {
    expect(projectFileName('Żółć i Łódź - klasa 2', date)).toBe('kartolab-zolc-i-lodz-klasa-2-2026-09-23.json')
  })

  it('bez nazwy zostaje sama data', () => {
    expect(projectFileName(undefined, date)).toBe('kartolab-2026-09-23.json')
    expect(projectFileName('!!!', date)).toBe('kartolab-2026-09-23.json')
  })
})
