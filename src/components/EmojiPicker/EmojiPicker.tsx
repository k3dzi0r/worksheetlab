import { useMemo, useState } from 'react'
import { EMOJIS, EMOJI_CATEGORIES } from '../../data/emojis'
import type { EmojiEntry } from '../../data/emojis'

interface EmojiPickerProps {
  onSelect: (emoji: EmojiEntry) => void
}

/** Prosty picker emoji z wyszukiwarką i kategoriami. */
export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('Wszystkie')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return EMOJIS.filter((entry) => {
      const matchesCategory = category === 'Wszystkie' || entry.category === category
      const matchesSearch =
        query.length === 0 ||
        entry.name.toLowerCase().includes(query) ||
        entry.keywords.some((keyword) => keyword.toLowerCase().includes(query))
      return matchesCategory && matchesSearch
    })
  }, [search, category])

  return (
    <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Szukaj emoji (np. jabłko, pies)..."
        className="w-full border border-gray-300 rounded px-3 py-2 mb-3 text-base"
      />

      <div className="flex flex-wrap gap-2 mb-3">
        {['Wszystkie', ...EMOJI_CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded text-sm border ${
              category === cat
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-64 overflow-y-auto">
        {filtered.map((entry) => (
          <button
            key={entry.emoji + entry.name}
            type="button"
            title={entry.name}
            onClick={() => onSelect(entry)}
            className="text-2xl p-2 rounded hover:bg-gray-200"
          >
            {entry.emoji}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-gray-400 text-sm py-4 text-center">Brak wyników.</p>
        )}
      </div>
    </div>
  )
}
