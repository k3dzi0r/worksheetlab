export function set(key: string, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('WorksheetLabDB', 1)
    
    request.onupgradeneeded = () => {
      request.result.createObjectStore('keyval')
    }
    
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction('keyval', 'readwrite')
      const store = transaction.objectStore('keyval')
      store.put(value, key)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    }
    
    request.onerror = () => reject(request.error)
  })
}

export function get<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('WorksheetLabDB', 1)
    
    request.onupgradeneeded = () => {
      request.result.createObjectStore('keyval')
    }
    
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction('keyval', 'readonly')
      const store = transaction.objectStore('keyval')
      const getRequest = store.get(key)
      getRequest.onsuccess = () => resolve(getRequest.result)
      getRequest.onerror = () => reject(getRequest.error)
    }
    
    request.onerror = () => reject(request.error)
  })
}

export function del(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('WorksheetLabDB', 1)
    
    request.onupgradeneeded = () => {
      request.result.createObjectStore('keyval')
    }
    
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction('keyval', 'readwrite')
      const store = transaction.objectStore('keyval')
      store.delete(key)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    }
    
    request.onerror = () => reject(request.error)
  })
}
