import React, { useState, useEffect } from 'react';
import type { Article } from '../../types';
import { uid } from '../../types';
import { loadArticles, addArticle, deleteArticle } from '../../utils/storage';
import { splitIntoSentences } from '../../utils/splitter';
import { ArticleMemoryView } from './ArticleMemoryView';
import { SingleExportBtn, SingleImportBtn } from '../common/JsonImportExport';

export const ArticleManager: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [memoryView, setMemoryView] = useState(false);

  useEffect(() => {
    setArticles(loadArticles());
  }, []);

  const refresh = () => setArticles(loadArticles());

  const handleAdd = () => {
    const trimmedTitle = title.trim() || `未命名文章 ${articles.length + 1}`;
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      alert('请输入文章内容');
      return;
    }
    const article: Article = {
      id: uid(),
      title: trimmedTitle,
      content: trimmedContent,
      sentences: splitIntoSentences(trimmedContent),
      createdAt: Date.now(),
    };
    addArticle(article);
    setTitle('');
    setContent('');
    refresh();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定删除该文章？')) {
      deleteArticle(id);
      refresh();
    }
  };

  const handleStartMemory = (article: Article) => {
    setSelectedArticle(article);
    setMemoryView(true);
  };

  const handleImportArticle = (data: unknown) => {
    const d = data as Partial<Article>;
    if (!d.content) {
      alert('无效的文章数据');
      return;
    }
    const article: Article = {
      id: d.id || uid(),
      title: d.title || '导入的文章',
      content: d.content,
      sentences: d.sentences || splitIntoSentences(d.content),
      createdAt: d.createdAt || Date.now(),
    };
    addArticle(article);
    refresh();
  };

  if (memoryView && selectedArticle) {
    return (
      <ArticleMemoryView
        article={selectedArticle}
        onBack={() => { setMemoryView(false); setSelectedArticle(null); }}
      />
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📖 语文记忆</h2>

      {/* 新增文章 */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>✏️ 新增文章</h3>
        <input
          style={styles.input}
          placeholder="文章标题（可选）"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          style={styles.textarea}
          placeholder="在此粘贴文章正文……"
          rows={8}
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <div style={styles.row}>
          <button style={styles.primaryBtn} onClick={handleAdd}>
            📥 导入文章
          </button>
          <SingleImportBtn label="文章 (JSON)" onData={handleImportArticle} />
        </div>
      </div>

      {/* 文章列表 */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>📚 我的文章</h3>
        {articles.length === 0 && (
          <p style={styles.empty}>还没有文章，请先导入。</p>
        )}
        {articles.map(article => (
          <div key={article.id} style={styles.articleItem}>
            <div style={styles.articleInfo}>
              <span style={styles.articleTitle}>{article.title}</span>
              <span style={styles.articleMeta}>
                {article.sentences.length} 句 | {article.content.length} 字
              </span>
            </div>
            <div style={styles.articleActions}>
              <button style={styles.memoryBtn} onClick={() => handleStartMemory(article)}>
                🧠 开始记忆
              </button>
              <SingleExportBtn
                label={article.title}
                data={article}
                filename={`${article.title}.json`}
              />
              <button style={styles.deleteBtn} onClick={() => handleDelete(article.id)}>
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto', padding: '24px 16px' },
  title: { textAlign: 'center', color: '#1e293b', marginBottom: 24 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
  },
  cardTitle: { margin: '0 0 12px 0', color: '#334155', fontSize: 18 },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    fontSize: 15,
    marginBottom: 12,
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    fontSize: 15,
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.8,
    marginBottom: 12,
    boxSizing: 'border-box',
  },
  row: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  primaryBtn: {
    padding: '10px 20px',
    fontSize: 15,
    backgroundColor: '#1e293b',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  empty: { color: '#94a3b8', textAlign: 'center', padding: 20 },
  articleItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f1f5f9',
    gap: 12,
    flexWrap: 'wrap',
  },
  articleInfo: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 120 },
  articleTitle: { fontWeight: 600, color: '#1e293b' },
  articleMeta: { fontSize: 13, color: '#94a3b8' },
  articleActions: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  memoryBtn: {
    padding: '6px 14px',
    fontSize: 14,
    backgroundColor: '#059669',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  deleteBtn: {
    padding: '6px 10px',
    fontSize: 14,
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
};
