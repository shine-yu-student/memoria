import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import type { SentenceBook, WordBook } from '../../types';
import { uid } from '../../types';
import { updateSentenceBook, updateWordBook } from '../../utils/storage';
import { readJSONFile } from '../lib/download';
import { useMediaQuery } from '../lib/useMediaQuery';
import { spring } from '../motion/presets';
import { PageShell } from '../shell/PageShell';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Chip } from '../ui/Chip';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';
import { TextArea } from '../ui/TextArea';
import { useToast } from '../ui/ToastProvider';
import { useConfirm } from '../ui/ConfirmDialog';
import { EntryChip, type Entry } from './EntryChip';
import s from './BookDetail.module.css';

interface Props {
  book: WordBook | SentenceBook;
  bookType: 'word' | 'sentence';
  onBack: () => void;
  onDataChanged: () => void;
  /** 删除后由列表页清理选择集，故在此只负责发起 */
  onDeleteBook: (id: string, isWord: boolean) => void;
}

interface ParsedEntry {
  english: string;
  chinese: string;
}

/** 字段别名与经典界面一致：english|en，chinese|zh|meaning */
function normalizeEntries(raw: unknown): ParsedEntry[] | null {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { entries?: unknown }).entries)
      ? (raw as { entries: unknown[] }).entries
      : null;
  if (!list) return null;

  const out: ParsedEntry[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const english = typeof o.english === 'string' ? o.english : typeof o.en === 'string' ? o.en : '';
    const chinese =
      typeof o.chinese === 'string'
        ? o.chinese
        : typeof o.zh === 'string'
          ? o.zh
          : typeof o.meaning === 'string'
            ? o.meaning
            : '';
    if (english.trim() && chinese.trim()) out.push({ english: english.trim(), chinese: chinese.trim() });
  }
  return out;
}

export const BookDetail: React.FC<Props> = ({
  book,
  bookType,
  onBack,
  onDataChanged,
  onDeleteBook,
}) => {
  const [entries, setEntries] = useState<Entry[]>(() =>
    book.entries.map(e => ({ id: e.id, english: e.english, chinese: e.chinese }))
  );
  const [newEn, setNewEn] = useState('');
  const [newZh, setNewZh] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [preview, setPreview] = useState<ParsedEntry[] | null>(null);

  const toast = useToast();
  const { confirm } = useConfirm();
  const narrow = useMediaQuery('(max-width: 640px)');

  const bookRef = useRef(book);
  bookRef.current = book;
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const unit = bookType === 'word' ? '词' : '句';

  useEffect(() => {
    setEntries(book.entries.map(e => ({ id: e.id, english: e.english, chinese: e.chinese })));
  }, [book]);

  const persist = useCallback(
    (next: Entry[]) => {
      const updated: WordBook | SentenceBook = {
        ...bookRef.current,
        entries: next.map(e => ({ id: e.id, english: e.english, chinese: e.chinese })),
      } as WordBook | SentenceBook;
      if (bookType === 'word') updateWordBook(updated as WordBook);
      else updateSentenceBook(updated as SentenceBook);
      onDataChanged();
    },
    [bookType, onDataChanged]
  );

  const handleSaveEntry = (id: string, english: string, chinese: string) => {
    const next = entriesRef.current.map(e => (e.id === id ? { ...e, english, chinese } : e));
    setEntries(next);
    persist(next);
  };

  const handleDeleteEntry = (id: string) => {
    const next = entriesRef.current.filter(e => e.id !== id);
    setEntries(next);
    persist(next);
    toast.success('已删除');
  };

  const handleAdd = () => {
    const en = newEn.trim();
    const zh = newZh.trim();
    if (!en || !zh) {
      toast.warning('英文与中文都需要填写');
      return;
    }
    const next = [...entriesRef.current, { id: uid(), english: en, chinese: zh }];
    setEntries(next);
    persist(next);
    setNewEn('');
    setNewZh('');
  };

  const doImport = (parsed: ParsedEntry[]) => {
    const next = [
      ...entriesRef.current,
      ...parsed.map(p => ({ id: uid(), english: p.english, chinese: p.chinese })),
    ];
    setEntries(next);
    persist(next);
    setImportOpen(false);
    setImportText('');
    setPreview(null);
    toast.success(`已导入 ${parsed.length} ${unit}`);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = normalizeEntries(await readJSONFile(file));
      if (!parsed || parsed.length === 0) {
        toast.error('未识别到有效条目');
        return;
      }
      doImport(parsed);
    } catch (err) {
      toast.error(`导入失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      e.target.value = '';
    }
  };

  /** 删除交由列表页执行：删除后需要清理已失效的选择集 */
  const handleDeleteBook = async () => {
    const ok = await confirm({
      title: `删除${bookType === 'word' ? '词书' : '句书'}`,
      body: `确定删除「${book.title}」？该操作不可撤销。`,
      confirmLabel: '删除',
      danger: true,
    });
    if (ok) onDeleteBook(book.id, bookType === 'word');
  };

  const sorted = useMemo(() => entries, [entries]);

  return (
    <PageShell
      title={book.title}
      subtitle={`${entries.length} ${unit}`}
      actions={
        <>
          <Chip tone="accent">{bookType === 'word' ? '📗 词书' : '📘 句书'}</Chip>
          <Button variant="ghost" size="sm" onClick={() => setImportOpen(true)}>
            📋 从 JSON 导入
          </Button>
          <Button variant="dangerGhost" size="sm" onClick={() => void handleDeleteBook()}>
            🗑️ 删除
          </Button>
        </>
      }
    >
      <div className={s.addRow}>
        <input
          className={s.addField}
          value={newEn}
          onChange={e => setNewEn(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder="英文"
          style={inlineInput}
        />
        <input
          className={s.addField}
          value={newZh}
          onChange={e => setNewZh(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder="中文"
          style={inlineInput}
        />
        <Button variant="primary" onClick={handleAdd}>
          ＋ 添加{unit}
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={bookType === 'word' ? '📗' : '📘'}
          title={`还没有${unit}`}
          description={`在上方输入英文与中文添加${unit}，或从 JSON 批量导入。`}
        />
      ) : (
        <LayoutGroup id="entry-grid">
          <div className={s.grid}>
            <AnimatePresence mode="popLayout" initial={false}>
              {sorted.map(e => (
                <motion.div
                  key={e.id}
                  layout="position"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.13 } }}
                  transition={spring.snappy}
                >
                  <EntryChip
                    entry={e}
                    unit={unit}
                    onSave={(en, zh) => handleSaveEntry(e.id, en, zh)}
                    onDelete={() => handleDeleteEntry(e.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      )}

      <Modal
        open={importOpen}
        title="批量导入"
        onClose={() => setImportOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setImportOpen(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              disabled={!preview || preview.length === 0}
              onClick={() => preview && doImport(preview)}
            >
              确认导入{preview ? `（${preview.length}）` : ''}
            </Button>
          </>
        }
      >
        <p style={{ marginTop: 0, color: 'var(--m-text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
          支持数组或 <code>{'{ "entries": [...] }'}</code>；字段别名 english|en，chinese|zh|meaning。
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <Button variant="secondary" size="sm" onClick={() => document.getElementById('book-import-file')?.click()}>
            📂 选择文件
          </Button>
        </div>
        <input
          id="book-import-file"
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileImport}
        />
        <TextArea
          label="或粘贴 JSON"
          rows={6}
          mono
          value={importText}
          onChange={e => setImportText(e.target.value)}
        />
        <div style={{ marginTop: 12 }}>
          <Button
            variant="secondary"
            size="sm"
            disabled={!importText.trim()}
            onClick={() => {
              try {
                const parsed = normalizeEntries(JSON.parse(importText));
                if (!parsed || parsed.length === 0) {
                  toast.error('未识别到有效条目');
                  return;
                }
                setPreview(parsed);
              } catch {
                toast.error('JSON 解析失败');
              }
            }}
          >
            🔍 解析并预览
          </Button>
        </div>
        {preview ? (
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--m-success)' }}>
            解析成功：{preview.length} 条，确认后追加到本书。
          </p>
        ) : null}
        {narrow ? (
          <p style={{ fontSize: 12, color: 'var(--m-text-muted)' }}>窄屏下条目编辑仍以内联展开呈现。</p>
        ) : null}
      </Modal>

      <div style={{ marginTop: 24 }}>
        <IconButton label="返回列表" onClick={onBack}>
          ←
        </IconButton>
      </div>
    </PageShell>
  );
};

const inlineInput: React.CSSProperties = {
  padding: '9px 12px',
  fontFamily: 'inherit',
  fontSize: 15,
  color: 'var(--m-text)',
  background: 'var(--m-bg-inset)',
  border: '1px solid var(--m-border)',
  borderRadius: 10,
  outline: 'none',
};
