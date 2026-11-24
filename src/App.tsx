import { useEffect, useMemo, useState } from 'react'
import { loadBriefing, loadIndex } from './data'
import type { Briefing, BriefingIndex, Story } from './types'

const KST_OFFSET = 9 * 60 * 60 * 1000

function formatDate(date: string) {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Seoul' }).format(new Date(`${date}T00:00:00+09:00`))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' }).format(new Date(value))
}

function isStale(briefing: Briefing) {
  const todayKst = new Date(Date.now() + KST_OFFSET).toISOString().slice(0, 10)
  const expected = new Date(`${todayKst}T00:00:00Z`)
  expected.setUTCDate(expected.getUTCDate() - 1)
  return briefing.date < expected.toISOString().slice(0, 10)
}

function StoryCard({ story, number }: { story: Story; number: number }) {
  return (
    <article className="story-card">
      <div className="story-number" aria-hidden="true">{String(number).padStart(2, '0')}</div>
      <div className="story-content">
        <h3>{story.title}</h3>
        <p className="summary">{story.summary}</p>
        <p className="key-point"><span>핵심</span>{story.keyPoint}</p>
        <div className="sources" aria-label="관련 원문">
          {story.sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer" aria-label={`${source.publisher} 원문: ${source.title}`}>
              {source.publisher}<span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>
    </article>
  )
}

export default function App() {
  const [index, setIndex] = useState<BriefingIndex | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadIndex()
      .then((value) => { setIndex(value); setSelectedDate(value.latest) })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedDate) return
    setLoading(true)
    setError('')
    loadBriefing(selectedDate)
      .then(setBriefing)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false))
  }, [selectedDate])

  const position = useMemo(() => index?.dates.indexOf(selectedDate) ?? -1, [index, selectedDate])
  const move = (offset: number) => {
    const next = index?.dates[position + offset]
    if (next) setSelectedDate(next)
  }

  return (
    <main>
      <header className="masthead">
        <div className="brand-row">
          <span className="eyebrow">DAILY NEWS DIGEST</span>
          <span className="edition">KOREA · MORNING EDITION</span>
        </div>
        <h1>어제의 브리핑</h1>
        <p className="dek">하루를 시작하기 전, 놓치지 말아야 할 어제의 뉴스</p>
      </header>

      {index && (
        <nav className="date-nav" aria-label="브리핑 날짜 선택">
          <button onClick={() => move(1)} disabled={position < 0 || position >= index.dates.length - 1} aria-label="이전 날짜">←</button>
          <label>
            <span className="sr-only">날짜</span>
            <select value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}>
              {index.dates.map((date) => <option key={date} value={date}>{formatDate(date)}</option>)}
            </select>
          </label>
          <button onClick={() => move(-1)} disabled={position <= 0} aria-label="다음 날짜">→</button>
        </nav>
      )}

      {loading && <div className="status" role="status">브리핑을 펼치는 중입니다…</div>}
      {error && <div className="status error" role="alert"><strong>브리핑을 열지 못했습니다.</strong><span>{error}</span></div>}

      {!loading && briefing && !error && (
        <>
          <div className="brief-meta">
            <strong>{formatDate(briefing.date)}</strong>
            <span>{formatTime(briefing.generatedAt)} 생성</span>
          </div>
          {isStale(briefing) && <div className="stale" role="note">최신 브리핑 생성이 지연되고 있습니다. 아래는 마지막으로 완성된 브리핑입니다.</div>}
          <div className="categories">
            {briefing.categories.map((category) => (
              <section className="category" key={category.id}>
                <div className="category-heading">
                  <span className="rule" />
                  <h2>{category.label}</h2>
                  <span className="count">{category.stories.length} STORIES</span>
                </div>
                {category.stories.length ? category.stories.map((story, index) => <StoryCard key={story.id} story={story} number={index + 1} />) : <p className="empty">선정된 주요 뉴스가 없습니다.</p>}
              </section>
            ))}
          </div>
          <footer>
            <p>AI가 여러 언론사의 RSS를 바탕으로 정리했습니다. 중요한 판단 전에는 반드시 원문을 확인하세요.</p>
            <span>원문과 사진은 저장하지 않습니다.</span>
          </footer>
        </>
      )}
    </main>
  )
}
