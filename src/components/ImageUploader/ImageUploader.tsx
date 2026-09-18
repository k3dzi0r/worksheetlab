import { useRef } from 'react'

interface ImageUploaderProps {
  onImageSelected: (dataUrl: string, fileName: string) => void
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

/** Wczytuje obraz z dysku użytkownika i zamienia go na Data URL (bez wysyłania na serwer). */
export function ImageUploader({ onImageSelected }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // pozwala wybrać ten sam plik ponownie
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Obsługiwane formaty to: PNG, JPG/JPEG, WebP.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImageSelected(reader.result, file.name)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg text-base hover:bg-blue-700"
      >
        Dodaj obraz (PNG, JPG, WebP)
      </button>
    </>
  )
}
