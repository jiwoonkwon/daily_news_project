export const categoryIds = ['politics', 'society-culture', 'economy', 'tech-science', 'sports'] as const

export type CategoryId = (typeof categoryIds)[number]

export interface SourceLink {
  publisher: string
  title: string
  url: string
}

export interface Story {
  id: string
  title: string
  summary: string
  keyPoint: string
  sources: SourceLink[]
}

export interface Category {
  id: CategoryId
  label: string
  stories: Story[]
}

export interface Briefing {
  date: string
  generatedAt: string
  categories: Category[]
}

export interface BriefingIndex {
  dates: string[]
  latest: string
}
