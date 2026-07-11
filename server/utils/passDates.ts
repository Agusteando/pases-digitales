import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

export const PASS_TIME_ZONE = 'America/Mexico_City'

const END_DATE_CATEGORY_IDS = new Set([3, 4, 5, 6])
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const categoryUsesEndDate = (categoryId: unknown) => END_DATE_CATEGORY_IDS.has(Number(categoryId))

export const parseMexicoCityDateOnly = (value: unknown): Dayjs | null => {
  const normalized = String(value ?? '').trim()
  if (!DATE_ONLY_PATTERN.test(normalized)) return null

  const parsed = dayjs.tz(normalized, PASS_TIME_ZONE).startOf('day')
  if (!parsed.isValid() || parsed.format('YYYY-MM-DD') !== normalized) return null

  return parsed
}
