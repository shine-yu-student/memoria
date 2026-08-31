import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import type { SentenceBook, WordBook } from '../../types';
import { uid } from '../../types';
import {
  addSentenceBook,
  addWordBook,
  deleteSentenceBook,
  deleteWordBook,
  loadSentenceBooks,
  loadWordBooks,
} from '../../utils/storage';
import { PageShell } from '../shell/PageShell';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';
import { useToast } from '../ui/ToastProvider';
import { useConfirm } from '../ui/ConfirmDialog';
import { BookCard } from './BookCard';
import s from './BookList.module.css';

interface Props {
  dataVersion: number;
  onOpenBook: (id: string, type: 'word' | 'sentence') => void;
  onDataChanged: () => void;
  onStartMemory: (entries: { id: string; english: string; chinese: string }[]) => void;
}

export const BookList: React.FC<Props> = ({
  dataVersion,
  onOpenBook,
  onDataChanged,
  onStartMemory,
}) => {
  const [wordBooks, setWordBooks] = useState<WordBook[]>([]);
  const [sentenceBooks, setSentenceBooks] = useState<SentenceBook[]>([]);
  const [search, setSearch] = useState('');

  const [selectMode, setSelectMode] = useState(false);
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [selectedSentenceIds, setSelectedSentenceIds] = useState<Set<string>>(new Set());
  const lastClickedRef = useRef<string | null>(null);

  const [createOpen, setCreateOpen] = useState<null | 'word' | 'sentence'>(null);
  const [newTitle, setNewTitle] = useState('');

  const toast = useToast();
  const { confirm } = useConfirm();

  const refresh = useCallback(() => {
    setWordBooks(loadWordBooks());
    setSentenceBooks(loadSentenceBooks());
  }, []);

  useEffect(() => {
    refresh();
  }, [dataVersion, refresh]);

  /** 删除书籍后清理已失效的选择，避免残留 id 让"已选 N 项"虚高 */
  const pruneSelections = useCallback(() => {
    setSelectedWordIds(prev => {
      const valid = new Set(wordBooks.flatMap(b => b.entries.map(e => e.id)));
      return new Set([...prev].filter(id => valid.has(id)));
    });
    setSelectedSentenceIds(prev => {
      const valid = new Set(sentenceBooks.flatMap(b => b.entries.map(e => e.id)));
      return new Set([...prev].filter(id => valid.has(id)));
    });
  }, [wordBooks, sentenceBooks]);

  useEffect(() => {
    pruneSelections();
  }, [pruneSelections]);

  const q = search.trim().toLowerCase();
  const filteredWords = useMemo(
    () => (q ? wordBooks.filter(b => String(b.title ?? '').toLowerCase().includes(q)) : wordBooks),
    [wordBooks, q]
  );
  const filteredSentences = useMemo(
    () =>
      q ? sentenceBooks.filter(b => String(b.title ?? '').toLowerCase().includes(q)) : sentenceBooks,
    [sentenceBooks, q]
  );

  const totalSelected = selectedWordIds.size + selectedSentenceIds.size;

  const toggleSelectMode = () => {
    if (selectMode) {
      setSelectMode(false);
      setSelectedWordIds(new Set());
      setSelectedSentenceIds(new Set());
      lastClickedRef.current = null;
    } else {
      setSelectMode(true);
    }
  };

  const toggleBookAll = (bookId: string, isWord: boolean) => {
    const book = isWord
      ? wordBooks.find(b => b.id === bookId)
      : sentenceBooks.find(b => b.id === bookId);
    if (!book) return;
    const current = isWord ? selectedWordIds : selectedSentenceIds;
    const setter = isWord ? setSelectedWordIds : setSelectedSentenceIds;
    const allSelected = book.entries.every(e => current.has(e.id));
    const next = new Set(current);
    if (allSelected) book.entries.forEach(e => next.delete(e.id));
    else book.entries.forEach(e => next.add(e.id));
    setter(next);
  };

  const handleStartMemory = () => {
    if (totalSelected === 0) {
      toast.warning('请至少选择一项内容');
      return;
    }
    const entries: { id: string; english: string; chinese: string }[] = [];
    for (const b of wordBooks) {
      for (const e of b.entries) {
        if (selectedWordIds.has(e.id)) entries.push({ ...e });
      }
    }
    for (const b of sentenceBooks) {
      for (const e of b.entries) {
        if (selectedSentenceIds.has(e.id)) entries.push({ ...e });
      }
    }
    onStartMemory(entries);
  };

  const handleDelete = async (id: string, isWord: boolean, title: string, label: string) => {
    const ok = await confirm({
      title: `删除${label}`,
      body: `确定删除${label}「${title}」？该操作不可撤销。`,
      confirmLabel: '删除',
      danger: true,
    });
    if (!ok) return;
    if (isWord) deleteWordBook(id);
    else deleteSentenceBook(id);
    refresh();
    onDataChanged();
    toast.success(`已删除「${title}」`);
  };

  const handleCreate = () => {
    if (!createOpen) return;
    const kind = createOpen;
    const title = newTitle.trim() || (kind === 'word' ? '未命名词书' : '未命名句书');
    const book = { id: uid(), title, entries: [], createdAt: Date.now() };
    if (kind === 'word') addWordBook(book);
    else addSentenceBook(book);
    setCreateOpen(null);
    setNewTitle('');
    refresh();
    onDataChanged();
  };

  const hasAny = wordBooks.length > 0 || sentenceBooks.length > 0;

  return (
    <PageShell
      title="词书 / 句书"
      subtitle={hasAny ? `共 ${wordBooks.length} 本词书 · ${sentenceBooks.length} 本句书` : undefined}
      actions={
        <>
          <Button variant={selectMode ? 'primary' : 'secondary'} onClick={toggleSelectMode}>
            {selectMode ? '退出选择' : '🧠 选择内容'}
          </Button>
          <Button variant="ghost" onClick={() => setCreateOpen('word')}>
            ＋ 词书
          </Button>
          <Button variant="ghost" onClick={() => setCreateOpen('sentence')}>
            ＋ 句书
          </Button>
        </>
      }
    >
      {hasAny ? (
        <div className={s.toolbar}>
          <SearchInput
            className={s.search}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索书名…"
          />
        </div>
      ) : null}

      {!hasAny ? (
        <EmptyState
          icon="📚"
          title="还没有词书或句书"
          description="新建词书收录单词，或新建句书收录句子；随后选择条目即可开始闪卡记忆。"
        />
      ) : (
        <>
          <section className={s.section}>
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle}>📗 词书</h2>
              <span className={s.sectionCount}>{filteredWords.length} 本</span>
            </div>
            {filteredWords.length === 0 ? (
              <EmptyState icon="📗" title="没有匹配的词书" />
            ) : (
              <LayoutGroup id="word-grid">
                <div className={s.grid}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filteredWords.map(b => (
                      <BookCard
                        key={b.id}
                        book={{ id: b.id, title: b.title, entries: b.entries }}
                        unit="词"
                        selectMode={selectMode}
                        allSelected={
                          b.entries.length > 0 && b.entries.every(e => selectedWordIds.has(e.id))
                        }
                        onToggleAll={() => toggleBookAll(b.id, true)}
                        onOpen={() => onOpenBook(b.id, 'word')}
                        onDelete={() => void handleDelete(b.id, true, b.title, '词书')}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </LayoutGroup>
            )}
          </section>

          <section className={s.section}>
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle}>📘 句书</h2>
              <span className={s.sectionCount}>{filteredSentences.length} 本</span>
            </div>
            {filteredSentences.length === 0 ? (
              <EmptyState icon="📘" title="没有匹配的句书" />
            ) : (
              <LayoutGroup id="sentence-grid">
                <div className={s.grid}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filteredSentences.map(b => (
                      <BookCard
                        key={b.id}
                        book={{ id: b.id, title: b.title, entries: b.entries }}
                        unit="句"
                        selectMode={selectMode}
                        allSelected={
                          b.entries.length > 0 &&
                          b.entries.every(e => selectedSentenceIds.has(e.id))
                        }
                        onToggleAll={() => toggleBookAll(b.id, false)}
                        onOpen={() => onOpenBook(b.id, 'sentence')}
                        onDelete={() => void handleDelete(b.id, false, b.title, '句书')}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </LayoutGroup>
            )}
          </section>
        </>
      )}

      {selectMode ? (
        <div className={s.selectBar}>
          <span className={s.selectCount}>已选 {totalSelected} 项</span>
          <span className={s.selectSpacer} />
          <Button variant="ghost" onClick={toggleSelectMode}>
            取消
          </Button>
          <Button variant="primary" onClick={handleStartMemory} disabled={totalSelected === 0}>
            🧠 开始记忆
          </Button>
        </div>
      ) : null}

      <Modal
        open={createOpen !== null}
        title={createOpen === 'word' ? '新建词书' : '新建句书'}
        onClose={() => setCreateOpen(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(null)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              创建
            </Button>
          </>
        }
      >
        <TextField
          label="书名"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleCreate();
          }}
          placeholder="留空则自动命名"
          autoFocus
        />
      </Modal>
    </PageShell>
  );
};
