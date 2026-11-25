import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'

const briefing = {
  date: '2026-11-23', generatedAt: '2026-11-24T00:00:00Z', categories: [
    { id: 'politics', label: '정치', stories: [{ id: 'a', title: '테스트 주요 뉴스', summary: '충분한 길이의 테스트 요약입니다.', keyPoint: '확인이 필요합니다.', sources: [{ publisher: '테스트뉴스', title: '원문', url: 'https://example.com' }] }] },
    { id: 'society-culture', label: '사회·문화', stories: [] },
    { id: 'economy', label: '경제', stories: [] },
    { id: 'tech-science', label: 'IT·과학', stories: [] },
    { id: 'sports', label: '스포츠', stories: [] },
  ],
}

describe('App', () => {
  afterEach(() => vi.restoreAllMocks())

  it('인덱스와 브리핑을 불러와 뉴스와 출처를 표시한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      return new Response(JSON.stringify(url.endsWith('index.json') ? { dates: ['2026-11-23'], latest: '2026-11-23' } : briefing), { status: 200 })
    })
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: '지운 뉴스' })).toBeInTheDocument()
    expect(await screen.findByText('테스트 주요 뉴스')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /테스트뉴스 원문/ })).toHaveAttribute('href', 'https://example.com')
    expect(screen.getAllByText('선정된 주요 뉴스가 없습니다.')).toHaveLength(4)
  })

  it('데이터 요청 실패를 안내한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404 }))
    render(<App />)
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('브리핑을 열지 못했습니다.'))
  })
})
