import type { Briefing, BriefingIndex } from './types'

const dataUrl = (path: string) => new URL(`data/${path}`, window.location.href).toString()

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(dataUrl(path), { cache: 'no-cache' })
  if (!response.ok) throw new Error(`데이터를 불러오지 못했습니다 (${response.status})`)
  return response.json() as Promise<T>
}

export const loadIndex = () => getJson<BriefingIndex>('index.json')
export const loadBriefing = (date: string) => getJson<Briefing>(`briefings/${date}.json`)
