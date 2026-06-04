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

/** 导入系统全部数据（会覆盖已有数据） */
export function importAll(data: MemoriaData): void {
  saveArticles(data.articles || []);
  saveWordBooks(data.wordBooks || []);
  saveSentenceBooks(data.sentenceBooks || []);
}
