import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLayoutSettings } from '../common/LayoutContext';
import { SIDEBAR_COLLAPSED } from '../common/Sidebar';

interface Props {
  onBack: () => void;
  initialEntries?: { id: string; english: string; chinese: string }[];
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

type FlashPhase = 'showing' | 'wrong-reveal' | 'completed';

/* ==================== 工具 ==================== */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/* ==================== 组件 ==================== */

export const EnglishMemoryView: React.FC<Props> = ({ onBack, initialEntries }) => {
  const { sidebarPosition } = useLayoutSettings();

  // ----- Timer -----
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ----- 记忆状态 -----
  const [phase, setPhase] = useState<'flashcard' | 'result'>('flashcard');

  const [flashPhase, setFlashPhase] = useState<FlashPhase>('showing');
  const [currentEntry, setCurrentEntry] = useState<FlashcardEntry | null>(null);
  const [input, setInput] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0, wrong: 0 });

  const queueRef = useRef<FlashcardEntry[]>([]);
  const retestRef = useRef<RetestItem[]>([]);
  const answeredCountRef = useRef(0);
  const allEntriesRef = useRef<FlashcardEntry[]>([]);
  const wrongEntriesRef = useRef<FlashcardEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [resultStats, setResultStats] = useState<{
    total: number;
    firstPassCorrect: number;
    afterRetestCorrect: number;
  }>({ total: 0, firstPassCorrect: 0, afterRetestCorrect: 0 });

  const isRetestRef = useRef(false);

  const focusInput = () => {
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  /** Timer management */
  useEffect(() => {
    if (phase === 'flashcard') {
      timerRef.current = setInterval(() => { setElapsed(e => e + 1); }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  /** 取下一个词 */
  const nextWord = useCallback(() => {
    answeredCountRef.current += 1;

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

    if (queueRef.current.length > 0) {
      const entry = queueRef.current.shift()!;
      isRetestRef.current = false;
      setCurrentEntry(entry);
      setFlashPhase('showing');
      setInput('');
      focusInput();
      return;
    }

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

    setFlashPhase('completed');
    setCurrentEntry(null);
    setPhase('result');
  }, []);

  /** 提交答案 */
  const handleSubmit = useCallback(() => {
    if (!currentEntry) return;
    const trimmed = input.trim();

    if (flashPhase === 'wrong-reveal') {
      if (trimmed.toLowerCase() === currentEntry.english.trim().toLowerCase()) {
        const retestAfter = answeredCountRef.current + 3 + Math.floor(Math.random() * 3);
        retestRef.current.push({ entry: currentEntry, dueAfter: retestAfter });
        setFlashPhase('showing');
        nextWord();
      } else {
        setProgress(p => ({ ...p, wrong: p.wrong + 1 }));
        wrongEntriesRef.current.push(currentEntry);
      }
      return;
    }

    if (trimmed.toLowerCase() === currentEntry.english.trim().toLowerCase()) {
      setProgress(p => ({ ...p, done: p.done + 1 }));
      nextWord();
    } else {
      setProgress(p => ({ ...p, wrong: p.wrong + 1 }));
      wrongEntriesRef.current.push(currentEntry);
      setFlashPhase('wrong-reveal');
      setInput('');
      focusInput();
    }
  }, [currentEntry, input, flashPhase, nextWord]);

  /** 开始记忆 */
  const startMemory = (preSelected: { id: string; english: string; chinese: string }[]) => {
    if (!preSelected || preSelected.length === 0) { alert('请至少选择要记忆的内容'); return; }

    const shuffled = shuffle(preSelected);
    queueRef.current = [...shuffled];
    retestRef.current = [];
    answeredCountRef.current = 0;
    allEntriesRef.current = shuffled;
    wrongEntriesRef.current = [];
    isRetestRef.current = false;

    setElapsed(0);
    setProgress({ done: 0, total: shuffled.length, wrong: 0 });
    setResultStats({ total: shuffled.length, firstPassCorrect: 0, afterRetestCorrect: 0 });

    const first = queueRef.current.shift()!;
    setCurrentEntry(first);
    setFlashPhase('showing');
    setInput('');
    setPhase('flashcard');

    focusInput();
  };

  useEffect(() => { focusInput(); }, [currentEntry]);

  // Auto-start memory when initial entries are provided
  useEffect(() => {
    if (initialEntries && initialEntries.length > 0) {
      startMemory(initialEntries);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  /* ==================== 渲染：闪卡记忆 ==================== */
  if (phase === 'flashcard') {
    const isWrongPhase = flashPhase === 'wrong-reveal';
    const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
    const isLeft = sidebarPosition === 'left';
    const sidebarW = SIDEBAR_COLLAPSED;

    return (
      <div style={{
        ...styles.flashcardPage,
        left: isLeft ? sidebarW : 0,
        right: isLeft ? 0 : sidebarW,
      }}>
        <div style={styles.topBar}>
          <button style={styles.miniBackBtn} onClick={onBack}>← 返回</button>
          <div style={styles.progressWrap}>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${pct}%` }} />
            </div>
            <span style={styles.progressText}>
              {progress.done}/{progress.total} · 错误 {progress.wrong} · 用时 {formatTime(elapsed)}
            </span>
          </div>
        </div>

        <div style={styles.cardArea}>
          <div style={styles.flashcard}>
            {flashPhase === 'completed' ? (
              <div style={styles.completedMsg}>
                <span style={{ fontSize: 48 }}>🎉</span>
                <h2>全部完成！</h2>
                <button style={styles.resultBtn} onClick={() => setPhase('result')}>查看结果</button>
              </div>
            ) : currentEntry && (
              <>
                <div style={styles.tag}>{isRetestRef.current ? '🔁 复习' : '📝 新词'}</div>
                <div style={styles.chineseDisplay}>{currentEntry.chinese}</div>
                {isWrongPhase && (
                  <div style={styles.revealBox}>
                    <span style={styles.revealLabel}>正确答案：</span>
                    <span style={styles.revealAnswer}>{currentEntry.english}</span>
                    <p style={styles.revealHint}>请在上方输入框重新输入正确答案</p>
                  </div>
                )}
                <input
                  ref={inputRef}
                  style={{ ...styles.flashcardInput, ...(isWrongPhase ? styles.flashcardInputWrong : {}) }}
                  placeholder={isWrongPhase ? '重新输入正确答案…' : '输入对应的英文…'}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <button style={styles.submitFlashBtn} onClick={handleSubmit} disabled={!input.trim()}>
                  {isWrongPhase ? '✏️ 确认输入' : '📤 提交'}
                </button>
                {!isWrongPhase && <p style={styles.enterHint}>按 Enter 快速提交</p>}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ==================== 渲染：结果 ==================== */
  if (phase === 'result') {
    const isLeft = sidebarPosition === 'left';
    const sidebarW = SIDEBAR_COLLAPSED;
    return (
      <div style={{
        ...styles.flashcardPage,
        left: isLeft ? sidebarW : 0,
        right: isLeft ? 0 : sidebarW,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={styles.resultCard}>
          <div style={styles.resultIcon}>🎉</div>
          <h2 style={styles.resultTitle}>记忆完成！</h2>

          <div style={styles.resultStats}>
            <div style={styles.statRow}><span>总题数</span><strong>{progress.total}</strong></div>
            <div style={styles.statRow}><span>用时</span><strong style={{ color: 'var(--text-primary)' }}>{formatTime(elapsed)}</strong></div>
            <div style={styles.statRow}><span>曾答错</span><strong style={{ color: 'var(--text-red)' }}>{progress.wrong}</strong></div>
          </div>

          {progress.wrong > 0 && (
            <details style={styles.wrongDetails}>
              <summary style={styles.wrongSummary}>查看曾答错的词（{progress.wrong} 次错误）</summary>
              <div style={styles.wrongList}>
                {(() => {
                  const countMap = new Map<string, { entry: FlashcardEntry; count: number }>();
                  for (const e of wrongEntriesRef.current) {
                    const key = e.id;
                    countMap.has(key) ? countMap.get(key)!.count++ : countMap.set(key, { entry: e, count: 1 });
                  }
                  return Array.from(countMap.values()).map(({ entry, count }) => (
                    <div key={entry.id} style={styles.wrongItem}>
                      <span style={{ fontWeight: 600 }}>{entry.english}</span>
                      <span style={{ color: 'var(--text-description)' }}> — {entry.chinese}</span>
                      {count > 1 && <span style={{ color: 'var(--text-red)', marginLeft: 8, fontSize: 13 }}>（错误 {count} 次）</span>}
                    </div>
                  ));
                })()}
              </div>
            </details>
          )}

          <button style={styles.backToSelectBtn} onClick={onBack}>🔙 返回主菜单</button>
        </div>
      </div>
    );
  }

  return null;
};

/* ==================== 样式 ==================== */

const styles: Record<string, React.CSSProperties> = {
  flashcardPage: {
    display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)',
    backgroundColor: 'var(--bg-flashcard-page)', overflow: 'hidden',
  },
  topBar: {
    display: 'flex', alignItems: 'center', gap: 16, padding: '12px 24px',
    backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-default)',
  },
  miniBackBtn: {
    padding: '6px 14px', fontSize: 14, backgroundColor: 'var(--bg-hover)',
    border: '1px solid var(--border-default)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
  },
  progressWrap: { flex: 1, display: 'flex', alignItems: 'center', gap: 12 },
  progressTrack: { flex: 1, height: 8, backgroundColor: 'var(--border-default)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: 'var(--bg-primary)', borderRadius: 4, transition: 'width 0.3s' },
  progressText: { fontSize: 14, color: 'var(--text-description)', whiteSpace: 'nowrap' },
  cardArea: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24 },
  flashcard: {
    width: '100%', maxWidth: 560, backgroundColor: 'var(--bg-card)', borderRadius: 20,
    padding: '40px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
  },
  tag: { fontSize: 13, color: 'var(--text-description)', backgroundColor: 'var(--bg-hover)', padding: '4px 12px', borderRadius: 12 },
  chineseDisplay: { fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.4, minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', wordBreak: 'break-word', maxWidth: '100%' },
  revealBox: { backgroundColor: 'var(--bg-warning)', border: '1px solid var(--border-red)', borderRadius: 10, padding: '14px 20px', textAlign: 'center', width: '100%' },
  revealLabel: { fontSize: 14, color: 'var(--text-red)', fontWeight: 600 },
  revealAnswer: { fontSize: 22, fontWeight: 700, color: 'var(--text-red)', marginLeft: 8 },
  revealHint: { fontSize: 13, color: 'var(--text-muted)', marginTop: 8 },
  flashcardInput: { width: '100%', padding: '14px 16px', fontSize: 18, textAlign: 'center', border: 'none', borderBottom: '2px solid var(--border-strong)', borderRadius: 0, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s', backgroundColor: 'transparent' },
  flashcardInputWrong: { borderBottomColor: 'var(--text-red) !important' },
  submitFlashBtn: { width: '100%', padding: '14px', fontSize: 18, fontWeight: 600, backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: 10, cursor: 'pointer' },
  enterHint: { fontSize: 13, color: 'var(--text-muted)', marginTop: -8 },
  completedMsg: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' },
  resultBtn: { padding: '12px 32px', fontSize: 16, backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: 8, cursor: 'pointer', marginTop: 8 },
  resultCard: { maxWidth: 600, minWidth: 420, width: '100%', margin: '0 auto', backgroundColor: 'var(--bg-card)', borderRadius: 20, padding: '40px 40px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' },
  resultIcon: { fontSize: 64, marginBottom: 8 },
  resultTitle: { fontSize: 28, color: 'var(--text-primary)', marginBottom: 24 },
  resultStats: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, textAlign: 'left' },
  statRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: 'var(--bg-page)', borderRadius: 8, fontSize: 16, color: 'var(--text-secondary)' },
  wrongDetails: { marginBottom: 24, textAlign: 'left' },
  wrongSummary: { cursor: 'pointer', color: 'var(--text-red)', fontSize: 15, padding: 8, fontWeight: 600 },
  wrongList: { marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' },
  wrongItem: { padding: '6px 12px', fontSize: 14, color: 'var(--text-primary)' },
  backToSelectBtn: { display: 'block', width: '100%', padding: '12px', fontSize: 16, backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', border: 'none', borderRadius: 8, cursor: 'pointer', marginBottom: 8 },
};
