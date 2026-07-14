/** 唯一 ID 生成 */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ==================== 指导记忆（Guided Memory） ==================== */

/** 指导记忆中的一个步骤 */
export interface GuideStep {
  /** 提示文本 */
  hint: string;
  /** 该步骤要记忆的句子在文章中的索引 */
  sentenceIndices: number[];
}

/** 指导记忆配置 */
export interface GuideConfig {
  steps: GuideStep[];
}

/* ==================== 语文记忆 ==================== */

/** 一篇文章 */
export interface Article {
  id: string;
  title: string;
  /** 全文原文 */
  content: string;
  /** 按分隔符切分后的句子列表 */
  sentences: string[];
  createdAt: number;
}

/* ==================== 英语记忆 ==================== */

/** 词书 — 单词/短语 → 中文 */
export interface WordBook {
  id: string;
  title: string;
  entries: WordEntry[];
  createdAt: number;
}

export interface WordEntry {
  id: string;
  english: string;
  chinese: string;
}

/** 句书 — 英语句子 → 中文翻译 */
export interface SentenceBook {
  id: string;
  title: string;
  entries: SentenceEntry[];
  createdAt: number;
}

export interface SentenceEntry {
  id: string;
  english: string;
  chinese: string;
}

/* ==================== 记忆会话 ==================== */

/** 一个填空项目 */
export interface BlankItem {
  id: string;
  /** 正确原文 */
  correct: string;
  /** 用户输入 */
  userInput: string;
  /** 是否已批改 */
  graded: boolean;
  /** 是否完全正确 */
  correctFlag: boolean;
}

/** 语文记忆会话 */
export interface ChineseMemorySession {
  articleId: string;
  articleTitle: string;
  /** 'full' | 'partial-random' | 'partial-custom' */
  mode: string;
  /** 被抽取作为填空题的句子索引 */
  blankIndices: number[];
  blanks: BlankItem[];
  completed: boolean;
  score: number;
}

/** 英语记忆会话 */
export interface EnglishMemorySession {
  bookIds: string[];
  mode: string;
  blanks: BlankItem[];
  completed: boolean;
  score: number;
}

/* ==================== 导入导出 ==================== */

/** 系统完整数据快照 */
export interface MemoriaData {
  version: number;
  articles: Article[];
  wordBooks: WordBook[];
  sentenceBooks: SentenceBook[];
  exportedAt: number;
}
