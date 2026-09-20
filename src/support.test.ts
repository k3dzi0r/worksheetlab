import { describe, expect, it } from 'vitest'
import { canShowSupportReminder, disableSupportReminder, postponeSupportReminder } from './support'

function createStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }
}

describe('przypomnienie o wsparciu', () => {
  it('wstrzymuje komunikat na siedem dni po zamknięciu', () => {
    const storage = createStorage()
    const now = Date.UTC(2026, 8, 20)

    expect(canShowSupportReminder(now, storage)).toBe(true)
    postponeSupportReminder(now, storage)
    expect(canShowSupportReminder(now + 6 * 24 * 60 * 60 * 1000, storage)).toBe(false)
    expect(canShowSupportReminder(now + 7 * 24 * 60 * 60 * 1000, storage)).toBe(true)
  })

  it('trwale wyłącza automatyczne przypomnienie', () => {
    const storage = createStorage()

    disableSupportReminder(storage)
    expect(canShowSupportReminder(Date.now(), storage)).toBe(false)
  })
})
