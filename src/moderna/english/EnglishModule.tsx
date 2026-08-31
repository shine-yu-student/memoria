import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { SentenceBook, WordBook } from '../../types';
import { deleteSentenceBook, deleteWordBook, loadSentenceBooks, loadWordBooks } from '../../utils/storage';
import { useMotionKit } from '../motion/useMotionKit';
import { BookList } from './BookList';
import { BookDetail } from './BookDetail';
import { FlashcardSession } from './memory/FlashcardSession';

type View = 'list' | 'detail' | 'memory';

interface Props {
  dataVersion: number;
  onDataChanged: () => void;
}

type Entry = { id: string; english: string; chinese: string };

const DEPTH: Record<View, number> = { list: 0, detail: 1, memory: 2 };

export const EnglishModule: React.FC<Props> = ({ dataVersion, onDataChanged }) => {
  const [view, setView] = useState<View>('list');
  const [bookId, setBookId] = useState<string | null>(null);
  const [bookType, setBookType] = useState<'word' | 'sentence'>('word');
  const [book, setBook] = useState<WordBook | SentenceBook | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Entry[] | null>(null);
  const kit = useMotionKit();

  const prevDepthRef = useRef(DEPTH.list);
  const dir = DEPTH[view] >= prevDepthRef.current ? 1 : -1;
  useEffect(() => {
    prevDepthRef.current = DEPTH[view];
  }, [view]);

  const openBook = (id: string, type: 'word' | 'sentence') => {
    const found =
      type === 'word'
        ? loadWordBooks().find(b => b.id === id)
        : loadSentenceBooks().find(b => b.id === id);
    if (!found) return;
    setBookId(id);
    setBookType(type);
    setBook(found);
    setView('detail');
  };

  /** 删除书籍：清掉已失效的选择并回到列表 */
  const handleDeleteBook = (id: string, isWord: boolean) => {
    if (isWord) deleteWordBook(id);
    else deleteSentenceBook(id);
    setBook(null);
    setBookId(null);
    setView('list');
    onDataChanged();
  };

  return (
    <AnimatePresence mode="wait" initial={false} custom={dir}>
      <motion.div
        key={view}
        custom={dir}
        variants={kit.drill}
        initial="enter"
        animate="center"
        exit="exit"
        style={{ height: '100%' }}
      >
        {view === 'list' && (
          <BookList
            dataVersion={dataVersion}
            onOpenBook={openBook}
            onDataChanged={onDataChanged}
            onStartMemory={entries => {
              setSelectedEntries(entries);
              setView('memory');
            }}
          />
        )}

        {view === 'detail' && book && (
          <BookDetail
            book={book}
            bookType={bookType}
            onBack={() => {
              setView('list');
              setBook(null);
              setBookId(null);
              onDataChanged();
            }}
            onDataChanged={onDataChanged}
            onDeleteBook={handleDeleteBook}
          />
        )}

        {view === 'memory' && selectedEntries && (
          <FlashcardSession
            entries={selectedEntries}
            onBack={() => {
              setView('list');
              setSelectedEntries(null);
              onDataChanged();
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
