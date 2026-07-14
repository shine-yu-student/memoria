import React, { useState, useEffect } from 'react';
import type { Article } from '../../types';
import { uid } from '../../types';
import { loadArticles, addArticle, deleteArticle } from '../../utils/storage';
import { ArticleMemoryView } from './ArticleMemoryView';
import { ArticleDetailView } from './ArticleDetailView';
import { Modal } from '../common/Modal';

type PageView = 'list' | 'detail' | 'memory';

export const ArticleManager: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [view, setView] = useState<PageView>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredArticleId, setHoveredArticleId] = useState<string | null>(null);

  // 创建文章弹窗
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newArticleTitle, setNewArticleTitle] = useState('');

  useEffect(() => {
    setArticles(loadArticles());
  }, []);

  const refresh = () => setArticles(loadArticles());

  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const article = articles.find(a => a.id === id);
    if (!article) return;
    if (confirm(`确定删除文章「${article.title}」？`)) {
      deleteArticle(id);
      refresh();
    }
  };

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
        onStartMemory={(article) => {
          setSelectedArticle(article);
          setView('memory');
        }}
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
      {/* Header row: title + create button + search */}
      <div style={styles.headerRow}>
        <div style={styles.titleGroup}>
          <span style={styles.titleIcon}>📖</span>
          <h2 style={styles.title}>文章记忆</h2>
          <button style={styles.createBtn} onClick={() => { setNewArticleTitle(''); setCreateModalOpen(true); }}>
            ✏️ 创建文章
          </button>
        </div>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="搜索文章…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Separator */}
      <div style={styles.separator} />

      {/* My Articles section */}
      <div style={styles.sectionHeader}>
        <span style={styles.sectionIcon}>📚</span>
        <span style={styles.sectionTitle}>我的文章</span>
      </div>

      {/* Articles container */}
      <div style={styles.articlesContainer}>
        {filteredArticles.length === 0 && (
          <p style={styles.empty}>
            {searchQuery ? '未找到匹配的文章。' : '还没有文章，点击上方"创建文章"开始。'}
          </p>
        )}
        <div style={styles.articlesGrid}>
          {filteredArticles.map(article => (
            <div
              key={article.id}
              style={styles.articleCard}
              onClick={() => {
                setSelectedArticle(article);
                setView('detail');
              }}
              onMouseEnter={() => setHoveredArticleId(article.id)}
              onMouseLeave={() => setHoveredArticleId(null)}
            >
              <span style={styles.articleCardTitle}>{article.title}</span>
              {hoveredArticleId === article.id && (
                <button
                  style={styles.deleteBtn}
                  onClick={(e) => handleDelete(article.id, e)}
                  title="删除"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>
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
  container: {
    padding: '24px 28px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  titleIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  createBtn: {
    padding: '8px 20px',
    fontSize: 14,
    fontWeight: 600,
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    cursor: 'pointer',
    marginLeft: 8,
  },
  searchInput: {
    padding: '8px 14px',
    fontSize: 14,
    border: 'none',
    borderBottom: '2px solid var(--border-strong)',
    borderRadius: 0,
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    outline: 'none',
    width: 200,
  },
  separator: {
    height: 1,
    backgroundColor: 'var(--border-default)',
    margin: '16px 0',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  articlesContainer: {
    backgroundColor: 'var(--bg-page)',
    borderRadius: 12,
    padding: 16,
    border: '1px solid var(--border-default)',
    flex: 1,
    overflowY: 'auto',
  },
  articlesGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    alignContent: 'flex-start',
  },
  articleCard: {
    position: 'relative' as const,
    padding: '12px 16px',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 10,
    border: '1px solid var(--border-default)',
    cursor: 'pointer',
    minWidth: 140,
    maxWidth: 220,
    boxShadow: 'var(--shadow-card)',
    transition: 'box-shadow 0.15s',
  },
  articleCardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  deleteBtn: {
    position: 'absolute' as const,
    bottom: 6,
    right: 6,
    padding: '4px 8px',
    fontSize: 13,
    backgroundColor: 'var(--bg-danger)',
    color: 'var(--text-red)',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    lineHeight: 1,
  },
  empty: {
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: 40,
    width: '100%',
  },
  /* 表单 */
  formGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 12px', fontSize: 15,
    border: 'none',
    borderBottom: '2px solid var(--border-strong)',
    borderRadius: 0,
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
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


