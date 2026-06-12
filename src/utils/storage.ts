/**
 * 本地持久化存储工具。
 *
 * 所有数据存储在 localStorage 中，key 统一前缀 'memoria:'。
 */

import type { Article, WordBook, SentenceBook, MemoriaData } from '../types';

const KEYS = {
  articles: 'memoria:articles',
  wordBooks: 'memoria:wordBooks',
  sentenceBooks: 'memoria:sentenceBooks',
};

/* ==================== 通用工具 ==================== */

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ==================== 文章 ==================== */

export function loadArticles(): Article[] {
  return loadJSON<Article[]>(KEYS.articles, []);
}

export function saveArticles(articles: Article[]): void {
  saveJSON(KEYS.articles, articles);
}

export function addArticle(article: Article): void {
  const list = loadArticles();
  list.push(article);
  saveArticles(list);
}

export function updateArticle(updated: Article): void {
  const list = loadArticles().map(a => (a.id === updated.id ? updated : a));
  saveArticles(list);
}

export function deleteArticle(id: string): void {
  const list = loadArticles().filter(a => a.id !== id);
  saveArticles(list);
}

/* ==================== 词书 ==================== */

export function loadWordBooks(): WordBook[] {
  return loadJSON<WordBook[]>(KEYS.wordBooks, []);
}

export function saveWordBooks(books: WordBook[]): void {
  saveJSON(KEYS.wordBooks, books);
}

export function addWordBook(book: WordBook): void {
  const list = loadWordBooks();
  list.push(book);
  saveWordBooks(list);
}

export function updateWordBook(updated: WordBook): void {
  const list = loadWordBooks().map(b => (b.id === updated.id ? updated : b));
  saveWordBooks(list);
}

export function deleteWordBook(id: string): void {
  const list = loadWordBooks().filter(b => b.id !== id);
  saveWordBooks(list);
}

/* ==================== 句书 ==================== */

export function loadSentenceBooks(): SentenceBook[] {
  return loadJSON<SentenceBook[]>(KEYS.sentenceBooks, []);
}

export function saveSentenceBooks(books: SentenceBook[]): void {
  saveJSON(KEYS.sentenceBooks, books);
}

export function addSentenceBook(book: SentenceBook): void {
  const list = loadSentenceBooks();
  list.push(book);
  saveSentenceBooks(list);
}

export function updateSentenceBook(updated: SentenceBook): void {
  const list = loadSentenceBooks().map(b => (b.id === updated.id ? updated : b));
  saveSentenceBooks(list);
}

export function deleteSentenceBook(id: string): void {
  const list = loadSentenceBooks().filter(b => b.id !== id);
  saveSentenceBooks(list);
}

/* ==================== 全量导入导出 ==================== */

/** 导出系统全部数据 */
export function exportAll(): MemoriaData {
  return {
    version: 1,
    articles: loadArticles(),
    wordBooks: loadWordBooks(),
    sentenceBooks: loadSentenceBooks(),
    exportedAt: Date.now(),
  };
}

/** 导入系统全部数据（合并模式 — 按标题匹配，合并条目并去重） */
export function importAll(data: MemoriaData): void {
  // --- 文章：按标题合并 ---
  const existingArticles = loadArticles();
  const incomingArticles = data.articles || [];
  const articleMap = new Map(existingArticles.map(a => [a.title, a]));
  for (const article of incomingArticles) {
    const existing = articleMap.get(article.title);
    if (existing) {
      // 标题相同，保留原有，不做自动内容合并（文章内容通常是唯一的）
      // 但如果导入的文章内容不同，保持原样不覆盖
    } else {
      articleMap.set(article.title, article);
    }
  }
  saveArticles(Array.from(articleMap.values()));

  // --- 词书：按标题合并，条目去重（按 english 字段） ---
  const existingWordBooks = loadWordBooks();
  const incomingWordBooks = data.wordBooks || [];
  const wordBookMap = new Map(existingWordBooks.map(b => [b.title, b]));
  for (const book of incomingWordBooks) {
    const existing = wordBookMap.get(book.title);
    if (existing) {
      // 合并 entries 并去重
      const entryMap = new Map(existing.entries.map(e => [e.english, e]));
      for (const entry of book.entries) {
        if (!entryMap.has(entry.english)) {
          entryMap.set(entry.english, entry);
        }
      }
      wordBookMap.set(book.title, { ...existing, entries: Array.from(entryMap.values()) });
    } else {
      wordBookMap.set(book.title, book);
    }
  }
  saveWordBooks(Array.from(wordBookMap.values()));

  // --- 句书：按标题合并，条目去重（按 english 字段） ---
  const existingSentenceBooks = loadSentenceBooks();
  const incomingSentenceBooks = data.sentenceBooks || [];
  const sentenceBookMap = new Map(existingSentenceBooks.map(b => [b.title, b]));
  for (const book of incomingSentenceBooks) {
    const existing = sentenceBookMap.get(book.title);
    if (existing) {
      const entryMap = new Map(existing.entries.map(e => [e.english, e]));
      for (const entry of book.entries) {
        if (!entryMap.has(entry.english)) {
          entryMap.set(entry.english, entry);
        }
      }
      sentenceBookMap.set(book.title, { ...existing, entries: Array.from(entryMap.values()) });
    } else {
      sentenceBookMap.set(book.title, book);
    }
  }
  saveSentenceBooks(Array.from(sentenceBookMap.values()));
}
