import React, { useState, useCallback } from 'react';
import type { Article } from '../../types';
import { updateArticle } from '../../utils/storage';
import { splitIntoSentences } from '../../utils/splitter';
import { SingleExportBtn } from '../common/JsonImportExport';

interface Props {
  article: Article;
  onBack: () => void;
  onDataChange: () => void;
  onStartMemory?: (article: Article) => void;
}

export const ArticleDetailView: React.FC<Props> = ({ article: initialArticle, onBack, onDataChange, onStartMemory }) => {
  const [article, setArticle] = useState<Article>(initialArticle);
  const [content, setContent] = useState(initialArticle.content);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(initialArticle.title);

  /** 持久化到 storage（保存时重新切分句子） */
  const persist = useCallback((updated: Article) => {
    updateArticle(updated);
    setArticle(updated);
  }, []);

  /** 保存标题 */
  const handleSaveTitle = () => {
    const newTitle = titleDraft.trim() || article.title;
    const updated = { ...article, title: newTitle };
    persist(updated);
    setEditingTitle(false);
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
      {/* Header row: back + title + buttons */}
      <div style={styles.headerRow}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={onBack}>← 返回</button>
          {editingTitle ? (
            <input
              style={styles.titleInput}
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(article.title); }
              }}
              autoFocus
            />
          ) : (
            <h1
              style={styles.title}
              onClick={() => { setTitleDraft(article.title); setEditingTitle(true); }}
              title="点击修改标题"
            >
              {article.title}
            </h1>
          )}
        </div>
        <div style={styles.headerRight}>
          <SingleExportBtn
            label={article.title}
            data={article}
            filename={`${article.title}.json`}
          />
          <button style={styles.memoryBtn} onClick={() => {
            onStartMemory?.(article);
          }}>
            🧠 开始记忆
          </button>
        </div>
      </div>

      {/* Separator */}
      <div style={styles.separator} />

      {/* Editor card */}
      <div style={styles.editorCard}>
        <textarea
          style={styles.textarea}
          placeholder="在此输入文章正文……"
          value={content}
          onChange={e => handleContentChange(e.target.value)}
        />
        <div style={styles.metaInfo}>
          共 {article.sentences.length} 句 / {content.length} 字
        </div>
      </div>
    </div>
  );
};

/* ==================== 样式 ==================== */

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '24px 28px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
    maxHeight: '100%',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  backBtn: {
    padding: '6px 14px',
    fontSize: 14,
    backgroundColor: 'var(--bg-hover)',
    border: '1px solid var(--border-default)',
    borderRadius: 6,
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  titleInput: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-primary)',
    border: 'none',
    borderBottom: '2px solid var(--border-strong)',
    borderRadius: 0,
    padding: '4px 10px',
    backgroundColor: 'transparent',
    outline: 'none',
    flex: 1,
    maxWidth: 400,
  },
  memoryBtn: {
    padding: '8px 20px',
    fontSize: 14,
    fontWeight: 600,
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  separator: {
    height: 1,
    backgroundColor: 'var(--border-default)',
    margin: '16px 0',
  },
  editorCard: {
    flex: 1,
    backgroundColor: 'var(--bg-page)',
    borderRadius: 12,
    border: '1px solid var(--border-default)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  textarea: {
    flex: 1,
    width: '100%',
    padding: '14px 16px',
    border: 'none',
    borderBottom: '2px solid var(--border-strong)',
    borderRadius: 0,
    fontSize: 16,
    resize: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.8,
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    minHeight: 200,
  },
  metaInfo: {
    fontSize: 13,
    color: 'var(--text-muted)',
    textAlign: 'right',
    padding: '8px 4px 0',
  },
};
