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
        date: '15 Feb 2026',
        imageUrl: 'https://picsum.photos/seed/tech/400/200',
        url: 'https://news.google.com',
    },
    {
        id: '2',
        title: 'Giardinaggio: consigli per la primavera',
        source: 'Natura Viva',
        excerpt: 'Preparare il giardino per la fioritura: ecco cosa fare questo mese...',
        date: '14 Feb 2026',
        imageUrl: 'https://picsum.photos/seed/garden/400/200',
        url: 'https://news.google.com',
    },
    {
        id: '3',
        title: 'Ricette sane e veloci per cena',
        source: 'Cucina & Salute',
        excerpt: 'Tre piatti pronti in meno di 20 minuti che piaceranno a tutti...',
        date: '13 Feb 2026',
        imageUrl: 'https://picsum.photos/seed/food/400/200',
        url: 'https://news.google.com',
    },
];

const NEWS_API_KEY = 'a3e07d1a463d44cbb1c64569b4041d95';

export const fetchNews = async (apiKey?: string): Promise<NewsItem[]> => {
    try {
        const key = apiKey || NEWS_API_KEY;
        if (!key) return MOCK_NEWS;

        // Try top headlines first
        let response = await fetch(
            `https://newsapi.org/v2/top-headlines?country=it&apiKey=${key}`
        );

        let data = await response.json();

        // If no headlines, try general search for Italy
        if (data.status === 'ok' && (!data.articles || data.articles.length === 0)) {
            response = await fetch(
                `https://newsapi.org/v2/everything?q=Italia&language=it&sortBy=publishedAt&apiKey=${key}`
            );
            data = await response.json();
        }

        if (!response.ok || data.status !== 'ok') {
            console.error('News API failed or returned error', data);
            return MOCK_NEWS;
        }

        if (!data.articles || data.articles.length === 0) return MOCK_NEWS;

        return data.articles.map((article: any, index: number) => ({
            id: String(index),
            title: article.title,
            source: article.source.name,
            excerpt: article.description || 'Nessun estratto disponibile.',
            date: new Date(article.publishedAt).toLocaleDateString('it-IT'),
            imageUrl: article.urlToImage || `https://picsum.photos/seed/${index}/400/200`,
            url: article.url,
        }));
    } catch (error) {
        console.error('News service error:', error);
        return MOCK_NEWS;
    }
};
