import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Article } from '../../types';
import { updateArticle } from '../../utils/storage';
import { splitIntoSentences } from '../../utils/splitter';
import { downloadJSON } from '../lib/download';
import { PageShell } from '../shell/PageShell';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { TextField } from '../ui/TextField';
import s from './ArticleList.module.css';

interface Props {
  article: Article;
  onBack: () => void;
  onDataChanged: () => void;
  onStartMemory: (article: Article) => void;
}

const DEBOUNCE_MS = 500;

/**
 * 文章详情 / 编辑器。
 *
 * 持久化策略与经典界面一致：500ms 防抖落盘，外加卸载前 flush，
 * 以及进入记忆前先 flush（否则用户在防抖窗口内点"开始记忆"会丢内容）。
 */
export const ArticleDetail: React.FC<Props> = ({
  article,
  onBack,
  onDataChanged,
  onStartMemory,
}) => {
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content);

  // 供防抖回调与卸载钩子读取最新值，避免闭包过期
  const latest = useRef({ title, content });
  latest.current = { title, content };

  const timerRef = useRef<number | null>(null);
  const dirtyRef = useRef(false);

  const persist = useCallback(
    (nextTitle: string, nextContent: string) => {
      updateArticle({
        ...article,
        title: nextTitle,
        content: nextContent,
        sentences: splitIntoSentences(nextContent),
      });
      dirtyRef.current = false;
      onDataChanged();
    },
    [article, onDataChanged]
  );

  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!dirtyRef.current) return;
    const { title: t, content: c } = latest.current;
    persist(t, c);
  }, [persist]);

  const schedulePersist = useCallback(
    (nextTitle: string, nextContent: string) => {
      dirtyRef.current = true;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        persist(nextTitle, nextContent);
      }, DEBOUNCE_MS);
    },
    [persist]
  );

  // 卸载时兜底：还有未落盘的编辑就直接写存储，避免丢失最后一次输入
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!dirtyRef.current) return;
      const { title: t, content: c } = latest.current;
      try {
        updateArticle({ ...article, title: t, content: c, sentences: splitIntoSentences(c) });
      } catch (e) {
        console.warn('保存文章失败', e);
      }
    };
  }, [article]);

  const sentenceCount = useMemo(() => splitIntoSentences(content).length, [content]);
  const charCount = content.replace(/\s/g, '').length;

  const handleStartMemory = () => {
    flush();
    onStartMemory({ ...article, title: latest.current.title, content: latest.current.content });
  };

  const handleExport = () => {
    flush();
    downloadJSON({ ...article, title: latest.current.title, content: latest.current.content }, `${latest.current.title}.json`);
  };

  return (
    <PageShell bare>
      <div className={s.detailLayout}>
        <div className={s.titleRow}>
          <IconButton label="返回列表" onClick={onBack}>
            ←
          </IconButton>
          <TextField
            className={s.titleInput}
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              schedulePersist(e.target.value, content);
            }}
            placeholder="文章标题"
          />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={handleExport}>
              ⬇️ 导出
            </Button>
            <Button variant="primary" onClick={handleStartMemory}>
              🧠 开始记忆
            </Button>
          </div>
        </div>

        <div className={s.metaRow}>
          <span>共 {sentenceCount} 句</span>
          <span>·</span>
          <span>{charCount} 字</span>
        </div>

        <textarea
          className={s.editorArea}
          value={content}
          onChange={e => {
            setContent(e.target.value);
            schedulePersist(title, e.target.value);
          }}
          placeholder="在此输入文章正文……"
        />
      </div>
    </PageShell>
  );
};
