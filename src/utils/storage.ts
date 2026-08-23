/**
 * 本地持久化存储工具。
 *
 * 所有数据存储在 localStorage 中，key 统一前缀 'memoria:'。
 */

import type { Article, WordBook, SentenceBook, MemoriaData } from '../types';
import { uid } from '../types';

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

/* ==================== 导入数据清洗 ==================== */

/**
 * 将任意值安全地规范化为合法文章列表。
 * id 缺省/非法时自动生成（避免导入数据被静默丢弃）；title 缺省时兜底为「未命名文章」；
 * content 兜底为空串、sentences 只保留字符串。
 * 返回空数组表示输入不是数组（调用方不应继续遍历）。
 */
function normalizeArticles(arr: unknown): Article[] {
  if (!Array.isArray(arr)) return [];
  const out: Article[] = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    out.push({
      id: typeof obj.id === 'string' && obj.id ? obj.id : uid(),
      title: typeof obj.title === 'string' ? obj.title : '未命名文章',
      content: typeof obj.content === 'string' ? obj.content : '',
      sentences: Array.isArray(obj.sentences)
        ? obj.sentences.filter((s): s is string => typeof s === 'string')
        : [],
      createdAt: typeof obj.createdAt === 'number' ? obj.createdAt : Date.now(),
    });
  }
  return out;
}

/**
 * 将任意值安全地规范化为合法词条/句条列表。
 * english/chinese 必须为非空字符串，否则视为损坏条目丢弃。
 */
function normalizeEntries(arr: unknown): { id: string; english: string; chinese: string }[] {
  if (!Array.isArray(arr)) return [];
  const out: { id: string; english: string; chinese: string }[] = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const english = typeof obj.english === 'string' ? obj.english.trim() : '';
    const chinese = typeof obj.chinese === 'string' ? obj.chinese.trim() : '';
    if (!english || !chinese) continue;
    out.push({
      id: typeof obj.id === 'string' && obj.id ? obj.id : uid(),
      english,
      chinese,
    });
  }
  return out;
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
 * 缺失 id 的文章/词书/句书自动生成新 id 后追加；标题缺失或非法的资源跳过。
 * 返回统计信息供 UI 提示，避免"静默丢弃数据"。
 *
 * 对传入数据做整体健壮性处理：非数组字段视为空、条目级校验，
 * 防止畸形/损坏的备份文件导致半导入或后续渲染崩溃。
 */
export function importAll(data: MemoriaData): ImportStats {
  const stats: ImportStats = { added: 0, merged: 0, skipped: 0 };

  // --- 文章：按 id 合并；同 id 保留原有（内容通常唯一，不自动覆盖） ---
  const existingArticles = loadArticles();
  const articleMap = new Map(existingArticles.map(a => [a.id, a]));
  const incomingArticles = normalizeArticles(data?.articles);
  for (const article of incomingArticles) {
    if (articleMap.has(article.id)) {
      stats.skipped += 1;
    } else {
      articleMap.set(article.id, article);
      stats.added += 1;
    }
  }
  saveArticles(Array.from(articleMap.values()));

  // --- 词书：按 id 合并，条目去重（按 english 字段） ---
  const existingWordBooks = loadWordBooks();
  const wordBookMap = new Map(existingWordBooks.map(b => [b.id, b]));
  const incomingWordBooks = Array.isArray(data?.wordBooks) ? data.wordBooks : [];
  for (const book of incomingWordBooks) {
    if (!book || typeof book !== 'object') {
      stats.skipped += 1;
      continue;
    }
    const obj = book as unknown as Record<string, unknown>;
    // id 缺省/非法时自动生成，避免导入数据被静默丢弃
    const id = typeof obj.id === 'string' && obj.id ? obj.id : uid();
    if (typeof obj.title !== 'string' || !obj.title) {
      stats.skipped += 1;
      continue;
    }
    const entries = normalizeEntries(obj.entries);
    const existing = wordBookMap.get(id);
    if (existing) {
      // 合并时对已有条目同样做规范化，顺带清理历史损坏数据
      const entryMap = new Map(normalizeEntries(existing.entries).map(e => [e.english, e]));
      for (const entry of entries) {
        if (!entryMap.has(entry.english)) {
          entryMap.set(entry.english, entry);
        }
      }
      wordBookMap.set(id, { ...existing, entries: Array.from(entryMap.values()) });
      stats.merged += 1;
    } else {
      // 新书同样按 english 去重，与合并分支语义一致，避免导入重复闪卡
      const entryMap = new Map(entries.map(e => [e.english, e]));
      wordBookMap.set(id, {
        id,
        title: obj.title,
        entries: Array.from(entryMap.values()),
        createdAt: typeof obj.createdAt === 'number' ? obj.createdAt : Date.now(),
      });
      stats.added += 1;
    }
  }
  saveWordBooks(Array.from(wordBookMap.values()));

  // --- 句书：按 id 合并，条目去重（按 english 字段） ---
  const existingSentenceBooks = loadSentenceBooks();
  const sentenceBookMap = new Map(existingSentenceBooks.map(b => [b.id, b]));
  const incomingSentenceBooks = Array.isArray(data?.sentenceBooks) ? data.sentenceBooks : [];
  for (const book of incomingSentenceBooks) {
    if (!book || typeof book !== 'object') {
      stats.skipped += 1;
      continue;
    }
    const obj = book as unknown as Record<string, unknown>;
    // id 缺省/非法时自动生成，避免导入数据被静默丢弃
    const id = typeof obj.id === 'string' && obj.id ? obj.id : uid();
    if (typeof obj.title !== 'string' || !obj.title) {
      stats.skipped += 1;
      continue;
    }
    const entries = normalizeEntries(obj.entries);
    const existing = sentenceBookMap.get(id);
    if (existing) {
      const entryMap = new Map(normalizeEntries(existing.entries).map(e => [e.english, e]));
      for (const entry of entries) {
        if (!entryMap.has(entry.english)) {
          entryMap.set(entry.english, entry);
        }
      }
      sentenceBookMap.set(id, { ...existing, entries: Array.from(entryMap.values()) });
      stats.merged += 1;
    } else {
      // 新书同样按 english 去重，与合并分支语义一致，避免导入重复闪卡
      const entryMap = new Map(entries.map(e => [e.english, e]));
      sentenceBookMap.set(id, {
        id,
        title: obj.title,
        entries: Array.from(entryMap.values()),
        createdAt: typeof obj.createdAt === 'number' ? obj.createdAt : Date.now(),
      });
      stats.added += 1;
    }
  }
  saveSentenceBooks(Array.from(sentenceBookMap.values()));

  return stats;
}
