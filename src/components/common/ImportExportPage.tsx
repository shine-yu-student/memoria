import React from 'react';
import { JsonImportExport, SingleExportBtn, SingleImportBtn } from './JsonImportExport';
import { loadArticles, loadWordBooks, loadSentenceBooks } from '../../utils/storage';
import type { Article, WordBook, SentenceBook } from '../../types';

interface Props {
  onDataChanged: () => void;
}

/** 导入/导出页面 */
export const ImportExportPage: React.FC<Props> = ({ onDataChanged }) => {
  const articles = loadArticles();
  const wordBooks = loadWordBooks();
  const sentenceBooks = loadSentenceBooks();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📦 数据导入与导出</h2>

      {/* 全量导入导出 */}
      <JsonImportExport onImport={onDataChanged} />

      {/* 单个资源导出 */}
      {articles.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📖 文章列表导出</h3>
          {articles.map(a => (
            <div key={a.id} style={styles.item}>
              <span>{a.title}</span>
              <SingleExportBtn label={a.title} data={a} filename={`article-${a.title}.json`} />
            </div>
          ))}
        </div>
      )}

      {wordBooks.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📗 词书列表导出</h3>
          {wordBooks.map(b => (
            <div key={b.id} style={styles.item}>
              <span>{b.title}</span>
              <SingleExportBtn label={b.title} data={b} filename={`wordbook-${b.title}.json`} />
            </div>
          ))}
        </div>
      )}

      {sentenceBooks.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📘 句书列表导出</h3>
          {sentenceBooks.map(b => (
            <div key={b.id} style={styles.item}>
              <span>{b.title}</span>
              <SingleExportBtn label={b.title} data={b} filename={`sentbook-${b.title}.json`} />
            </div>
          ))}
        </div>
      )}

      {articles.length === 0 && wordBooks.length === 0 && sentenceBooks.length === 0 && (
        <p style={styles.empty}>暂无数据。请在语文记忆或英语记忆模块中创建内容后再来导出。</p>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto', padding: '24px 16px' },
  title: { textAlign: 'center', color: 'var(--text-primary)', marginBottom: 24 },
  section: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    boxShadow: 'var(--shadow-card)',
    border: '1px solid var(--border-default)',
  },
  sectionTitle: { margin: '0 0 12px 0', color: 'var(--text-primary)', fontSize: 18 },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid var(--border-default)',
    gap: 12,
  },
  empty: { textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontSize: 15 },
};
