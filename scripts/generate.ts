import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { feeds } from '../config/feeds'
import { currentKstDate, deduplicate, filterForDate, parseFeed, pruneAndIndex, type Candidate } from './lib'
import { summarize } from './openai'

const targetDate = process.env.BRIEFING_DATE?.trim() || currentKstDate()
const apiKey = process.env.OPENAI_API_KEY
const model = process.env.OPENAI_MODEL || 'gpt-5-mini'
const outputDirectory = resolve('public/data/briefings')

if (!apiKey) throw new Error('OPENAI_API_KEY 환경 변수가 필요합니다.')

async function fetchFeed(feed: (typeof feeds)[number]) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  try {
    const response = await fetch(feed.url, { signal: controller.signal, headers: { 'User-Agent': 'DailyBrief/1.0 (personal RSS reader)' } })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return filterForDate(parseFeed(await response.text(), feed), targetDate)
  } finally { clearTimeout(timeout) }
}

const results = await Promise.allSettled(feeds.filter((feed) => feed.enabled).map(fetchFeed))
const candidates: Candidate[] = []
results.forEach((result, index) => {
  if (result.status === 'fulfilled') candidates.push(...result.value)
  else console.warn(`피드 수집 실패: ${feeds.filter((feed) => feed.enabled)[index].publisher}`, result.reason)
})

const unique = deduplicate(candidates).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
const successfulFeeds = results.filter((result) => result.status === 'fulfilled').length
if (successfulFeeds < 2 || unique.length < 5) throw new Error(`후보가 부족합니다 (성공 피드 ${successfulFeeds}, 기사 ${unique.length}). 기존 배포를 유지합니다.`)

const briefing = await summarize(unique, targetDate, apiKey, model)
if (briefing.categories.every((category) => category.stories.length === 0)) throw new Error('선정된 뉴스가 없습니다. 기존 배포를 유지합니다.')

await mkdir(outputDirectory, { recursive: true })
await writeFile(resolve(outputDirectory, `${targetDate}.json`), JSON.stringify(briefing, null, 2) + '\n')
await pruneAndIndex(outputDirectory, 7)
console.log(`${targetDate} 브리핑 생성 완료: ${briefing.categories.reduce((sum, category) => sum + category.stories.length, 0)}건`)
