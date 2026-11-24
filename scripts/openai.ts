import OpenAI from 'openai'
import { z } from 'zod'
import type { Candidate } from './lib'
import type { Briefing, CategoryId, SourceLink } from '../src/types'

const categoryIds = ['politics', 'society-culture', 'economy', 'tech-science', 'sports'] as const
const labels: Record<CategoryId, string> = { politics: '정치', 'society-culture': '사회·문화', economy: '경제', 'tech-science': 'IT·과학', sports: '스포츠' }

const outputSchema = z.object({
  categories: z.array(z.object({
    id: z.enum(categoryIds),
    stories: z.array(z.object({
      title: z.string().min(5).max(100),
      summary: z.string().min(20).max(500),
      keyPoint: z.string().min(5).max(180),
      sourceIds: z.array(z.string()).min(1).max(5),
    })).max(3),
  })),
})

const jsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['categories'],
  properties: {
    categories: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'stories'],
        properties: {
          id: { type: 'string', enum: categoryIds },
          stories: {
            type: 'array',
            maxItems: 3,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['title', 'summary', 'keyPoint', 'sourceIds'],
              properties: {
                title: { type: 'string' },
                summary: { type: 'string' },
                keyPoint: { type: 'string' },
                sourceIds: { type: 'array', minItems: 1, maxItems: 5, items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  },
} as const

export async function summarize(candidates: Candidate[], date: string, apiKey: string, model: string): Promise<Briefing> {
  const client = new OpenAI({ apiKey })
  const candidateMap = new Map(candidates.map((item) => [item.id, item]))
  const compact = candidates.map(({ id, publisher, category, title, description, publishedAt }) => ({ id, publisher, category, title, description, publishedAt }))
  let lastError: unknown

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await client.responses.create({
        model,
        instructions: [
          '당신은 한국의 중립적인 뉴스 편집자다.',
          '입력 후보만 사용하고 새로운 사실을 만들지 않는다.',
          '유사한 사건은 하나의 이야기로 묶고 여러 언론사가 다룬 정도, 사회적 파급력, 최신성을 우선한다.',
          '각 카테고리에서 중요한 뉴스 1~3건을 고른다. 후보가 없으면 빈 배열을 반환한다.',
          '제목은 간결하게 다시 쓰고, summary는 한국어 2~3문장, keyPoint는 왜 중요한지 한 문장으로 작성한다.',
          'sourceIds에는 해당 이야기를 직접 뒷받침하는 입력 ID만 넣는다.',
        ].join('\n'),
        input: JSON.stringify({ date, candidates: compact }),
        text: { format: { type: 'json_schema', name: 'daily_briefing', strict: true, schema: jsonSchema } },
      })
      const parsed = outputSchema.parse(JSON.parse(response.output_text))
      const byCategory = new Map(parsed.categories.map((category) => [category.id, category.stories]))
      return {
        date,
        generatedAt: new Date().toISOString(),
        categories: categoryIds.map((id) => ({
          id,
          label: labels[id],
          stories: (byCategory.get(id) ?? []).slice(0, 3).map((story, index) => {
            const sources = story.sourceIds.flatMap((sourceId): SourceLink[] => {
              const source = candidateMap.get(sourceId)
              return source ? [{ publisher: source.publisher, title: source.title, url: source.url }] : []
            }).filter((source, sourceIndex, all) => all.findIndex((other) => other.url === source.url) === sourceIndex)
            if (!sources.length) throw new Error(`요약에 유효한 출처가 없습니다: ${story.title}`)
            return { id: `${id}-${date}-${index + 1}`, title: story.title, summary: story.summary, keyPoint: story.keyPoint, sources }
          }),
        })),
      }
    } catch (error) { lastError = error }
  }
  throw new Error('OpenAI 요약 생성 또는 검증에 실패했습니다.', { cause: lastError })
}
