export const BUY_COFFEE = {
  profileUrl: 'https://buycoffee.to/a.kedzior',
  creator: 'Adrian Kędzior',
  appUrl: 'https://kartolab.torobie.pl/',
  appDisplayUrl: 'kartolab.torobie.pl',
  options: [
    { label: 'Espresso', amount: '5 zł', url: 'https://buycoffee.to/a.kedzior?coffeeSize=small', iconUrl: 'https://buycoffee.to/static/img/icons/coffee-small.svg' },
    { label: 'Cappuccino', amount: '10 zł', url: 'https://buycoffee.to/a.kedzior?coffeeSize=medium', iconUrl: 'https://buycoffee.to/static/img/icons/coffee-medium.svg' },
    { label: 'Cafe latte', amount: '20 zł', url: 'https://buycoffee.to/a.kedzior?coffeeSize=large', iconUrl: 'https://buycoffee.to/static/img/icons/coffee-large.svg' },
  ],
} as const

const SUPPORT_REMINDER_KEY = 'worksheetlab-support-reminder'
const SUPPORT_REMINDER_DELAY_MS = 7 * 24 * 60 * 60 * 1000

type SupportReminder = {
  hidden?: boolean
  nextPromptAt?: number
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

function getStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function getReminder(storage = getStorage()): SupportReminder {
  if (!storage) return {}
  try {
    const value = storage.getItem(SUPPORT_REMINDER_KEY)
    return value ? (JSON.parse(value) as SupportReminder) : {}
  } catch {
    return {}
  }
}

function saveReminder(value: SupportReminder, storage = getStorage()) {
  try {
    storage?.setItem(SUPPORT_REMINDER_KEY, JSON.stringify(value))
  } catch {
    // Brak miejsca lub zablokowany localStorage nie powinny blokować wydruku.
  }
}

export function canShowSupportReminder(now = Date.now(), storage?: StorageLike | null) {
  const reminder = getReminder(storage)
  return !reminder.hidden && (!reminder.nextPromptAt || reminder.nextPromptAt <= now)
}

export function postponeSupportReminder(now = Date.now(), storage?: StorageLike | null) {
  saveReminder({ nextPromptAt: now + SUPPORT_REMINDER_DELAY_MS }, storage)
}

export function disableSupportReminder(storage?: StorageLike | null) {
  saveReminder({ hidden: true }, storage)
}
