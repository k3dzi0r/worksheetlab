import { useState, useEffect, useRef } from 'react'
import { getLibraryItems, saveLibraryItem, deleteLibraryItem } from '../../idb'
import type { LibraryItem } from '../../idb'
import { createId } from '../../utils'

interface Props {
  onSelectItem: (dataUrl: string, name: string) => void
}

export function MyLibrary({ onSelectItem }: Props) {
  const [items, setItems] = useState<LibraryItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State for editing an item
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editTags, setEditTags] = useState('')

  useEffect(() => {
    loadItems()
  }, [])

  function loadItems() {
    setLoading(true)
    getLibraryItems().then((res) => {
      setItems(res)
      setLoading(false)
    }).catch((err) => {
      console.error(err)
      setLoading(false)
    })
  }

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const newItem: LibraryItem = {
          id: createId(),
          name: file.name.replace(/\.[^/.]+$/, ''), // strip extension
          category: 'Ogólne',
          tags: [],
          dataUrl: reader.result,
          createdAt: Date.now(),
        }
        saveLibraryItem(newItem).then(loadItems)
      }
    }
    reader.readAsDataURL(file)
  }

  function startEditing(item: LibraryItem) {
    setEditingItem(item)
    setEditName(item.name)
    setEditCategory(item.category)
    setEditTags(item.tags.join(', '))
  }

  function saveEdit() {
    if (!editingItem) return
    const tagsArray = editTags.split(',').map((t) => t.trim()).filter(Boolean)
    const updated: LibraryItem = {
      ...editingItem,
      name: editName,
      category: editCategory,
      tags: tagsArray,
    }
    saveLibraryItem(updated).then(() => {
      setEditingItem(null)
      loadItems()
    })
  }

  function handleDelete(id: string) {
    if (confirm('Czy na pewno chcesz usunąć ten element ze swojej biblioteki?')) {
      deleteLibraryItem(id).then(loadItems)
    }
  }

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase()
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Moja biblioteka</strong> przechowuje Twoje własne obrazy lokalnie w tej przeglądarce. 
          Możesz ich wielokrotnie używać bez konieczności ponownego wybierania plików z dysku.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 bg-white border border-gray-300 text-gray-800 font-medium py-2 px-3 rounded-lg text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          Wgraj plik do biblioteki
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      {items.length > 0 && (
        <input
          type="text"
          placeholder="Szukaj (nazwa, kategoria, tagi)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
      )}

      {loading ? (
        <p className="text-sm text-gray-500 text-center py-4">Ładowanie biblioteki...</p>
      ) : filteredItems.length === 0 && items.length > 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">Brak wyników wyszukiwania.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">Biblioteka jest pusta.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          {filteredItems.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-2 bg-white flex flex-col gap-2 relative group hover:border-blue-400">
              <div 
                className="w-full h-20 flex items-center justify-center cursor-pointer"
                onClick={() => onSelectItem(item.dataUrl, item.name)}
                title="Kliknij, aby dodać do karty"
              >
                <img src={item.dataUrl} alt={item.name} className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-800 truncate" title={item.name}>{item.name}</span>
                <span className="text-[10px] text-gray-500 truncate">{item.category}</span>
              </div>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 rounded p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => startEditing(item)}
                  className="text-gray-500 hover:text-blue-600"
                  title="Edytuj dane"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="text-gray-500 hover:text-red-600"
                  title="Usuń z biblioteki"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm flex flex-col gap-4 shadow-xl">
            <h3 className="font-semibold text-gray-900">Edytuj obraz</h3>
            
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-700">Nazwa:</span>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="border border-gray-300 rounded px-2 py-1" />
            </label>
            
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-700">Kategoria / Folder:</span>
              <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="border border-gray-300 rounded px-2 py-1" />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-700">Tagi (po przecinku):</span>
              <input type="text" value={editTags} onChange={(e) => setEditTags(e.target.value)} className="border border-gray-300 rounded px-2 py-1" />
            </label>

            <div className="flex gap-2 justify-end mt-2">
              <button type="button" onClick={() => setEditingItem(null)} className="px-3 py-1.5 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded">
                Anuluj
              </button>
              <button type="button" onClick={saveEdit} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 rounded">
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
