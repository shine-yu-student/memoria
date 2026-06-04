import React, { useState, useEffect } from 'react';
import type { WordBook, SentenceBook, WordEntry, SentenceEntry } from '../../types';
import { uid } from '../../types';
import {
  loadWordBooks, addWordBook, deleteWordBook,
  loadSentenceBooks, addSentenceBook, deleteSentenceBook,
} from '../../utils/storage';
import { EnglishMemoryView } from './EnglishMemoryView';
import { SingleExportBtn, SingleImportBtn } from '../common/JsonImportExport';

export const BookManager: React.FC = () => {
  const [wordBooks, setWordBooks] = useState<WordBook[]>([]);
  const [sentenceBooks, setSentenceBooks] = useState<SentenceBook[]>([]);

  // 新建词书
  const [wbTitle, setWbTitle] = useState('');
  const [wbPairs, setWbPairs] = useState<string>('');
  const [sbTitle, setSbTitle] = useState('');
  const [sbPairs, setSbPairs] = useState<string>('');

  // 记忆
  const [memoryView, setMemoryView] = useState(false);

  useEffect(() => {
    setWordBooks(loadWordBooks());
    setSentenceBooks(loadSentenceBooks());
  }, []);

  const refresh = () => {
    setWordBooks(loadWordBooks());
    setSentenceBooks(loadSentenceBooks());
  };

  /* ---- 词书 ---- */
  const handleAddWordBook = () => {
    const lines = wbPairs.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) { alert('请输入内容'); return; }

    const entries: WordEntry[] = lines.map(line => {
      const [english, ...rest] = line.split(/[=:：]/);
      return {
        id: uid(),
        english: english?.trim() || '',
        chinese: rest.join(':').trim() || '',
      };
    }).filter(e => e.english && e.chinese);

    const book: WordBook = {
      id: uid(),
      title: wbTitle.trim() || `词书 ${wordBooks.length + 1}`,
      entries,
      createdAt: Date.now(),
    };
    addWordBook(book);
    setWbTitle('');
    setWbPairs('');
    refresh();
  };

  /* ---- 句书 ---- */
  const handleAddSentenceBook = () => {
    const lines = sbPairs.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) { alert('请输入内容'); return; }

    const entries: SentenceEntry[] = lines.map(line => {
      const [english, ...rest] = line.split(/[=:：]/);
      return {
        id: uid(),
        english: english?.trim() || '',
        chinese: rest.join(':').trim() || '',
      };
    }).filter(e => e.english && e.chinese);

    const book: SentenceBook = {
      id: uid(),
      title: sbTitle.trim() || `句书 ${sentenceBooks.length + 1}`,
      entries,
      createdAt: Date.now(),
    };
    addSentenceBook(book);
    setSbTitle('');
    setSbPairs('');
    refresh();
  };

  /* ---- 导入 ---- */
  const handleImportWordBook = (data: unknown) => {
    const d = data as Partial<WordBook>;
    if (!d.entries || !Array.isArray(d.entries)) { alert('无效的词书数据'); return; }
    const book: WordBook = {
      id: d.id || uid(),
      title: d.title || '导入的词书',
      entries: d.entries,
      createdAt: d.createdAt || Date.now(),
    };
    addWordBook(book);
    refresh();
  };

  const handleImportSentenceBook = (data: unknown) => {
    const d = data as Partial<SentenceBook>;
    if (!d.entries || !Array.isArray(d.entries)) { alert('无效的句书数据'); return; }
    const book: SentenceBook = {
      id: d.id || uid(),
      title: d.title || '导入的句书',
      entries: d.entries,
      createdAt: d.createdAt || Date.now(),
    };
    addSentenceBook(book);
    refresh();
  };

  /* ---- 开始记忆 ---- */
  const handleStartMemory = () => setMemoryView(true);

  if (memoryView) {
    return <EnglishMemoryView onBack={() => setMemoryView(false)} />;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📝 英语记忆</h2>

      {/* 新建词书 */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>📗 新建词书</h3>
        <input
          style={styles.input}
          placeholder="词书名称（可选）"
          value={wbTitle}
          onChange={e => setWbTitle(e.target.value)}
        />
        <textarea
          style={styles.textarea}
          placeholder={"每行一条，格式：英文=中文\n例如：\nabandon=放弃\nability=能力"}
          rows={6}
          value={wbPairs}
          onChange={e => setWbPairs(e.target.value)}
        />
        <div style={styles.row}>
          <button style={styles.primaryBtn} onClick={handleAddWordBook}>📥 创建词书</button>
          <SingleImportBtn label="词书 (JSON)" onData={handleImportWordBook} />
        </div>
      </div>

      {/* 词书列表 */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>📚 我的词书</h3>
        {wordBooks.length === 0 && <p style={styles.empty}>还没有词书。</p>}
        {wordBooks.map(b => (
          <div key={b.id} style={styles.entry}>
            <div style={styles.entryInfo}>
              <span style={styles.entryTitle}>{b.title}</span>
              <span style={styles.entryMeta}>{b.entries.length} 词</span>
            </div>
            <div style={styles.entryActions}>
              <SingleExportBtn label={b.title} data={b} filename={`${b.title}.json`} />
              <button style={styles.deleteBtn} onClick={() => { deleteWordBook(b.id); refresh(); }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* 新建句书 */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>📘 新建句书</h3>
        <input
          style={styles.input}
          placeholder="句书名称（可选）"
          value={sbTitle}
          onChange={e => setSbTitle(e.target.value)}
        />
        <textarea
          style={styles.textarea}
          placeholder={"每行一条，格式：英文句子=中文翻译\n例如：\nHow are you?=你好吗？\nI love you.=我爱你。"}
          rows={6}
          value={sbPairs}
          onChange={e => setSbPairs(e.target.value)}
        />
        <div style={styles.row}>
          <button style={styles.primaryBtn} onClick={handleAddSentenceBook}>📥 创建句书</button>
          <SingleImportBtn label="句书 (JSON)" onData={handleImportSentenceBook} />
        </div>
      </div>

      {/* 句书列表 */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>📚 我的句书</h3>
        {sentenceBooks.length === 0 && <p style={styles.empty}>还没有句书。</p>}
        {sentenceBooks.map(b => (
          <div key={b.id} style={styles.entry}>
            <div style={styles.entryInfo}>
              <span style={styles.entryTitle}>{b.title}</span>
              <span style={styles.entryMeta}>{b.entries.length} 句</span>
            </div>
            <div style={styles.entryActions}>
              <SingleExportBtn label={b.title} data={b} filename={`${b.title}.json`} />
              <button style={styles.deleteBtn} onClick={() => { deleteSentenceBook(b.id); refresh(); }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* 开始记忆按钮 */}
      {(wordBooks.length > 0 || sentenceBooks.length > 0) && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button style={styles.memoryBtn} onClick={handleStartMemory}>
            🧠 开始英语记忆
          </button>
        </div>
      )}
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
    fontSize: 14,
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.6,
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
  entry: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f1f5f9',
    gap: 8,
  },
  entryInfo: { display: 'flex', flexDirection: 'column', gap: 2 },
  entryTitle: { fontWeight: 600, color: '#1e293b' },
  entryMeta: { fontSize: 13, color: '#94a3b8' },
  entryActions: { display: 'flex', gap: 8, alignItems: 'center' },
  deleteBtn: {
    padding: '4px 10px',
    fontSize: 14,
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  memoryBtn: {
    padding: '14px 40px',
    fontSize: 18,
    backgroundColor: '#059669',
    color: '#ffffff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
  },
};
