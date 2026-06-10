import React, { useState, useCallback } from 'react';
import type { Article } from '../../types';
import { updateArticle, deleteArticle } from '../../utils/storage';
import { splitIntoSentences } from '../../utils/splitter';
import { Modal } from '../common/Modal';

interface Props {
  article: Article;
  onBack: () => void;
  onDataChange: () => void;
}

export const ArticleDetailView: React.FC<Props> = ({ article: initialArticle, onBack, onDataChange }) => {
  const [article, setArticle] = useState<Article>(initialArticle);
  const [content, setContent] = useState(initialArticle.content);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState(initialArticle.title);

  /** 持久化到 storage（保存时重新切分句子） */
  const persist = useCallback((updated: Article) => {
    updateArticle(updated);
    setArticle(updated);
  }, []);

  /** 删除整个文章 */
  const handleDelete = () => {
    if (!confirm(`确定删除文章「${article.title}」？此操作不可撤销。`)) return;
    deleteArticle(article.id);
    onDataChange();
    onBack();
  };

  /** 重命名 */
  const handleRename = () => {
    if (!renameTitle.trim()) { alert('名称不能为空'); return; }
    const updated = { ...article, title: renameTitle.trim() };
    persist(updated);
    setRenameModalOpen(false);
    onDataChange();
  };

  /** 内容变更 */
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    const updated = {
      ...article,
      content: newContent,
      sentences: splitIntoSentences(newContent),
    };
    persist(updated);
    onDataChange();
  };

  return (
    <div style={styles.page}>
      <div style={styles.stickyHeader}>
        <div style={styles.opaqueRegion}>
          <div style={styles.headerCard}>
            <div style={styles.topBar}>
              <button style={styles.backBtn} onClick={onBack}>← 返回</button>
              <h1 style={styles.articleTitle}>{article.title}</h1>
              <span style={styles.badge}>📖 文章</span>
            </div>
            <div style={styles.actionBar}>
              <button style={styles.outlineBtn} onClick={() => { setRenameTitle(article.title); setRenameModalOpen(true); }}>
                ✏️ 重命名
              </button>
              <button style={styles.dangerBtn} onClick={handleDelete}>🗑️ 删除</button>
            </div>
          </div>
        </div>
      </div>

      {/* 文章内容编辑区 */}
      <div style={styles.cardContainer}>
        <div style={styles.editorCard}>
          <textarea
            style={styles.textarea}
            rows={20}
            placeholder="在此输入文章正文……"
            value={content}
            onChange={e => handleContentChange(e.target.value)}
          />
          <div style={styles.metaInfo}>
            共 {article.sentences.length} 句 / {content.length} 字
          </div>
        </div>
      </div>

      {/* ===== 重命名弹窗 ===== */}
      <Modal open={renameModalOpen} title="重命名文章" onClose={() => setRenameModalOpen(false)}>
        <div style={styles.formGroup}>
          <label style={styles.label}>名称</label>
          <input style={styles.input} value={renameTitle} onChange={e => setRenameTitle(e.target.value)}
            autoFocus onKeyDown={e => e.key === 'Enter' && handleRename()} />
        </div>
        <div style={styles.formActions}>
          <button style={styles.cancelBtn} onClick={() => setRenameModalOpen(false)}>取消</button>
          <button style={styles.confirmBtn} onClick={handleRename}>确认重命名</button>
        </div>
      </Modal>
    </div>
  );
};

/* ==================== 样式 ==================== */

const styles: Record<string, React.CSSProperties> = {
  stickyHeader: {
    flexShrink: 0,
  },
  opaqueRegion: {
    background: '#f8fafc',
    padding: '12px 0 8px 0',
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: '14px 18px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  topBar: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '0 0 12px 0', borderBottom: '1px solid #e2e8f0', marginBottom: 16,
  },
  backBtn: {
    padding: '6px 14px', fontSize: 14, backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', color: '#475569',
  },
  articleTitle: { fontSize: 24, fontWeight: 700, color: '#1e293b', flex: 1, margin: 0 },
  badge: { fontSize: 14, color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 12px', borderRadius: 12 },
  actionBar: {
    display: 'flex', gap: 10, flexWrap: 'wrap',
  },
  page: {
    maxWidth: 900, margin: '0 auto', padding: '16px',
    height: 'calc(100vh - 56px)',
    display: 'flex', flexDirection: 'column',
  },
  outlineBtn: {
    padding: '10px 20px', fontSize: 15,
    backgroundColor: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer',
  },
  dangerBtn: {
    padding: '10px 20px', fontSize: 15,
    backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer',
  },
  cardContainer: {
    marginLeft: -16,
    marginRight: -16,
    marginBottom: 16,
    padding: '16px 16px 8px',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    flex: 1,
    overflowY: 'auto',
  },
  editorCard: {
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    fontSize: 16,
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.8,
    boxSizing: 'border-box',
    minHeight: 300,
  },
  metaInfo: {
    fontSize: 13, color: '#94a3b8', textAlign: 'right', padding: '0 4px',
  },
  formGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 12px', fontSize: 15,
    border: '1px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box',
  },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelBtn: {
    padding: '8px 20px', fontSize: 15, backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', color: '#475569',
  },
  confirmBtn: {
    padding: '8px 20px', fontSize: 15, backgroundColor: '#059669',
    color: '#ffffff', border: 'none', borderRadius: 6, cursor: 'pointer',
  },
};
