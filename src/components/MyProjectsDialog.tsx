import { useRef, useState } from 'react'
import { useDialogFocus } from '../hooks/useDialogFocus'
import type { SavedProjectMeta } from '../projectLibrary'
import { TEMPLATE_OPTIONS } from '../types/worksheet'
import { TemplateThumbnail } from './Editor/TemplateThumbnail'

interface MyProjectsDialogProps {
  isOpen: boolean
  projects: SavedProjectMeta[]
  currentId: string
  isPersisted: boolean
  onClose: () => void
  onOpen: (id: string) => void
  onNew: () => void
  onRename: (id: string, name: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
  onExportAll: () => void
  /** Plik z jedną kartą albo z kopią wszystkich - App rozpoznaje format. */
  onImportFile: (text: string) => void
}

const DATE_FORMAT = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Lista kart zapisanych w tej przeglądarce, z wyraźnym ostrzeżeniem, gdzie naprawdę leżą dane. */
export function MyProjectsDialog({
  isOpen,
  projects,
  currentId,
  isPersisted,
  onClose,
  onOpen,
  onNew,
  onRename,
  onDuplicate,
  onDelete,
  onExport,
  onExportAll,
  onImportFile,
}: MyProjectsDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')

  const dialogRef = useRef<HTMLElement>(null)
  useDialogFocus(dialogRef, isOpen, onClose, closeRef)

  if (!isOpen) return null

  function commitRename(id: string) {
    onRename(id, draftName)
    setEditingId(null)
  }

  return (
    <div className="support-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className="support-modal projects-dialog" role="dialog" aria-modal="true" aria-labelledby="projects-title">
        <button ref={closeRef} type="button" className="support-modal-close" onClick={onClose} aria-label="Zamknij">
          ×
        </button>
        <h2 id="projects-title">Moje karty</h2>

        <div className="projects-warning" role="note">
          <strong>⚠️ Karty są zapisane tylko w tej przeglądarce, na tym urządzeniu.</strong>
          <span>
            Znikną po wyczyszczeniu danych przeglądarki, w oknie prywatnym albo gdy przeglądarka zwolni miejsce. Na innym
            komputerze ich nie zobaczysz. Rób kopię: <b>Pobierz kopię wszystkich</b> zapisze wszystkie karty w jednym pliku, który potem wczytasz tu albo na innym komputerze.
          </span>
          {isPersisted && <span className="projects-warning-ok">Przeglądarka zgodziła się nie usuwać ich sama przy braku miejsca.</span>}
        </div>

        <div className="projects-toolbar">
          <button type="button" className="projects-new" onClick={onNew}>
            + Nowa karta
          </button>
          <button type="button" className="projects-secondary" onClick={onExportAll} disabled={projects.length === 0}>
            Pobierz kopię wszystkich
          </button>
          <label className="projects-secondary">
            Wczytaj kopię lub plik
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                file.text().then(onImportFile)
              }}
            />
          </label>
        </div>

        {projects.length === 0 ? (
          <p className="projects-empty">Nie masz jeszcze zapisanych kart. Wybierz szablon albo przykład - karta zapisze się sama.</p>
        ) : (
          <ul className="projects-list">
            {projects.map((meta) => {
              const isCurrent = meta.id === currentId
              const labels = meta.templates
                .map((template) => TEMPLATE_OPTIONS.find((option) => option.value === template)?.label)
                .filter(Boolean)
                .join(', ')
              return (
                <li key={meta.id} className={isCurrent ? 'is-current' : undefined}>
                  <button type="button" className="projects-thumb" onClick={() => onOpen(meta.id)} aria-label={`Otwórz: ${meta.name}`}>
                    {meta.templates[0] ? <TemplateThumbnail template={meta.templates[0]} /> : <span aria-hidden="true">📄</span>}
                  </button>
                  <div className="projects-info">
                    {editingId === meta.id ? (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault()
                          commitRename(meta.id)
                        }}
                      >
                        <input
                          autoFocus
                          onFocus={(event) => event.target.select()}
                          value={draftName}
                          onChange={(event) => setDraftName(event.target.value)}
                          onBlur={() => commitRename(meta.id)}
                          onKeyDown={(event) => {
                            // Escape w polu nazwy anuluje zmianę, a nie zamyka całego okna.
                            if (event.key === 'Escape') {
                              event.stopPropagation()
                              setEditingId(null)
                            }
                          }}
                          aria-label="Nazwa karty"
                          className="projects-rename"
                        />
                      </form>
                    ) : (
                      <button type="button" className="projects-name" onClick={() => onOpen(meta.id)}>
                        {meta.name}
                        {isCurrent && <span className="projects-badge">otwarta</span>}
                      </button>
                    )}
                    <span className="projects-details">
                      {DATE_FORMAT.format(meta.updatedAt)} · {meta.pageCount} {meta.pageCount === 1 ? 'strona' : meta.pageCount < 5 ? 'strony' : 'stron'}
                      {labels && ` · ${labels}`}
                    </span>
                    <span className="projects-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setDraftName(meta.name)
                          setEditingId(meta.id)
                        }}
                      >
                        Zmień nazwę
                      </button>
                      <button type="button" onClick={() => onDuplicate(meta.id)}>
                        Duplikuj
                      </button>
                      <button type="button" onClick={() => onExport(meta.id)}>
                        Pobierz
                      </button>
                      <button
                        type="button"
                        className="is-danger"
                        onClick={() => {
                          if (window.confirm(`Usunąć kartę „${meta.name}"? Tego nie da się cofnąć.`)) onDelete(meta.id)
                        }}
                      >
                        Usuń
                      </button>
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
