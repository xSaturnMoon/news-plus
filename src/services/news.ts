export interface NewsItem {
    id: string;
    title: string;
    source: string;
    excerpt: string;
    date: string;
    imageUrl?: string;
    url: string;
}

// Fallback mock data if API fails or No Key
const MOCK_NEWS: NewsItem[] = [
    {
        id: '1',
        title: 'Nuove tecnologie per la casa intelligente',
        source: 'Tech Daily',
        excerpt: 'Le ultime innovazioni che semplificano la vita quotidiana in famiglia...',
        date: 'Oggi, 10:00',
        imageUrl: 'https://picsum.photos/seed/tech/400/200',
        url: 'https://newsdata.io',
    },
    {
        id: '2',
        title: 'Giardinaggio: consigli per la primavera',
        source: 'Natura Viva',
        excerpt: 'Preparare il giardino per la fioritura: ecco cosa fare questo mese...',
        date: 'Oggi, 09:30',
        imageUrl: 'https://picsum.photos/seed/garden/400/200',
        url: 'https://newsdata.io',
    },
];

// Default key provided by user (NewsData.io)
const DEFAULT_NEWS_API_KEY = 'pub_371038135476481da0927da307090b73';

const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const isToday = date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Oggi, ${timeStr}`;
    if (isYesterday) return `Ieri, ${timeStr}`;

    return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }) + `, ${timeStr}`;
};

export const fetchNews = async (apiKey?: string, query?: string): Promise<NewsItem[]> => {
    try {
        const key = apiKey || DEFAULT_NEWS_API_KEY;
        if (!key) return MOCK_NEWS;

        // NewsData.io endpoint
        let url = `https://newsdata.io/api/1/news?apikey=${key}&country=it&language=it`;

        if (query) {
            url += `&q=${encodeURIComponent(query)}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'success') {
            console.error('NewsData API failed', data);
            return MOCK_NEWS;
        }

        if (!data.results || data.results.length === 0) {
            return MOCK_NEWS;
        }

        return data.results.map((article: any, index: number) => ({
            id: article.article_id || String(index) + article.pubDate,
            title: article.title,
            source: article.source_id || 'News',
            excerpt: article.description || article.content || 'Nessun estratto disponibile.',
            date: formatRelativeDate(new Date(article.pubDate)),
            imageUrl: article.image_url || `https://picsum.photos/seed/${index}/400/200`,
            url: article.link,
        }));
    } catch (error) {
        console.error('NewsData service error:', error);
        return MOCK_NEWS;
    }
};
