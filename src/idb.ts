const DB_NAME = 'WorksheetLabDB'
const DB_VERSION = 2

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('keyval')) {
        db.createObjectStore('keyval')
      }
      if (!db.objectStoreNames.contains('library')) {
        db.createObjectStore('library', { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function set(key: string, value: any): Promise<void> {
  return getDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('keyval', 'readwrite')
      const store = transaction.objectStore('keyval')
      store.put(value, key)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  })
}

export function get<T>(key: string): Promise<T | undefined> {
  return getDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('keyval', 'readonly')
      const store = transaction.objectStore('keyval')
      const getRequest = store.get(key)
      getRequest.onsuccess = () => resolve(getRequest.result)
      getRequest.onerror = () => reject(getRequest.error)
    })
  })
}

export function del(key: string): Promise<void> {
  return getDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('keyval', 'readwrite')
      const store = transaction.objectStore('keyval')
      store.delete(key)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  })
}

export interface LibraryItem {
  id: string
  name: string
  category: string
  tags: string[]
  dataUrl: string // Blob as base64 string
  createdAt: number
}

export function saveLibraryItem(item: LibraryItem): Promise<void> {
  return getDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('library', 'readwrite')
      const store = transaction.objectStore('library')
      store.put(item)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  })
}

export function getLibraryItems(): Promise<LibraryItem[]> {
  return getDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('library', 'readonly')
      const store = transaction.objectStore('library')
      const getRequest = store.getAll()
      getRequest.onsuccess = () => {
        const items = getRequest.result as LibraryItem[]
        // sort by newest first
        items.sort((a, b) => b.createdAt - a.createdAt)
        resolve(items)
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  })
}

export function deleteLibraryItem(id: string): Promise<void> {
  return getDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('library', 'readwrite')
      const store = transaction.objectStore('library')
      store.delete(id)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  })
}
