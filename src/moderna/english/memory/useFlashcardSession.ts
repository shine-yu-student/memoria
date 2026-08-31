import { useCallback, useEffect, useRef, useState } from 'react';

export interface FlashcardEntry {
  id: string;
  english: string;
  chinese: string;
}

export type FlashPhase = 'showing' | 'wrong-reveal' | 'completed';

interface RetestItem {
  entry: FlashcardEntry;
  dueAfter: number;
}

/** Fisher-Yates。与经典界面 EnglishMemoryView.tsx:25-32 一致。 */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * 闪卡会话状态。
 *
 * 【重要】队列与计数器全部用 ref 而非 state：handleSubmit 需要在事件处理器内
 * 同步读取并修改 answeredCount，改成 state 会引入闭包过期的 bug。
 *
 * 必须保留的可观察行为（与经典界面一致）：
 * - 答错的词在 3–5 张后复现（dueAfter = answeredCount + 3 + floor(random*3)）
 * - progress.done 只计首次答对；重测答对不加 done，故进度条可能停在 100% 以下
 * - wrongEntries 可含重复条目，结果页按 id 分组显示错误次数
 * - 计时在 completed 冻结并带入结果页
 * - 聚焦用 50ms 延时，避免与入场卡片竞争
 */
export function useFlashcardSession() {
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<'flashcard' | 'result'>('flashcard');
  const [flashPhase, setFlashPhase] = useState<FlashPhase>('showing');
  const [currentEntry, setCurrentEntry] = useState<FlashcardEntry | null>(null);
  const [input, setInput] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0, wrong: 0 });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueRef = useRef<FlashcardEntry[]>([]);
  const retestRef = useRef<RetestItem[]>([]);
  const answeredCountRef = useRef(0);
  const allEntriesRef = useRef<FlashcardEntry[]>([]);
  const wrongEntriesRef = useRef<FlashcardEntry[]>([]);
  const isRetestRef = useRef(false);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = useCallback(() => {
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(
    () => () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    },
    []
  );

  /** 计时：completed 阶段停止 */
  useEffect(() => {
    if (phase === 'flashcard' && flashPhase !== 'completed') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, flashPhase]);

  const nextWord = useCallback(() => {
    answeredCountRef.current += 1;

    // 1) 已到期的重测项（按数组插入序取第一条）
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

    // 2) 主队列
    if (queueRef.current.length > 0) {
      const entry = queueRef.current.shift()!;
      isRetestRef.current = false;
      setCurrentEntry(entry);
      setFlashPhase('showing');
      setInput('');
      focusInput();
      return;
    }

    // 3) 主队列已空但仍有重测项：取 dueAfter 最小的
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

    // 4) 全部完成：停在"全部完成"页，由用户点"查看结果"进入结果页
    setFlashPhase('completed');
    setCurrentEntry(null);
  }, [focusInput]);

  const handleSubmit = useCallback(() => {
    if (!currentEntry) return;
    const trimmed = input.trim();
    // 英语闪卡：不区分大小写（语文记忆则是区分大小写的全等比较，两者刻意不同）
    const correct = trimmed.toLowerCase() === currentEntry.english.trim().toLowerCase();

    if (flashPhase === 'wrong-reveal') {
      if (correct) {
        const retestAfter = answeredCountRef.current + 3 + Math.floor(Math.random() * 3);
        retestRef.current.push({ entry: currentEntry, dueAfter: retestAfter });
        setFlashPhase('showing');
        nextWord();
      } else {
        setProgress(p => ({ ...p, wrong: p.wrong + 1 }));
        wrongEntriesRef.current.push(currentEntry);
        setInput('');
        focusInput();
      }
      return;
    }

    if (correct) {
      setProgress(p => ({ ...p, done: p.done + 1 }));
      nextWord();
    } else {
      setProgress(p => ({ ...p, wrong: p.wrong + 1 }));
      wrongEntriesRef.current.push(currentEntry);
      setFlashPhase('wrong-reveal');
      setInput('');
      focusInput();
    }
  }, [currentEntry, input, flashPhase, nextWord, focusInput]);

  const startMemory = useCallback(
    (preSelected: FlashcardEntry[]) => {
      if (!preSelected || preSelected.length === 0) return false;

      const shuffled = shuffle(preSelected);
      queueRef.current = [...shuffled];
      retestRef.current = [];
      answeredCountRef.current = 0;
      allEntriesRef.current = shuffled;
      wrongEntriesRef.current = [];
      isRetestRef.current = false;

      setElapsed(0);
      setProgress({ done: 0, total: shuffled.length, wrong: 0 });

      const first = queueRef.current.shift()!;
      setCurrentEntry(first);
      setFlashPhase('showing');
      setInput('');
      setPhase('flashcard');

      focusInput();
      return true;
    },
    [focusInput]
  );

  useEffect(() => {
    focusInput();
  }, [currentEntry, focusInput]);

  /** 结果页的错误统计：同一条目可能出现多次 */
  const wrongSummary = () => {
    const map = new Map<string, { entry: FlashcardEntry; count: number }>();
    for (const e of wrongEntriesRef.current) {
      const cur = map.get(e.id);
      if (cur) cur.count += 1;
      else map.set(e.id, { entry: e, count: 1 });
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  };

  return {
    elapsed,
    phase,
    setPhase,
    flashPhase,
    currentEntry,
    input,
    setInput,
    progress,
    inputRef,
    isRetest: isRetestRef,
    startMemory,
    handleSubmit,
    wrongSummary,
    allEntries: allEntriesRef,
  };
}
