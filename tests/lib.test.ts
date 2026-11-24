import { mkdtemp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { FeedConfig } from '../config/feeds'
import { canonicalUrl, deduplicate, filterForDate, normalizeTitle, parseFeed, previousKstDate, pruneAndIndex } from '../scripts/lib'

const feed: FeedConfig = { publisher: '테스트뉴스', category: 'economy', url: 'https://example.com/rss', enabled: true }
const rss = `<?xml version="1.0"?><rss><channel>
  <item><title><![CDATA[<b>첫 번째 뉴스</b>]]></title><link>https://example.com/1?utm_source=x</link><description><![CDATA[<p>기사 설명입니다.</p>]]></description><pubDate>Mon, 23 Nov 2026 06:00:00 GMT</pubDate></item>
  <item><title>둘째 뉴스</title><link>https://example.com/2</link><pubDate>Mon, 23 Nov 2026 16:00:00 GMT</pubDate></item>
</channel></rss>`

describe('RSS pipeline', () => {
  it('RSS를 파싱하고 HTML과 추적 파라미터를 제거한다', () => {
    const items = parseFeed(rss, feed)
    expect(items).toHaveLength(2)
    expect(items[0].title).toBe('첫 번째 뉴스')
    expect(items[0].description).toBe('기사 설명입니다.')
    expect(items[0].url).toBe('https://example.com/1')
  })

  it('한국시간 날짜 경계로 필터링한다', () => {
    const items = parseFeed(rss, feed)
    expect(filterForDate(items, '2026-11-23').map((item) => item.title)).toEqual(['첫 번째 뉴스'])
  })

  it('URL과 정규화 제목 중복을 제거한다', () => {
    const [item] = parseFeed(rss, feed)
    expect(deduplicate([item, { ...item, id: 'other', url: `${item.url}?utm_campaign=y` }])).toHaveLength(1)
    expect(normalizeTitle('[속보] 같은 뉴스!')).toBe('같은뉴스')
    expect(canonicalUrl('https://example.com/a?utm_medium=rss#x')).toBe('https://example.com/a')
  })

  it('한국시간의 전일을 계산한다', () => {
    expect(previousKstDate(new Date('2026-11-24T00:30:00Z'))).toBe('2026-11-23')
  })
})

describe('retention', () => {
  it('최신 7일만 남기고 인덱스를 만든다', async () => {
    const root = await mkdtemp(join(tmpdir(), 'briefing-'))
    const directory = join(root, 'briefings')
    await mkdir(directory)
    for (let day = 1; day <= 9; day++) await writeFile(join(directory, `2026-11-${String(day).padStart(2, '0')}.json`), '{}')
    const dates = await pruneAndIndex(directory, 7)
    expect(dates).toHaveLength(7)
    expect(await readdir(directory)).toHaveLength(7)
    const index = JSON.parse(await readFile(join(root, 'index.json'), 'utf8'))
    expect(index.latest).toBe('2026-11-09')
  })
})
