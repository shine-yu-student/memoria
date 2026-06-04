import React, { useState, useEffect } from 'react';
import type { WordBook, SentenceBook } from '../../types';
import { uid } from '../../types';
import {
  loadWordBooks, addWordBook, deleteWordBook,
  loadSentenceBooks, addSentenceBook, deleteSentenceBook,
} from '../../utils/storage';
import { BookDetailView } from './BookDetailView';
import { EnglishMemoryView } from './EnglishMemoryView';
import { Modal } from '../common/Modal';
import { SingleExportBtn } from '../common/JsonImportExport';

type PageView = 'list' | 'detail' | 'memory';

export const BookManager: React.FC = () => {
  const [wordBooks, setWordBooks] = useState<WordBook[]>([]);
  const [sentenceBooks, setSentenceBooks] = useState<SentenceBook[]>([]);
  const [view, setView] = useState<PageView>('list');
  const [viewingBook, setViewingBook] = useState<WordBook | SentenceBook | null>(null);
  const [viewingBookType, setViewingBookType] = useState<'word' | 'sentence'>('word');

  // 弹窗状态
  const [createWordModal, setCreateWordModal] = useState(false);
  const [createSentenceModal, setCreateSentenceModal] = useState(false);
  const [newBookName, setNewBookName] = useState('');

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    setWordBooks(loadWordBooks());
    setSentenceBooks(loadSentenceBooks());
  };

  /** 创建词书 */
  const handleCreateWordBook = () => {
    const name = newBookName.trim() || `词书 ${wordBooks.length + 1}`;
    const book: WordBook = {
      id: uid(),
      title: name,
      entries: [],
      createdAt: Date.now(),
    };
    addWordBook(book);
    setCreateWordModal(false);
    setNewBookName('');
    refresh();
    // 跳转到详情页
    setViewingBook(book);
    setViewingBookType('word');
    setView('detail');
  };

  /** 创建句书 */
  const handleCreateSentenceBook = () => {
    const name = newBookName.trim() || `句书 ${sentenceBooks.length + 1}`;
    const book: SentenceBook = {
      id: uid(),
      title: name,
      entries: [],
      createdAt: Date.now(),
    };
    addSentenceBook(book);
    setCreateSentenceModal(false);
    setNewBookName('');
    refresh();
    setViewingBook(book);
    setViewingBookType('sentence');
    setView('detail');
  };

  /** 编辑按钮 */
  const handleEdit = (book: WordBook | SentenceBook, type: 'word' | 'sentence') => {
    setViewingBook(book);
    setViewingBookType(type);
    setView('detail');
  };

  /** 从详情页返回 */
  const handleBackToList = () => {
    setView('list');
    setViewingBook(null);
    refresh();
  };

  /** 数据变更回调 */
  const handleDataChange = () => {
    refresh();
  };

  /* ===== 详情页 ===== */
  if (view === 'detail' && viewingBook) {
    return (
      <BookDetailView
        book={viewingBook}
        bookType={viewingBookType}
        onBack={handleBackToList}
        onDataChange={handleDataChange}
      />
    );
  }

  /* ===== 记忆页 ===== */
  if (view === 'memory') {
    return <EnglishMemoryView onBack={() => setView('list')} />;
  }

  /* ===== 列表页 ===== */
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📝 英语记忆</h2>

      {/* 创建按钮 */}
      <div style={styles.createRow}>
        <button style={styles.createBtn} onClick={() => { setNewBookName(''); setCreateWordModal(true); }}>
          📗 创建词书
        </button>
        <button style={styles.createBtn} onClick={() => { setNewBookName(''); setCreateSentenceModal(true); }}>
          📘 创建句书
        </button>
      </div>

      {/* 词书列表 */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>📗 词书</h3>
        {wordBooks.length === 0 && <p style={styles.empty}>暂无词书。</p>}
        {wordBooks.map(b => (
          <div key={b.id} style={styles.bookItem}>
            <div style={styles.bookInfo}>
              <span style={styles.bookTitle}>{b.title}</span>
              <span style={styles.bookMeta}>{b.entries.length} 词</span>
            </div>
            <div style={styles.bookActions}>
              <button style={styles.editBtn} onClick={() => handleEdit(b, 'word')}>✏️ 编辑</button>
              <SingleExportBtn label={b.title} data={b} filename={`${b.title}.json`} />
              <button style={styles.deleteBtn} onClick={() => { deleteWordBook(b.id); refresh(); }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* 句书列表 */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>📘 句书</h3>
        {sentenceBooks.length === 0 && <p style={styles.empty}>暂无句书。</p>}
        {sentenceBooks.map(b => (
          <div key={b.id} style={styles.bookItem}>
            <div style={styles.bookInfo}>
              <span style={styles.bookTitle}>{b.title}</span>
              <span style={styles.bookMeta}>{b.entries.length} 句</span>
            </div>
            <div style={styles.bookActions}>
              <button style={styles.editBtn} onClick={() => handleEdit(b, 'sentence')}>✏️ 编辑</button>
              <SingleExportBtn label={b.title} data={b} filename={`${b.title}.json`} />
              <button style={styles.deleteBtn} onClick={() => { deleteSentenceBook(b.id); refresh(); }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* 开始记忆按钮 */}
      {(wordBooks.length > 0 || sentenceBooks.length > 0) && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button style={styles.memoryBtn} onClick={() => setView('memory')}>
            🧠 开始英语记忆
          </button>
        </div>
      )}

      {/* ===== 创建词书弹窗 ===== */}
      <Modal open={createWordModal} title="创建词书" onClose={() => setCreateWordModal(false)}>
        <div style={styles.formGroup}>
          <label style={styles.label}>词书名称</label>
          <input style={styles.input} placeholder="输入词书名称…"
            value={newBookName} onChange={e => setNewBookName(e.target.value)}
            autoFocus onKeyDown={e => e.key === 'Enter' && handleCreateWordBook()} />
        </div>
        <div style={styles.formActions}>
          <button style={styles.cancelBtn} onClick={() => setCreateWordModal(false)}>取消</button>
          <button style={styles.confirmBtn} onClick={handleCreateWordBook}>确认创建</button>
        </div>
      </Modal>

      {/* ===== 创建句书弹窗 ===== */}
      <Modal open={createSentenceModal} title="创建句书" onClose={() => setCreateSentenceModal(false)}>
        <div style={styles.formGroup}>
          <label style={styles.label}>句书名称</label>
          <input style={styles.input} placeholder="输入句书名称…"
            value={newBookName} onChange={e => setNewBookName(e.target.value)}
            autoFocus onKeyDown={e => e.key === 'Enter' && handleCreateSentenceBook()} />
        </div>
        <div style={styles.formActions}>
          <button style={styles.cancelBtn} onClick={() => setCreateSentenceModal(false)}>取消</button>
          <button style={styles.confirmBtn} onClick={handleCreateSentenceBook}>确认创建</button>
        </div>
      </Modal>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto', padding: '24px 16px' },
  title: { textAlign: 'center', color: '#1e293b', marginBottom: 24 },
  createRow: {
    display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 28,
  },
  createBtn: {
    padding: '14px 32px', fontSize: 17, fontWeight: 600,
    backgroundColor: '#1e293b', color: '#ffffff', border: 'none', borderRadius: 10,
    cursor: 'pointer',
  },
  section: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 20,
    marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
  },
  sectionTitle: { margin: '0 0 12px 0', color: '#334155', fontSize: 18 },
  empty: { color: '#94a3b8', textAlign: 'center', padding: 20 },
  bookItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid #f1f5f9', gap: 12, flexWrap: 'wrap',
  },
  bookInfo: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 120 },
  bookTitle: { fontWeight: 600, color: '#1e293b' },
  bookMeta: { fontSize: 13, color: '#94a3b8' },
  bookActions: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  editBtn: {
    padding: '6px 14px', fontSize: 14, backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', color: '#475569',
  },
  deleteBtn: {
    padding: '6px 10px', fontSize: 14, backgroundColor: '#fee2e2',
    color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer',
  },
  memoryBtn: {
    padding: '14px 40px', fontSize: 18, backgroundColor: '#059669',
    color: '#ffffff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600,
  },

  /* 表单 */
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
