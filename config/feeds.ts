export type FeedCategory = 'politics' | 'society-culture' | 'economy' | 'tech-science' | 'sports'

export interface FeedConfig {
  publisher: string
  url: string
  category: FeedCategory
  enabled: boolean
}

export const feeds: FeedConfig[] = [
  { publisher: 'SBS', category: 'politics', url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01&plink=RSSREADER', enabled: true },
  { publisher: 'SBS', category: 'economy', url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=02&plink=RSSREADER', enabled: true },
  { publisher: 'SBS', category: 'society-culture', url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=03&plink=RSSREADER', enabled: true },
  { publisher: 'SBS', category: 'society-culture', url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=08&plink=RSSREADER', enabled: true },
  { publisher: 'SBS', category: 'sports', url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=09&plink=RSSREADER', enabled: true },
  { publisher: '경향신문', category: 'politics', url: 'https://www.khan.co.kr/rss/rssdata/politic_news.xml', enabled: true },
  { publisher: '경향신문', category: 'economy', url: 'https://www.khan.co.kr/rss/rssdata/economy_news.xml', enabled: true },
  { publisher: '경향신문', category: 'society-culture', url: 'https://www.khan.co.kr/rss/rssdata/society_news.xml', enabled: true },
  { publisher: '경향신문', category: 'society-culture', url: 'https://www.khan.co.kr/rss/rssdata/culture_news.xml', enabled: true },
  { publisher: '경향신문', category: 'tech-science', url: 'https://www.khan.co.kr/rss/rssdata/science_news.xml', enabled: true },
  { publisher: '경향신문', category: 'sports', url: 'https://www.khan.co.kr/rss/rssdata/kh_sports.xml', enabled: true },
  { publisher: 'KBS World', category: 'politics', url: 'https://world.kbs.co.kr/rss/rss_news.htm?lang=k&id=Po', enabled: true },
  { publisher: 'KBS World', category: 'economy', url: 'https://world.kbs.co.kr/rss/rss_news.htm?lang=k&id=Ec', enabled: true },
  { publisher: 'KBS World', category: 'society-culture', url: 'https://world.kbs.co.kr/rss/rss_news.htm?lang=k&id=Dm', enabled: true },
  { publisher: 'KBS World', category: 'tech-science', url: 'https://world.kbs.co.kr/rss/rss_news.htm?lang=k&id=Sc', enabled: true },
  { publisher: 'KBS World', category: 'sports', url: 'https://world.kbs.co.kr/rss/rss_news.htm?lang=k&id=Sp', enabled: true },
]
