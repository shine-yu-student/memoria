import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Article } from '../../types';
import { useMotionKit } from '../motion/useMotionKit';
import { ArticleList } from './ArticleList';
import { ArticleDetail } from './ArticleDetail';
import { ArticleMemory } from './memory/ArticleMemory';

type View = 'list' | 'detail' | 'memory';

interface Props {
  dataVersion: number;
  onDataChanged: () => void;
}

/** 深度用于推导下钻方向：list=0 → detail=1 → memory=2 */
const DEPTH: Record<View, number> = { list: 0, detail: 1, memory: 2 };

export const ChineseModule: React.FC<Props> = ({ dataVersion, onDataChanged }) => {
  const [view, setView] = useState<View>('list');
  const [article, setArticle] = useState<Article | null>(null);
  const kit = useMotionKit();

  // 方向存 ref：退场期间组件已卸载，读 state 会拿到新值
  const prevDepthRef = useRef(DEPTH.list);
  const dir = DEPTH[view] >= prevDepthRef.current ? 1 : -1;
  React.useEffect(() => {
    prevDepthRef.current = DEPTH[view];
  }, [view]);

  const openArticle = (a: Article) => {
    setArticle(a);
    setView('detail');
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
          <ArticleList
            dataVersion={dataVersion}
            onOpenArticle={openArticle}
            onDataChanged={onDataChanged}
          />
        )}

        {view === 'detail' && article && (
          <ArticleDetail
            article={article}
            onBack={() => {
              setView('list');
              setArticle(null);
              onDataChanged();
            }}
            onDataChanged={onDataChanged}
            onStartMemory={a => {
              setArticle(a);
              setView('memory');
            }}
          />
        )}

        {view === 'memory' && article && (
          <ArticleMemory
            article={article}
            onBack={() => {
              setView('list');
              setArticle(null);
              onDataChanged();
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
