interface UpdateBannerProps {
  onReload: () => void
  onDismiss: () => void
}

/** Pasek „jest nowa wersja" - przeładowanie tylko na życzenie, żeby nie przerwać pracy w połowie. */
export function UpdateBanner({ onReload, onDismiss }: UpdateBannerProps) {
  return (
    <div className="update-banner print:hidden" role="status">
      <span>Jest nowa wersja KartoLabu.</span>
      <button type="button" className="update-banner-reload" onClick={onReload}>
        Odśwież
      </button>
      <button type="button" className="update-banner-dismiss" onClick={onDismiss} aria-label="Później">
        ×
      </button>
    </div>
  )
}
