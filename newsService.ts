// News Service for TON Education App
// Fetches latest news from TON's official Telegram channel and Twitter/X account

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  source: 'telegram' | 'twitter';
  url: string;
  imageUrl?: string;
}

// Function to fetch news from server API
export async function fetchTonNews(): Promise<NewsItem[]> {
  try {
    // Fetch news from the server API
    const response = await fetch('/api/ton-news');
    if (!response.ok) {
      throw new Error(`Failed to fetch TON news: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching TON news:', error);
    return [];
  }
}