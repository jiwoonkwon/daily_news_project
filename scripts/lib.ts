import { XMLParser } from 'fast-xml-parser'
import { createHash } from 'node:crypto'
import { readdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { FeedCategory, FeedConfig } from '../config/feeds'

export interface Candidate {
  id: string
  publisher: string
  category: FeedCategory
  title: string
  description: string
  url: string
  publishedAt: string
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', trimValues: true })
const asArray = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value]
const text = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return text(record['#text'] ?? record['__cdata'] ?? '')
  }
  return ''
}

export function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
}

export function normalizeTitle(value: string) {
  return value.toLocaleLowerCase('ko-KR').replace(/\[[^\]]+\]|\([^)]*속보[^)]*\)/g, '').replace(/[^가-힣a-z0-9]/g, '')
}

export function canonicalUrl(value: string) {
  try {
    const url = new URL(value)
    ;['utm_source', 'utm_medium', 'utm_campaign', 'plink', 'cooper'].forEach((key) => url.searchParams.delete(key))
    url.hash = ''
    return url.toString()
  } catch { return value }
}

export function kstDateRange(targetDate: string) {
  const start = new Date(`${targetDate}T00:00:00+09:00`)
  const end = new Date(`${targetDate}T23:59:59.999+09:00`)
  if (Number.isNaN(start.getTime())) throw new Error(`잘못된 대상 날짜입니다: ${targetDate}`)
  return { start, end }
}

export function currentKstDate(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' })
  return formatter.format(now)
}

export function parseFeed(xml: string, feed: FeedConfig): Candidate[] {
  const data = parser.parse(xml) as Record<string, any>
  const rssItems = asArray(data.rss?.channel?.item)
  const atomItems = asArray(data.feed?.entry)
  return [...rssItems, ...atomItems].flatMap((item: any) => {
    const title = stripHtml(text(item.title))
    const rawLink = typeof item.link === 'string' ? item.link : item.link?.['@_href'] ?? item.link?.['#text'] ?? ''
    const url = canonicalUrl(text(rawLink || item.guid))
    const rawDate = text(item.pubDate ?? item.published ?? item.updated ?? item['dc:date'])
    const date = new Date(rawDate)
    if (!title || !url || Number.isNaN(date.getTime())) return []
    return [{
      id: createHash('sha1').update(`${feed.publisher}:${url}`).digest('hex').slice(0, 12),
      publisher: feed.publisher,
      category: feed.category,
      title,
      description: stripHtml(text(item.description ?? item.summary ?? item.content)).slice(0, 1000),
      url,
      publishedAt: date.toISOString(),
    }]
  })
}

export function filterForDate(items: Candidate[], targetDate: string) {
  const { start, end } = kstDateRange(targetDate)
  return items.filter((item) => {
    const time = new Date(item.publishedAt).getTime()
    return time >= start.getTime() && time <= end.getTime()
  })
}

export function deduplicate(items: Candidate[]) {
  const seenUrls = new Set<string>()
  const seenTitles = new Set<string>()
  return items.filter((item) => {
    const url = canonicalUrl(item.url)
    const title = normalizeTitle(item.title)
    if (!title || seenUrls.has(url) || seenTitles.has(title)) return false
    seenUrls.add(url)
    seenTitles.add(title)
    return true
  })
}

export async function pruneAndIndex(directory: string, keep = 7) {
  const files = (await readdir(directory)).filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file)).sort().reverse()
  for (const file of files.slice(keep)) await unlink(join(directory, file))
  const dates = files.slice(0, keep).map((file) => file.replace('.json', ''))
  if (!dates.length) throw new Error('저장된 브리핑이 없습니다.')
  await writeFile(join(directory, '..', 'index.json'), JSON.stringify({ dates, latest: dates[0] }, null, 2) + '\n')
  return dates
}
