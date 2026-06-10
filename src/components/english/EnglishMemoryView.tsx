import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { WordBook, SentenceBook } from '../../types';
import { loadWordBooks, loadSentenceBooks } from '../../utils/storage';

interface Props {
  onBack: () => void;
}

/* ==================== 辅助类型 ==================== */

interface FlashcardEntry {
  id: string;
  english: string;
  chinese: string;
}

interface RetestItem {
  entry: FlashcardEntry;
  dueAfter: number;
}

type FlashPhase =
  | 'showing'        // 展示中文，等待输入
  | 'wrong-reveal'   // 答错，展示正确答案，要求重新输入
  | 'completed';     // 全部完成

/* ==================== 工具 ==================== */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ==================== 组件 ==================== */

export const EnglishMemoryView: React.FC<Props> = ({ onBack }) => {
  const [wordBooks] = useState<WordBook[]>(loadWordBooks);
  const [sentenceBooks] = useState<SentenceBook[]>(loadSentenceBooks);

  // ----- 选择状态 -----
  const [selectedWordBookIds, setSelectedWordBookIds] = useState<Set<string>>(new Set());
  const [selectedSentenceBookIds, setSelectedSentenceBookIds] = useState<Set<string>>(new Set());
  const [selectedWordEntryIds, setSelectedWordEntryIds] = useState<Set<string>>(new Set());
  const [selectedSentenceEntryIds, setSelectedSentenceEntryIds] = useState<Set<string>>(new Set());
  const [expandedWordBookId, setExpandedWordBookId] = useState<string | null>(null);
  const [expandedSentenceBookId, setExpandedSentenceBookId] = useState<string | null>(null);

  // ----- 记忆状态 -----
  const [phase, setPhase] = useState<'select' | 'flashcard' | 'result'>('select');

  // 闪卡核心状态
  const [flashPhase, setFlashPhase] = useState<FlashPhase>('showing');
  const [currentEntry, setCurrentEntry] = useState<FlashcardEntry | null>(null);
  const [input, setInput] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0, wrong: 0 });

  // 用 ref 跟踪队列，避免 re-render 导致丢失
  const queueRef = useRef<FlashcardEntry[]>([]);
  const retestRef = useRef<RetestItem[]>([]);
  const answeredCountRef = useRef(0);
  const allEntriesRef = useRef<FlashcardEntry[]>([]);
  const wrongEntriesRef = useRef<FlashcardEntry[]>([]); // 记录每次错误
  const inputRef = useRef<HTMLInputElement>(null);

  // 完成后的统计数据
  const [resultStats, setResultStats] = useState<{
    total: number;
    firstPassCorrect: number;
    afterRetestCorrect: number;
  }>({ total: 0, firstPassCorrect: 0, afterRetestCorrect: 0 });

  // 本条目是否来自 retest
  const isRetestRef = useRef(false);

  const focusInput = () => {
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  /** 取下一个词 */
  const nextWord = useCallback(() => {
    answeredCountRef.current += 1;

    // 1. 检查 retest 队列是否有到期的
    const due = retestRef.current.filter(r => r.dueAfter <= answeredCountRef.current);
    if (due.length > 0) {
      const item = due[0];
      retestRef.current = retestRef.current.filter(r => r.entry.id !== item.entry.id);
      isRetestRef.current = true;
      setCurrentEntry(item.entry);
      setFlashPhase('showing');
      setInput('');
      focusInput();
      return;
    }

    // 2. 从主队列取
    if (queueRef.current.length > 0) {
      const entry = queueRef.current.shift()!;
      isRetestRef.current = false;
      setCurrentEntry(entry);
      setFlashPhase('showing');
      setInput('');
      focusInput();
      return;
    }

    // 3. 主队列空了，但 retest 还有未到期的 —— 强制清掉
    if (retestRef.current.length > 0) {
      const sorted = [...retestRef.current].sort((a, b) => a.dueAfter - b.dueAfter);
      const next = sorted[0];
      retestRef.current = retestRef.current.filter(r => r.entry.id !== next.entry.id);
      isRetestRef.current = true;
      setCurrentEntry(next.entry);
      setFlashPhase('showing');
      setInput('');
      focusInput();
      return;
    }

    // 4. 全部完成
    setFlashPhase('completed');
    setCurrentEntry(null);
    setPhase('result');
  }, []);

  /** 提交答案 */
  const handleSubmit = useCallback(() => {
    if (!currentEntry) return;
    const trimmed = input.trim();

    if (flashPhase === 'wrong-reveal') {
      // 答错后的重新输入阶段
      if (trimmed.toLowerCase() === currentEntry.english.trim().toLowerCase()) {
        // 终于输对了 → 送入 retest 队列，3-5 个词后重测
        const retestAfter = answeredCountRef.current + 3 + Math.floor(Math.random() * 3);
        retestRef.current.push({ entry: currentEntry, dueAfter: retestAfter });
        setFlashPhase('showing');
        // 短暂显示提示后进入下一词
        nextWord();
      } else {
        // 仍然答错 → 记为一次新的错误
        setProgress(p => ({ ...p, wrong: p.wrong + 1 }));
        wrongEntriesRef.current.push(currentEntry);
      }
      return;
    }

    // 正常答题阶段
    if (trimmed.toLowerCase() === currentEntry.english.trim().toLowerCase()) {
      // 答对了
      setProgress(p => ({ ...p, done: p.done + 1 }));
      nextWord();
    } else {
      // 答错了 → 记为错误并展示正确答案
      setProgress(p => ({ ...p, wrong: p.wrong + 1 }));
      wrongEntriesRef.current.push(currentEntry);
      setFlashPhase('wrong-reveal');
      setInput(''); // 清空输入框，让用户重新输入
      focusInput();
    }
  }, [currentEntry, input, flashPhase, nextWord]);

  /** 开始记忆 */
  const startMemory = () => {
    const entries: FlashcardEntry[] = [];

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

    if (entries.length === 0) { alert('请至少选择要记忆的内容'); return; }

    const shuffled = shuffle(entries);
    queueRef.current = [...shuffled];
    retestRef.current = [];
    answeredCountRef.current = 0;
    allEntriesRef.current = shuffled;
    wrongEntriesRef.current = [];
    isRetestRef.current = false;

    setProgress({ done: 0, total: shuffled.length, wrong: 0 });
    setResultStats({ total: shuffled.length, firstPassCorrect: 0, afterRetestCorrect: 0 });

    // 取第一个词
    const first = queueRef.current.shift()!;
    setCurrentEntry(first);
    setFlashPhase('showing');
    setInput('');
    setPhase('flashcard');

    focusInput();
  };

  // 自动聚焦
  useEffect(() => { focusInput(); }, [currentEntry]);

  /** 键盘 Enter 提交 */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  /* ==================== 渲染：选择界面 ==================== */
  if (phase === 'select') {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>🧠 英语记忆 - 选择内容</h2>
        <p style={styles.meta}>选择要记忆的词书/句书（可混合选择，也可只选部分条目）。</p>

        {wordBooks.map(book => (
          <div key={book.id} style={styles.bookCard}>
            <div style={styles.bookHeader}>
              <label style={styles.bookCheckbox}>
                <input type="checkbox" checked={selectedWordBookIds.has(book.id)}
                  onChange={() => {
                    const next = new Set(selectedWordBookIds);
                    const eIds = new Set(selectedWordEntryIds);
                    next.has(book.id) ? (next.delete(book.id), book.entries.forEach(e => eIds.delete(e.id)))
                      : (next.add(book.id), book.entries.forEach(e => eIds.add(e.id)));
                    setSelectedWordBookIds(next);
                    setSelectedWordEntryIds(eIds);
                  }} />
                <strong style={styles.bookTitle}>📗 {book.title}</strong>
                <span style={styles.bookMeta}>（{book.entries.length} 词）</span>
              </label>
              <button style={styles.expandBtn}
                onClick={() => setExpandedWordBookId(expandedWordBookId === book.id ? null : book.id)}>
                {expandedWordBookId === book.id ? '🔼 收起' : '🔽 展开'}
              </button>
            </div>
            {expandedWordBookId === book.id && (
              <div style={styles.entryList}>
                {book.entries.map(e => (
                  <label key={e.id} style={styles.entryCheckbox}>
                    <input type="checkbox" checked={selectedWordEntryIds.has(e.id)}
                      onChange={() => {
                        const next = new Set(selectedWordEntryIds);
                        next.has(e.id) ? next.delete(e.id) : next.add(e.id);
                        setSelectedWordEntryIds(next);
                        if (!next.has(e.id)) {
                          const bn = new Set(selectedWordBookIds);
                          bn.delete(book.id);
                          setSelectedWordBookIds(bn);
                        }
                      }} />
                    <span style={{ color: '#1e293b' }}>{e.english}</span>
                    <span style={{ color: '#94a3b8', marginLeft: 8 }}>{e.chinese}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        {sentenceBooks.map(book => (
          <div key={book.id} style={styles.bookCard}>
            <div style={styles.bookHeader}>
              <label style={styles.bookCheckbox}>
                <input type="checkbox" checked={selectedSentenceBookIds.has(book.id)}
                  onChange={() => {
                    const next = new Set(selectedSentenceBookIds);
                    const eIds = new Set(selectedSentenceEntryIds);
                    next.has(book.id) ? (next.delete(book.id), book.entries.forEach(e => eIds.delete(e.id)))
                      : (next.add(book.id), book.entries.forEach(e => eIds.add(e.id)));
                    setSelectedSentenceBookIds(next);
                    setSelectedSentenceEntryIds(eIds);
                  }} />
                <strong style={styles.bookTitle}>📘 {book.title}</strong>
                <span style={styles.bookMeta}>（{book.entries.length} 句）</span>
              </label>
              <button style={styles.expandBtn}
                onClick={() => setExpandedSentenceBookId(expandedSentenceBookId === book.id ? null : book.id)}>
                {expandedSentenceBookId === book.id ? '🔼 收起' : '🔽 展开'}
              </button>
            </div>
            {expandedSentenceBookId === book.id && (
              <div style={styles.entryList}>
                {book.entries.map(e => (
                  <label key={e.id} style={styles.entryCheckbox}>
                    <input type="checkbox" checked={selectedSentenceEntryIds.has(e.id)}
                      onChange={() => {
                        const next = new Set(selectedSentenceEntryIds);
                        next.has(e.id) ? next.delete(e.id) : next.add(e.id);
                        setSelectedSentenceEntryIds(next);
                        if (!next.has(e.id)) {
                          const bn = new Set(selectedSentenceBookIds);
                          bn.delete(book.id);
                          setSelectedSentenceBookIds(bn);
                        }
                      }} />
                    <span style={{ color: '#1e293b' }}>{e.english}</span>
                    <span style={{ color: '#94a3b8', marginLeft: 8 }}>{e.chinese}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        {wordBooks.length === 0 && sentenceBooks.length === 0 && (
          <p style={styles.empty}>暂无词书或句书，请先创建。</p>
        )}

        <div style={styles.actions}>
          <button style={styles.backBtn} onClick={onBack}>🔙 返回</button>
          <button style={styles.startBtn} onClick={startMemory}
            disabled={selectedWordEntryIds.size + selectedSentenceEntryIds.size === 0}>
            🧠 开始记忆（已选 {selectedWordEntryIds.size + selectedSentenceEntryIds.size} 项）
          </button>
        </div>
      </div>
    );
  }

  /* ==================== 渲染：闪卡记忆 ==================== */
  if (phase === 'flashcard') {
    const isWrongPhase = flashPhase === 'wrong-reveal';
    const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

    return (
      <div style={styles.flashcardPage}>
        {/* 顶部进度条 */}
        <div style={styles.topBar}>
          <button style={styles.miniBackBtn} onClick={() => setPhase('select')}>← 返回</button>
          <div style={styles.progressWrap}>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${pct}%` }} />
            </div>
            <span style={styles.progressText}>
              {progress.done}/{progress.total} · 错误 {progress.wrong}
            </span>
          </div>
        </div>

        {/* 中央卡片 */}
        <div style={styles.cardArea}>
          <div style={styles.flashcard}>
            {/* 已完成状态遮罩 */}
            {flashPhase === 'completed' ? (
              <div style={styles.completedMsg}>
                <span style={{ fontSize: 48 }}>🎉</span>
                <h2>全部完成！</h2>
                <button style={styles.resultBtn} onClick={() => setPhase('result')}>
                  查看结果
                </button>
              </div>
            ) : currentEntry && (
              <>
                {/* 提示标签 */}
                <div style={styles.tag}>
                  {isRetestRef.current ? '🔁 复习' : '📝 新词'}
                </div>

                {/* 中文提示 */}
                <div style={styles.chineseDisplay}>
                  {currentEntry.chinese}
                </div>

                {/* 答错时的正确答案提示 */}
                {isWrongPhase && (
                  <div style={styles.revealBox}>
                    <span style={styles.revealLabel}>正确答案：</span>
                    <span style={styles.revealAnswer}>{currentEntry.english}</span>
                    <p style={styles.revealHint}>请在上方输入框重新输入正确答案</p>
                  </div>
                )}

                {/* 输入框 */}
                <input
                  ref={inputRef}
                  style={{
                    ...styles.flashcardInput,
                    ...(isWrongPhase ? styles.flashcardInputWrong : {}),
                  }}
                  placeholder={isWrongPhase ? '重新输入正确答案…' : '输入对应的英文…'}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />

                {/* 提交按钮 */}
                <button
                  style={styles.submitFlashBtn}
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                >
                  {isWrongPhase ? '✏️ 确认输入' : '📤 提交'}
                </button>

                {/* 快捷提示 */}
                {!isWrongPhase && (
                  <p style={styles.enterHint}>按 Enter 快速提交</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ==================== 渲染：结果 ==================== */
  if (phase === 'result') {
    return (
      <div style={styles.container}>
        <div style={styles.resultCard}>
          <div style={styles.resultIcon}>🎉</div>
          <h2 style={styles.resultTitle}>记忆完成！</h2>

          <div style={styles.resultStats}>
            <div style={styles.statRow}>
              <span>总题数</span>
              <strong>{progress.total}</strong>
            </div>
            <div style={styles.statRow}>
              <span>答对次数</span>
              <strong style={{ color: '#16a34a' }}>{progress.done}</strong>
            </div>
            <div style={styles.statRow}>
              <span>曾答错</span>
              <strong style={{ color: '#dc2626' }}>{progress.wrong}</strong>
            </div>
          </div>

          {/* 错词列表 */}
          {progress.wrong > 0 && (
            <details style={styles.wrongDetails}>
              <summary style={styles.wrongSummary}>
                查看曾答错的词（{progress.wrong} 次错误）
              </summary>
              <div style={styles.wrongList}>
                {(() => {
                  // 按单词去重并统计错误次数
                  const countMap = new Map<string, { entry: FlashcardEntry; count: number }>();
                  for (const e of wrongEntriesRef.current) {
                    const key = e.id;
                    if (countMap.has(key)) {
                      countMap.get(key)!.count++;
                    } else {
                      countMap.set(key, { entry: e, count: 1 });
                    }
                  }
                  return Array.from(countMap.values()).map(({ entry, count }) => (
                    <div key={entry.id} style={styles.wrongItem}>
                      <span style={{ fontWeight: 600 }}>{entry.english}</span>
                      <span style={{ color: '#64748b' }}> — {entry.chinese}</span>
                      {count > 1 && (
                        <span style={{ color: '#dc2626', marginLeft: 8, fontSize: 13 }}>
                          （错误 {count} 次）
                        </span>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </details>
          )}

          <button style={styles.backToSelectBtn} onClick={() => setPhase('select')}>
            🔙 返回选择
          </button>
          <button style={styles.backHomeBtn} onClick={onBack}>
            🏠 返回主菜单
          </button>
        </div>
      </div>
    );
  }

  return null;
};

/* ==================== 样式 ==================== */

const styles: Record<string, React.CSSProperties> = {
  /* ----- 通用 ----- */
  container: { maxWidth: 800, margin: '0 auto', padding: '24px 16px' },
  title: { textAlign: 'center', color: '#1e293b', marginBottom: 8 },
  meta: { textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 20 },
  empty: { textAlign: 'center', color: '#94a3b8', padding: 40 },

  /* ----- 选择界面 ----- */
  bookCard: {
    backgroundColor: '#ffffff', borderRadius: 10, padding: '12px 16px',
    marginBottom: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  bookHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  bookCheckbox: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 },
  bookTitle: { fontSize: 16, color: '#1e293b' },
  bookMeta: { fontSize: 13, color: '#94a3b8', marginLeft: 6 },
  expandBtn: {
    padding: '4px 12px', fontSize: 13, backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', color: '#475569',
  },
  entryList: { marginTop: 10, marginLeft: 24, display: 'flex', flexDirection: 'column', gap: 4 },
  entryCheckbox: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 14,
  },
  actions: { display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24, flexWrap: 'wrap' },
  backBtn: {
    padding: '10px 24px', fontSize: 15, backgroundColor: '#e2e8f0',
    color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer',
  },
  startBtn: {
    padding: '10px 24px', fontSize: 15, backgroundColor: '#059669',
    color: '#ffffff', border: 'none', borderRadius: 8, cursor: 'pointer',
  },

  /* ----- 闪卡界面 ----- */
  flashcardPage: {
    display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', // 减去 navbar 高度
    backgroundColor: '#f0fdf4',
  },
  topBar: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '12px 24px', backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
  },
  miniBackBtn: {
    padding: '6px 14px', fontSize: 14, backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', color: '#475569',
    whiteSpace: 'nowrap',
  },
  progressWrap: { flex: 1, display: 'flex', alignItems: 'center', gap: 12 },
  progressTrack: {
    flex: 1, height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#059669', borderRadius: 4, transition: 'width 0.3s' },
  progressText: { fontSize: 14, color: '#64748b', whiteSpace: 'nowrap' },

  cardArea: {
    flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  flashcard: {
    width: '100%', maxWidth: 560,
    backgroundColor: '#ffffff', borderRadius: 20,
    padding: '40px 32px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
  },
  tag: {
    fontSize: 13, color: '#64748b', backgroundColor: '#f1f5f9',
    padding: '4px 12px', borderRadius: 12,
  },
  chineseDisplay: {
    fontSize: 32, fontWeight: 700, color: '#1e293b',
    textAlign: 'center', lineHeight: 1.4, minHeight: 80,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    wordBreak: 'break-word', maxWidth: '100%',
  },
  revealBox: {
    backgroundColor: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 10, padding: '14px 20px', textAlign: 'center', width: '100%',
  },
  revealLabel: { fontSize: 14, color: '#dc2626', fontWeight: 600 },
  revealAnswer: { fontSize: 22, fontWeight: 700, color: '#dc2626', marginLeft: 8 },
  revealHint: { fontSize: 13, color: '#94a3b8', marginTop: 8 },
  flashcardInput: {
    width: '100%', padding: '14px 16px', fontSize: 18, textAlign: 'center',
    border: '2px solid #cbd5e1', borderRadius: 10,
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
  },
  flashcardInputWrong: {
    borderColor: '#fca5a5', backgroundColor: '#fff5f5',
  },
  submitFlashBtn: {
    width: '100%', padding: '14px', fontSize: 18, fontWeight: 600,
    backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: 10,
    cursor: 'pointer',
  },
  enterHint: { fontSize: 13, color: '#94a3b8', marginTop: -8 },

  /* ----- 完成过渡 ----- */
  completedMsg: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0',
  },
  resultBtn: {
    padding: '12px 32px', fontSize: 16, backgroundColor: '#1e293b',
    color: '#ffffff', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 8,
  },

  /* ----- 结果界面 ----- */
  resultCard: {
    maxWidth: 500, margin: '40px auto',
    backgroundColor: '#ffffff', borderRadius: 20, padding: '40px 32px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  resultIcon: { fontSize: 64, marginBottom: 8 },
  resultTitle: { fontSize: 28, color: '#1e293b', marginBottom: 24 },
  resultStats: {
    display: 'flex', flexDirection: 'column', gap: 12,
    marginBottom: 24, textAlign: 'left',
  },
  statRow: {
    display: 'flex', justifyContent: 'space-between',
    padding: '10px 16px', backgroundColor: '#f8fafc', borderRadius: 8,
    fontSize: 16, color: '#475569',
  },
  wrongDetails: { marginBottom: 24, textAlign: 'left' },
  wrongSummary: {
    cursor: 'pointer', color: '#dc2626', fontSize: 15,
    padding: 8, fontWeight: 600,
  },
  wrongList: {
    marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4,
    maxHeight: 300, overflowY: 'auto',
  },
  wrongItem: { padding: '6px 12px', fontSize: 14, color: '#1e293b' },
  backToSelectBtn: {
    display: 'block', width: '100%', padding: '12px', fontSize: 16,
    backgroundColor: '#1e293b', color: '#ffffff', border: 'none', borderRadius: 8,
    cursor: 'pointer', marginBottom: 8,
  },
  backHomeBtn: {
    display: 'block', width: '100%', padding: '12px', fontSize: 16,
    backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 8,
    cursor: 'pointer',
  },
};
