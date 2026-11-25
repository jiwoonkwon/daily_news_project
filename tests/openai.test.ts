import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Candidate } from '../scripts/lib'

const { createResponse } = vi.hoisted(() => ({ createResponse: vi.fn() }))

vi.mock('openai', () => ({
  default: class MockOpenAI {
    responses = { create: createResponse }
  },
}))

import { isRelevantSource, summarize } from '../scripts/openai'

const candidates: Candidate[] = [{
  id: 'source-1',
  publisher: '테스트뉴스',
  category: 'economy',
  title: '경제 정책 관련 테스트 기사',
  description: '경제 정책에 관한 충분한 설명입니다.',
  url: 'https://example.com/news/1',
  publishedAt: '2026-11-23T03:00:00.000Z',
}]

const validOutput = JSON.stringify({
  categories: [{
    id: 'economy',
    stories: [{
      title: '경제 정책의 주요 변화 발표',
      summary: '새로운 경제 정책의 주요 내용이 발표됐습니다. 구체적인 영향은 후속 발표를 통해 확인할 수 있습니다.',
      keyPoint: '정책 변화가 시장과 가계에 미칠 영향을 살펴봐야 합니다.',
      sourceIds: ['source-1'],
    }],
  }],
})

describe('OpenAI summarizer', () => {
  beforeEach(() => createResponse.mockReset())

  it('구조화 결과를 고정 카테고리 순서로 만들고 출처를 보존한다', async () => {
    createResponse.mockResolvedValue({ output_text: validOutput })
    const briefing = await summarize(candidates, '2026-11-23', 'test-key', 'test-model')
    expect(briefing.categories.map((category) => category.id)).toEqual(['politics', 'society-culture', 'economy', 'tech-science', 'sports'])
    expect(briefing.categories[2].stories[0].sources[0]).toEqual({ publisher: '테스트뉴스', title: candidates[0].title, url: candidates[0].url })
    expect(createResponse).toHaveBeenCalledOnce()
  })

  it('잘못된 응답은 한 번 재시도한다', async () => {
    createResponse.mockResolvedValueOnce({ output_text: '{invalid' }).mockResolvedValueOnce({ output_text: validOutput })
    await expect(summarize(candidates, '2026-11-23', 'test-key', 'test-model')).resolves.toMatchObject({ date: '2026-11-23' })
    expect(createResponse).toHaveBeenCalledTimes(2)
  })

  it('존재하지 않는 출처 ID는 최종 실패로 처리한다', async () => {
    const invalidSources = validOutput.replaceAll('source-1', 'missing-source')
    createResponse.mockResolvedValue({ output_text: invalidSources })
    await expect(summarize(candidates, '2026-11-23', 'test-key', 'test-model')).rejects.toThrow('OpenAI 요약 생성 또는 검증에 실패했습니다.')
    expect(createResponse).toHaveBeenCalledTimes(2)
  })

  it('요약 주제와 핵심 용어가 겹치지 않는 출처를 거부한다', () => {
    const story = { title: '정부 디지털자산법 입법 추진', summary: '스테이블코인과 거래소 규제 방안이 공개됐습니다.', keyPoint: '가상자산 시장 제도화가 시작됩니다.' }
    expect(isRelevantSource(story, candidates[0])).toBe(false)
    expect(isRelevantSource(story, { ...candidates[0], title: '스테이블코인 규제 담은 디지털자산법 공개' })).toBe(true)
  })
})
