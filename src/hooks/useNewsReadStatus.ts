import { useState, useEffect } from 'react';

interface NewsArticle {
  title: string;
  excerpt: string;
  date: string;
  category: string;
  feedstock: string[];
  products: string[];
  applications: string[];
  publication: string;
}

const STORAGE_KEY = 'readNewsArticles';

export const useNewsReadStatus = () => {
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const readTitles = JSON.parse(stored);
        setReadArticles(new Set(readTitles));
      } catch (error) {
        console.error('Error loading read articles from localStorage:', error);
      }
    }
  }, []);

  const markAsRead = (articleTitle: string) => {
    setReadArticles(prev => {
      const newSet = new Set(prev);
      newSet.add(articleTitle);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...newSet]));
      } catch (error) {
        console.error('Error saving read articles to localStorage:', error);
      }
      
      return newSet;
    });
  };

  const isRead = (articleTitle: string) => {
    return readArticles.has(articleTitle);
  };

  const markAsUnread = (articleTitle: string) => {
    setReadArticles(prev => {
      const newSet = new Set(prev);
      newSet.delete(articleTitle);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...newSet]));
      } catch (error) {
        console.error('Error saving read articles to localStorage:', error);
      }
      
      return newSet;
    });
  };

  return {
    isRead,
    markAsRead,
    markAsUnread,
    readArticles: readArticles.size
  };
};