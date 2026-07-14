import React, { useState, useEffect, useCallback } from 'react';
import type { WordBook, SentenceBook } from '../../types';
import { uid } from '../../types';
import {
  loadWordBooks, addWordBook, deleteWordBook,
  loadSentenceBooks, addSentenceBook, deleteSentenceBook,
} from '../../utils/storage';
import { BookDetailView } from './BookDetailView';
import { EnglishMemoryView } from './EnglishMemoryView';
import { Modal } from '../common/Modal';

type PageView = 'list' | 'detail' | 'memory';

export const BookManager: React.FC = () => {
  const [wordBooks, setWordBooks] = useState<WordBook[]>([]);
  const [sentenceBooks, setSentenceBooks] = useState<SentenceBook[]>([]);
  const [view, setView] = useState<PageView>('list');
  const [viewingBook, setViewingBook] = useState<WordBook | SentenceBook | null>(null);
  const [viewingBookType, setViewingBookType] = useState<'word' | 'sentence'>('word');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredBookId, setHoveredBookId] = useState<string | null>(null);

  // Select mode
  const [selectMode, setSelectMode] = useState(false);
  const [selectedWordEntryIds, setSelectedWordEntryIds] = useState<Set<string>>(new Set());
  const [selectedSentenceEntryIds, setSelectedSentenceEntryIds] = useState<Set<string>>(new Set());
  const [lastClickedEntryId, setLastClickedEntryId] = useState<string | null>(null);
  const [preSelectedEntries, setPreSelectedEntries] = useState<{ id: string; english: string; chinese: string }[] | null>(null);

  // 弹窗状态
  const [createWordModal, setCreateWordModal] = useState(false);
  const [createSentenceModal, setCreateSentenceModal] = useState(false);
  const [newBookName, setNewBookName] = useState('');

  useEffect(() => { refresh(); }, []);

  const refresh = () => {
    setWordBooks(loadWordBooks());
    setSentenceBooks(loadSentenceBooks());
  };

  const filteredWordBooks = wordBooks.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredSentenceBooks = sentenceBooks.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSelected = selectedWordEntryIds.size + selectedSentenceEntryIds.size;

  /** 创建词书 */
  const handleCreateWordBook = () => {
    const name = newBookName.trim() || `词书 ${wordBooks.length + 1}`;
    const book: WordBook = { id: uid(), title: name, entries: [], createdAt: Date.now() };
    addWordBook(book);
    setCreateWordModal(false);
    setNewBookName('');
    refresh();
    setViewingBook(book);
    setViewingBookType('word');
    setView('detail');
  };

  /** 创建句书 */
  const handleCreateSentenceBook = () => {
    const name = newBookName.trim() || `句书 ${sentenceBooks.length + 1}`;
    const book: SentenceBook = { id: uid(), title: name, entries: [], createdAt: Date.now() };
    addSentenceBook(book);
    setCreateSentenceModal(false);
    setNewBookName('');
    refresh();
    setViewingBook(book);
    setViewingBookType('sentence');
    setView('detail');
  };

  const handleBackToList = () => {
    setView('list');
    setViewingBook(null);
    refresh();
  };

  const handleDataChange = () => { refresh(); };

  const handleDeleteWordBook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const book = wordBooks.find(b => b.id === id);
    if (!book) return;
    if (confirm(`确定删除词书「${book.title}」？`)) { deleteWordBook(id); refresh(); }
  };

  const handleDeleteSentenceBook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const book = sentenceBooks.find(b => b.id === id);
    if (!book) return;
    if (confirm(`确定删除句书「${book.title}」？`)) { deleteSentenceBook(id); refresh(); }
  };

  /** Toggle select mode */
  const toggleSelectMode = () => {
    if (!selectMode) {
      setSelectMode(true);
    } else {
      setSelectMode(false);
      setSelectedWordEntryIds(new Set());
      setSelectedSentenceEntryIds(new Set());
      setLastClickedEntryId(null);
    }
  };

  /** Select/deselect all entries in a book */
  const toggleBookSelection = (bookId: string, isWord: boolean) => {
    const book = isWord ? wordBooks.find(b => b.id === bookId) : sentenceBooks.find(b => b.id === bookId);
    if (!book) return;
    const currentSet = isWord ? selectedWordEntryIds : selectedSentenceEntryIds;
    const setter = isWord ? setSelectedWordEntryIds : setSelectedSentenceEntryIds;

    const allSelected = book.entries.every(e => currentSet.has(e.id));
    const next = new Set(currentSet);
    if (allSelected) {
      book.entries.forEach(e => next.delete(e.id));
    } else {
      book.entries.forEach(e => next.add(e.id));
    }
    setter(next);
  };

  /** Toggle single entry */
  const toggleEntry = useCallback((entryId: string, isWord: boolean) => {
    const setter = isWord ? setSelectedWordEntryIds : setSelectedSentenceEntryIds;
    setter(prev => {
      const next = new Set(prev);
      next.has(entryId) ? next.delete(entryId) : next.add(entryId);
      return next;
    });
  }, []);

  /** Range selection with Shift+click */
  const handleRangeSelect = useCallback((entryId: string, isWord: boolean) => {
    const book = isWord
      ? wordBooks.find(b => b.entries.some(e => e.id === entryId))
      : sentenceBooks.find(b => b.entries.some(e => e.id === entryId));
    if (!book) return;

    const entryIds = book.entries.map(e => e.id);
    const lastIdx = lastClickedEntryId ? entryIds.indexOf(lastClickedEntryId) : -1;
    const currentIdx = entryIds.indexOf(entryId);
    if (lastIdx === -1 || currentIdx === -1) {
      toggleEntry(entryId, isWord);
      setLastClickedEntryId(entryId);
      return;
    }

    const start = Math.min(lastIdx, currentIdx);
    const end = Math.max(lastIdx, currentIdx);
    const setter = isWord ? setSelectedWordEntryIds : setSelectedSentenceEntryIds;
    setter(prev => {
      const next = new Set(prev);
      for (let i = start; i <= end; i++) next.add(entryIds[i]);
      return next;
    });
    setLastClickedEntryId(entryId);
  }, [lastClickedEntryId, toggleEntry, wordBooks, sentenceBooks]);

  /** Start the flashcard session */
  const handleStartMemory = () => {
    if (totalSelected === 0) { alert('请至少选择一项内容'); return; }

    // Gather all selected entries from word books
    const entries: { id: string; english: string; chinese: string }[] = [];
    for (const book of wordBooks) {
      for (const e of book.entries) {
        if (selectedWordEntryIds.has(e.id)) {
          entries.push({ id: e.id, english: e.english, chinese: e.chinese });
        }
      }
    }
    for (const book of sentenceBooks) {
      for (const e of book.entries) {
        if (selectedSentenceEntryIds.has(e.id)) {
          entries.push({ id: e.id, english: e.english, chinese: e.chinese });
        }
      }
    }

    setPreSelectedEntries(entries);
    setView('memory');
  };

  /* ===== 详情页 ===== */
  if (view === 'detail' && viewingBook) {
    const isWord = viewingBookType === 'word';
    return (
      <BookDetailView
        book={viewingBook}
        bookType={viewingBookType}
        onBack={handleBackToList}
        onDataChange={handleDataChange}
        selectMode={selectMode}
        selectedEntryIds={isWord ? selectedWordEntryIds : selectedSentenceEntryIds}
        onToggleEntry={(id) => toggleEntry(id, isWord)}
        onSelectRange={(id) => handleRangeSelect(id, isWord)}
      />
    );
  }

  /* ===== 记忆页 ===== */
  if (view === 'memory') {
    return (
      <EnglishMemoryView
        onBack={() => { setView('list'); setSelectMode(false); setPreSelectedEntries(null); }}
        initialEntries={preSelectedEntries ?? undefined}
      />
    );
  }

  /* ===== 列表页 ===== */
  return (
    <div style={styles.container}>
      {/* Header row */}
      <div style={styles.headerRow}>
        <div style={styles.titleGroup}>
          <span style={styles.titleIcon}>📝</span>
          <h2 style={styles.title}>英语记忆</h2>
          {(wordBooks.length > 0 || sentenceBooks.length > 0) && !selectMode && (
            <button style={styles.memoryStartBtn} onClick={toggleSelectMode}>
              🧠 开始英语记忆
            </button>
          )}
          {selectMode && (
            <>
              <button style={styles.exitSelectBtn} onClick={toggleSelectMode}>✕ 退出选择</button>
              <button
                style={styles.startMemoryBtn}
                onClick={handleStartMemory}
                disabled={totalSelected === 0}
              >
                开始记忆{totalSelected > 0 ? ` (${totalSelected})` : ''}
              </button>
            </>
          )}
        </div>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="搜索…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Separator */}
      <div style={styles.separator} />

      {/* Select mode hint */}
      {selectMode && (
        <p style={styles.selectHint}>点击词书卡片可进入并选择单个条目，按住 Shift 可范围选择。</p>
      )}

      {/* Word Books section */}
      <div style={styles.sectionHeader}>
        <span style={styles.sectionIcon}>📗</span>
        <span style={styles.sectionTitle}>词书</span>
        <button style={styles.createSmallBtn} onClick={() => { setNewBookName(''); setCreateWordModal(true); }}>
          ＋ 创建词书
        </button>
      </div>

      <div style={styles.booksContainer}>
        {filteredWordBooks.length === 0 && (
          <p style={styles.empty}>{searchQuery ? '未找到匹配的词书。' : '暂无词书，点击上方"创建词书"开始。'}</p>
        )}
        <div style={styles.booksGrid}>
          {filteredWordBooks.map(book => (
            <div
              key={book.id}
              style={styles.bookCard}
              onClick={() => {
                if (selectMode) {
                  // In select mode, go to detail view to select individual entries
                  setViewingBook(book);
                  setViewingBookType('word');
                  setView('detail');
                } else {
                  setViewingBook(book);
                  setViewingBookType('word');
                  setView('detail');
                }
              }}
              onMouseEnter={() => setHoveredBookId(book.id)}
              onMouseLeave={() => setHoveredBookId(null)}
            >
              <span style={styles.bookCardTitle}>{book.title}</span>
              <span style={styles.bookCardMeta}>{book.entries.length} 词</span>
              {hoveredBookId === book.id && !selectMode && (
                <button style={styles.deleteBtn} onClick={(e) => handleDeleteWordBook(book.id, e)} title="删除">🗑️</button>
              )}
              {hoveredBookId === book.id && selectMode && (
                <div
                  style={styles.selectCheckbox}
                  onClick={(e) => { e.stopPropagation(); toggleBookSelection(book.id, true); }}
                >
                  <input type="checkbox" readOnly checked={book.entries.every(e => selectedWordEntryIds.has(e.id))} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sentence Books section */}
      <div style={{ ...styles.sectionHeader, marginTop: 20 }}>
        <span style={styles.sectionIcon}>📘</span>
        <span style={styles.sectionTitle}>句书</span>
        <button style={styles.createSmallBtn} onClick={() => { setNewBookName(''); setCreateSentenceModal(true); }}>
          ＋ 创建句书
        </button>
      </div>

      <div style={styles.booksContainer}>
        {filteredSentenceBooks.length === 0 && (
          <p style={styles.empty}>{searchQuery ? '未找到匹配的句书。' : '暂无句书，点击上方"创建句书"开始。'}</p>
        )}
        <div style={styles.booksGrid}>
          {filteredSentenceBooks.map(book => (
            <div
              key={book.id}
              style={styles.bookCard}
              onClick={() => {
                setViewingBook(book);
                setViewingBookType('sentence');
                setView('detail');
              }}
              onMouseEnter={() => setHoveredBookId(book.id)}
              onMouseLeave={() => setHoveredBookId(null)}
            >
              <span style={styles.bookCardTitle}>{book.title}</span>
              <span style={styles.bookCardMeta}>{book.entries.length} 句</span>
              {hoveredBookId === book.id && !selectMode && (
                <button style={styles.deleteBtn} onClick={(e) => handleDeleteSentenceBook(book.id, e)} title="删除">🗑️</button>
              )}
              {hoveredBookId === book.id && selectMode && (
                <div
                  style={styles.selectCheckbox}
                  onClick={(e) => { e.stopPropagation(); toggleBookSelection(book.id, false); }}
                >
                  <input type="checkbox" readOnly checked={book.entries.every(e => selectedSentenceEntryIds.has(e.id))} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

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
  container: { padding: '24px 28px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  titleGroup: { display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  titleIcon: { fontSize: 28 },
  title: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap' },
  memoryStartBtn: {
    padding: '8px 20px', fontSize: 14, fontWeight: 600,
    backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)', borderRadius: 8, cursor: 'pointer',
    whiteSpace: 'nowrap', marginLeft: 4,
  },
  exitSelectBtn: {
    padding: '8px 18px', fontSize: 14,
    backgroundColor: 'var(--bg-danger)', color: 'var(--text-red)',
    border: '1px solid var(--border-red)', borderRadius: 8, cursor: 'pointer',
    whiteSpace: 'nowrap', marginLeft: 4,
  },
  startMemoryBtn: {
    padding: '8px 18px', fontSize: 14, fontWeight: 600,
    backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)', borderRadius: 8, cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  searchInput: {
    padding: '8px 14px', fontSize: 14, border: 'none',
    borderBottom: '2px solid var(--border-strong)',
    borderRadius: 0, backgroundColor: 'transparent', color: 'var(--text-primary)',
    outline: 'none', width: 180,
  },
  selectHint: { color: 'var(--text-description)', fontSize: 13, marginTop: -8, marginBottom: 8 },
  separator: { height: 1, backgroundColor: 'var(--border-default)', margin: '16px 0' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' },
  createSmallBtn: { padding: '5px 14px', fontSize: 13, fontWeight: 500, backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: 6, cursor: 'pointer', marginLeft: 8 },
  booksContainer: { backgroundColor: 'var(--bg-page)', borderRadius: 12, padding: 16, border: '1px solid var(--border-default)', minHeight: 60 },
  booksGrid: { display: 'flex', flexWrap: 'wrap', gap: 10, alignContent: 'flex-start' },
  bookCard: { position: 'relative' as const, padding: '12px 16px', backgroundColor: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border-default)', cursor: 'pointer', minWidth: 140, maxWidth: 220, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 4 },
  bookCardTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  bookCardMeta: { fontSize: 12, color: 'var(--text-muted)' },
  deleteBtn: { position: 'absolute' as const, bottom: 6, right: 6, padding: '4px 8px', fontSize: 13, backgroundColor: 'var(--bg-danger)', color: 'var(--text-red)', border: 'none', borderRadius: 6, cursor: 'pointer', lineHeight: 1 },
  selectCheckbox: { position: 'absolute' as const, bottom: 6, right: 6, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  empty: { color: 'var(--text-muted)', textAlign: 'center', padding: 20, width: '100%', fontSize: 14 },
  formGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', fontSize: 15, border: 'none', borderBottom: '2px solid var(--border-strong)', borderRadius: 0, boxSizing: 'border-box', backgroundColor: 'transparent' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelBtn: { padding: '8px 20px', fontSize: 15, backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)' },
  confirmBtn: { padding: '8px 20px', fontSize: 15, backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: 6, cursor: 'pointer' },
};
