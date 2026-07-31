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
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    // 配额满/隐私模式等场景不崩溃，仅告警
    console.warn(`保存 localStorage[${key}] 失败`, e);
  }
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
  // 清理该文章的指导记忆关联数据，避免删除后残留、重建时"复活"旧配置
  try {
    localStorage.removeItem(`memoria:guided:${id}:config`);
    localStorage.removeItem(`memoria:guided:${id}:step`);
    localStorage.removeItem(`memoria:guided:${id}:inputs`);
  } catch (e) {
    console.warn('清理指导记忆数据失败', e);
  }
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

/** 导入统计：added=新增资源数，merged=合并（同 id）资源数，skipped=跳过（同 id 文章已存在）数 */
export interface ImportStats {
  added: number;
  merged: number;
  skipped: number;
}

/**
 * 导入系统全部数据（按 id 合并：同 id 词书/句书条目合并去重；同 id 文章保留原有不覆盖）。
 * 返回统计信息供 UI 提示，避免"静默丢弃数据"。
 */
export function importAll(data: MemoriaData): ImportStats {
  const stats: ImportStats = { added: 0, merged: 0, skipped: 0 };

  // --- 文章：按 id 合并；同 id 保留原有（内容通常唯一，不自动覆盖） ---
  const existingArticles = loadArticles();
  const incomingArticles = data.articles || [];
  const articleMap = new Map(existingArticles.map(a => [a.id, a]));
  for (const article of incomingArticles) {
    if (article && typeof article === 'object' && typeof article.id === 'string') {
      if (articleMap.has(article.id)) {
        stats.skipped += 1;
      } else {
        articleMap.set(article.id, article);
        stats.added += 1;
      }
    }
  }
  saveArticles(Array.from(articleMap.values()));

  // --- 词书：按 id 合并，条目去重（按 english 字段） ---
  const existingWordBooks = loadWordBooks();
  const incomingWordBooks = data.wordBooks || [];
  const wordBookMap = new Map(existingWordBooks.map(b => [b.id, b]));
  for (const book of incomingWordBooks) {
    if (!book || typeof book !== 'object' || typeof book.id !== 'string' || !Array.isArray(book.entries)) {
      stats.skipped += 1;
      continue;
    }
    const existing = wordBookMap.get(book.id);
    if (existing) {
      const entryMap = new Map(existing.entries.map(e => [e.english, e]));
      for (const entry of book.entries) {
        // 元素级校验：跳过损坏的条目，避免半导入
        if (!entry || typeof entry !== 'object') continue;
        if (!entryMap.has(entry.english)) {
          entryMap.set(entry.english, entry);
        }
      }
      wordBookMap.set(book.id, { ...existing, entries: Array.from(entryMap.values()) });
      stats.merged += 1;
    } else {
      wordBookMap.set(book.id, book);
      stats.added += 1;
    }
  }
  saveWordBooks(Array.from(wordBookMap.values()));

  // --- 句书：按 id 合并，条目去重（按 english 字段） ---
  const existingSentenceBooks = loadSentenceBooks();
  const incomingSentenceBooks = data.sentenceBooks || [];
  const sentenceBookMap = new Map(existingSentenceBooks.map(b => [b.id, b]));
  for (const book of incomingSentenceBooks) {
    if (!book || typeof book !== 'object' || typeof book.id !== 'string' || !Array.isArray(book.entries)) {
      stats.skipped += 1;
      continue;
    }
    const existing = sentenceBookMap.get(book.id);
    if (existing) {
      const entryMap = new Map(existing.entries.map(e => [e.english, e]));
      for (const entry of book.entries) {
        // 元素级校验：跳过损坏的条目，避免半导入
        if (!entry || typeof entry !== 'object') continue;
        if (!entryMap.has(entry.english)) {
          entryMap.set(entry.english, entry);
        }
      }
      sentenceBookMap.set(book.id, { ...existing, entries: Array.from(entryMap.values()) });
      stats.merged += 1;
    } else {
      sentenceBookMap.set(book.id, book);
      stats.added += 1;
    }
  }
  saveSentenceBooks(Array.from(sentenceBookMap.values()));

  return stats;
}
