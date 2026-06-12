import React, { useState, useEffect } from 'react';
import type { Article } from '../../types';
import { uid } from '../../types';
import { loadArticles, addArticle, deleteArticle } from '../../utils/storage';
import { splitIntoSentences } from '../../utils/splitter';
import { ArticleMemoryView } from './ArticleMemoryView';
import { ArticleDetailView } from './ArticleDetailView';
import { Modal } from '../common/Modal';
import { SingleExportBtn } from '../common/JsonImportExport';

type PageView = 'list' | 'detail' | 'memory';

export const ArticleManager: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [view, setView] = useState<PageView>('list');

  // 创建文章弹窗
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newArticleTitle, setNewArticleTitle] = useState('');

  useEffect(() => {
    setArticles(loadArticles());
  }, []);

  const refresh = () => setArticles(loadArticles());

  const handleDelete = (id: string) => {
    if (confirm('确定删除该文章？')) {
      deleteArticle(id);
      refresh();
    }
  };

  const handleStartMemory = (article: Article) => {
    setSelectedArticle(article);
    setView('memory');
  };

  /** 创建文章 */
  const handleCreateArticle = () => {
    const title = newArticleTitle.trim() || `未命名文章 ${articles.length + 1}`;
    const article: Article = {
      id: uid(),
      title,
      content: '',
      sentences: [],
      createdAt: Date.now(),
    };
    addArticle(article);
    setCreateModalOpen(false);
    setNewArticleTitle('');
    refresh();
    // 跳转到详情页
    setSelectedArticle(article);
    setView('detail');
  };

  /** 编辑按钮 */
  const handleEdit = (article: Article) => {
    setSelectedArticle(article);
    setView('detail');
  };

  /** 从详情页返回 */
  const handleBackToList = () => {
    setView('list');
    setSelectedArticle(null);
    refresh();
  };

  /** 从记忆页返回 */
  const handleBackFromMemory = () => {
    setView('list');
    setSelectedArticle(null);
  };

  /** 数据变更回调 */
  const handleDataChange = () => {
    refresh();
  };

  /* ===== 详情页 ===== */
  if (view === 'detail' && selectedArticle) {
    return (
      <ArticleDetailView
        article={selectedArticle}
        onBack={handleBackToList}
        onDataChange={handleDataChange}
      />
    );
  }

  /* ===== 记忆页 ===== */
  if (view === 'memory' && selectedArticle) {
    return (
      <ArticleMemoryView
        article={selectedArticle}
        onBack={handleBackFromMemory}
      />
    );
  }

  /* ===== 列表页 ===== */
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📖 语文记忆</h2>

      {/* 创建按钮 */}
      <div style={styles.createRow}>
        <button style={styles.createBtn} onClick={() => { setNewArticleTitle(''); setCreateModalOpen(true); }}>
          ✏️ 创建文章
        </button>
      </div>

      {/* 文章列表 */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>📚 我的文章</h3>
        {articles.length === 0 && (
          <p style={styles.empty}>还没有文章，点击上方"创建文章"开始。</p>
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
              <button style={styles.editBtn} onClick={() => handleEdit(article)}>
                ✏️ 编辑
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

      {/* ===== 创建文章弹窗 ===== */}
      <Modal open={createModalOpen} title="创建文章" onClose={() => setCreateModalOpen(false)}>
        <div style={styles.formGroup}>
          <label style={styles.label}>文章标题</label>
          <input style={styles.input} placeholder="输入文章标题…"
            value={newArticleTitle} onChange={e => setNewArticleTitle(e.target.value)}
            autoFocus onKeyDown={e => e.key === 'Enter' && handleCreateArticle()} />
        </div>
        <div style={styles.formActions}>
          <button style={styles.cancelBtn} onClick={() => setCreateModalOpen(false)}>取消</button>
          <button style={styles.confirmBtn} onClick={handleCreateArticle}>确认创建</button>
        </div>
      </Modal>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto', padding: '24px 16px' },
  title: { textAlign: 'center', color: 'var(--text-primary)', marginBottom: 24 },
  createRow: {
    display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 28,
  },
  createBtn: {
    padding: '14px 32px', fontSize: 17, fontWeight: 600,
    backgroundColor: 'var(--bg-primary)', color: 'var(--text-on-primary)', border: 'none', borderRadius: 10,
    cursor: 'pointer',
  },
  card: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    boxShadow: 'var(--shadow-card)',
    border: '1px solid var(--border-default)',
  },
  cardTitle: { margin: '0 0 12px 0', color: 'var(--text-primary)', fontSize: 18 },
  empty: { color: 'var(--text-muted)', textAlign: 'center', padding: 20 },
  articleItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid var(--border-default)',
    gap: 12,
    flexWrap: 'wrap',
  },
  articleInfo: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 120 },
  articleTitle: { fontWeight: 600, color: 'var(--text-primary)' },
  articleMeta: { fontSize: 13, color: 'var(--text-muted)' },
  articleActions: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  memoryBtn: {
    padding: '6px 14px',
    fontSize: 14,
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-on-primary)',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  editBtn: {
    padding: '6px 14px', fontSize: 14, backgroundColor: 'var(--bg-hover)',
    border: '1px solid var(--border-default)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)',
  },
  deleteBtn: {
    padding: '6px 10px',
    fontSize: 14,
    backgroundColor: 'var(--bg-danger)',
    color: 'var(--text-red)',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },

  /* 表单 */
  formGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 12px', fontSize: 15,
    border: '1px solid var(--border-strong)', borderRadius: 8, boxSizing: 'border-box',
  },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelBtn: {
    padding: '8px 20px', fontSize: 15, backgroundColor: 'var(--bg-hover)',
    border: '1px solid var(--border-default)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)',
  },
  confirmBtn: {
    padding: '8px 20px', fontSize: 15, backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-on-primary)', border: 'none', borderRadius: 6, cursor: 'pointer',
  },
};
