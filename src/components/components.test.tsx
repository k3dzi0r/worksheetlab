// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TaskStrip } from './Editor/TaskStrip'
import { MyProjectsDialog } from './MyProjectsDialog'
import { MobilePrintHelp } from './MobilePrintHelp'
import { WorksheetPreview } from './WorksheetPreview/WorksheetPreview'
import { createBlankProject, createWorksheet } from '../projectFactory'
import type { SavedProjectMeta } from '../projectLibrary'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// jsdom nie ma ResizeObservera, a szablony mierzą nim wolne miejsce na kartce.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

function stripProps(taskCount: number, activeTaskIndex = 0) {
  return {
    tasks: Array.from({ length: taskCount }, (_, index) => createWorksheet({ template: index === 0 ? 'maze' : null })),
    activeTaskIndex,
    onSelectTask: vi.fn(),
    onAddTask: vi.fn(),
    onRemoveTask: vi.fn(),
  }
}

describe('TaskStrip', () => {
  it('przy jednym zadaniu pokazuje tylko link do dodania drugiego', () => {
    const props = stripProps(1)
    render(<TaskStrip {...props} />)
    fireEvent.click(screen.getByRole('button', { name: /Dodaj drugie zadanie/ }))
    expect(props.onAddTask).toHaveBeenCalled()
    expect(screen.queryByText(/edytujesz/)).toBeNull()
  })

  it('przy kilku zadaniach mówi, które jest edytowane, i pozwala przełączyć', () => {
    const props = stripProps(2, 1)
    render(<TaskStrip {...props} />)
    expect(screen.getByText('zadanie 2')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '1. Labirynt' }))
    expect(props.onSelectTask).toHaveBeenCalledWith(0)
  })

  it('usuwa zadanie dopiero po potwierdzeniu', () => {
    const props = stripProps(2)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    render(<TaskStrip {...props} />)
    const remove = screen.getByRole('button', { name: 'Usuń zadanie 2' })
    fireEvent.click(remove)
    expect(props.onRemoveTask).not.toHaveBeenCalled()
    fireEvent.click(remove)
    expect(props.onRemoveTask).toHaveBeenCalledWith(1)
    expect(confirm).toHaveBeenCalledTimes(2)
  })
})

describe('MyProjectsDialog', () => {
  const projects: SavedProjectMeta[] = [
    { id: 'a', name: 'Jesień', customName: false, createdAt: 0, updatedAt: 1_790_000_000_000, pageCount: 2, templates: ['crossword'] },
    { id: 'b', name: 'Zegar', customName: false, createdAt: 0, updatedAt: 1_780_000_000_000, pageCount: 1, templates: ['clock'] },
  ]

  function renderDialog(overrides: Partial<Parameters<typeof MyProjectsDialog>[0]> = {}) {
    const props = {
      isOpen: true,
      projects,
      currentId: 'a',
      isPersisted: false,
      onClose: vi.fn(),
      onOpen: vi.fn(),
      onNew: vi.fn(),
      onRename: vi.fn(),
      onDuplicate: vi.fn(),
      onDelete: vi.fn(),
      onExport: vi.fn(),
      onExportAll: vi.fn(),
      onImportFile: vi.fn(),
      ...overrides,
    }
    render(<MyProjectsDialog {...props} />)
    return props
  }

  it('zawsze ostrzega, że karty są tylko w tej przeglądarce', () => {
    renderDialog()
    expect(screen.getByRole('note').textContent).toMatch(/tylko w tej przeglądarce/)
  })

  it('oznacza otwartą kartę i otwiera inną', () => {
    const props = renderDialog()
    expect(screen.getByText('otwarta')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Otwórz: Zegar' }))
    expect(props.onOpen).toHaveBeenCalledWith('b')
  })

  it('usuwa kartę dopiero po potwierdzeniu', () => {
    const props = renderDialog()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    fireEvent.click(screen.getAllByRole('button', { name: 'Usuń' })[1])
    expect(props.onDelete).not.toHaveBeenCalled()
  })

  it('zmienia nazwę po zatwierdzeniu Enterem', () => {
    const props = renderDialog()
    fireEvent.click(screen.getAllByRole('button', { name: 'Zmień nazwę' })[0])
    const input = screen.getByRole('textbox', { name: 'Nazwa karty' })
    fireEvent.change(input, { target: { value: 'Jesień 2b' } })
    fireEvent.submit(input.closest('form')!)
    expect(props.onRename).toHaveBeenCalledWith('a', 'Jesień 2b')
  })

  it('pobiera kopię wszystkich kart', () => {
    const props = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Pobierz kopię wszystkich' }))
    expect(props.onExportAll).toHaveBeenCalled()
  })

  it('pokazuje zachętę, gdy nie ma żadnych kart', () => {
    renderDialog({ projects: [] })
    expect(screen.getByText(/Nie masz jeszcze zapisanych kart/)).toBeTruthy()
  })
})

describe('MobilePrintHelp', () => {
  it('drukuje dopiero po kliknięciu, a „nie pokazuj więcej" zapamiętuje wybór', () => {
    const onPrint = vi.fn()
    render(<MobilePrintHelp isOpen onPrint={onPrint} onClose={vi.fn()} />)
    expect(onPrint).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Drukuj i nie pokazuj więcej' }))
    expect(onPrint).toHaveBeenCalled()
    expect(window.localStorage.getItem('kartolab-mobile-print-help-dismissed')).toBe('1')
  })
})

describe('WorksheetPreview', () => {
  it('kliknięcie zadania na kartce zgłasza jego numer', () => {
    const project = createBlankProject()
    const page = { ...project.pages[0], tasks: [createWorksheet({ template: null }), createWorksheet({ template: null })] }
    const onTaskClick = vi.fn()
    render(<WorksheetPreview page={page} shuffleSeed={0} activeTaskIndex={0} onTaskClick={onTaskClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Wybierz szablon dla zadania 2' }))
    expect(onTaskClick).toHaveBeenCalledWith(1)
  })

  it('strona z kluczem ma znacznik, zwykła nie', () => {
    const page = createBlankProject().pages[0]
    const { rerender } = render(<WorksheetPreview page={page} shuffleSeed={0} />)
    expect(screen.queryByText('Klucz odpowiedzi')).toBeNull()
    rerender(<WorksheetPreview page={page} shuffleSeed={0} isAnswerKeyPage />)
    expect(screen.getByText('Klucz odpowiedzi')).toBeTruthy()
  })
})
