import React, { useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import type { Article } from '../../types';
import { uid } from '../../types';
import { loadArticles, addArticle, deleteArticle } from '../../utils/storage';
import { PageShell } from '../shell/PageShell';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';
import { useToast } from '../ui/ToastProvider';
import { useConfirm } from '../ui/ConfirmDialog';
import { ArticleCard } from './ArticleCard';
import s from './ArticleList.module.css';

interface Props {
  dataVersion: number;
  onOpenArticle: (article: Article) => void;
  onDataChanged: () => void;
}

export const ArticleList: React.FC<Props> = ({ dataVersion, onOpenArticle, onDataChanged }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const toast = useToast();
  const { confirm } = useConfirm();

  const refresh = React.useCallback(() => setArticles(loadArticles()), []);

  // dataVersion 变化时重新加载而非重挂载，避免打断进行中的会话
  React.useEffect(() => {
    refresh();
  }, [dataVersion, refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter(a => String(a.title ?? '').toLowerCase().includes(q));
  }, [articles, search]);

  const handleDelete = async (article: Article) => {
    const ok = await confirm({
      title: '删除文章',
      body: `确定删除文章「${article.title}」？该操作不可撤销。`,
      confirmLabel: '删除',
      danger: true,
    });
    if (!ok) return;
    deleteArticle(article.id);
    refresh();
    onDataChanged();
    toast.success(`已删除「${article.title}」`);
  };

  const handleCreate = () => {
    const existing = new Set(articles.map(a => a.title));
    let title = newTitle.trim();
    if (!title) {
      let n = articles.length + 1;
      do {
        title = `未命名文章 ${n}`;
        n++;
      } while (existing.has(title));
    }
    const article: Article = {
      id: uid(),
      title,
      content: '',
      sentences: [],
      createdAt: Date.now(),
    };
    addArticle(article);
    setCreateOpen(false);
    setNewTitle('');
    refresh();
    onDataChanged();
    onOpenArticle(article);
  };

  return (
    <PageShell
      title="文章记忆"
      subtitle={articles.length > 0 ? `共 ${articles.length} 篇` : undefined}
      actions={
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          ＋ 新建文章
        </Button>
      }
    >
      {articles.length > 0 ? (
        <div className={s.toolbar}>
          <SearchInput
            className={s.search}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索标题…"
          />
          <span className={s.count}>
            {filtered.length === articles.length
              ? `${articles.length} 篇`
              : `匹配 ${filtered.length} / ${articles.length} 篇`}
          </span>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon="📖"
          title={articles.length === 0 ? '还没有文章' : '没有匹配的文章'}
          description={
            articles.length === 0
              ? '新建一篇文章，粘贴需要背诵的课文，即可开始全篇、部分或指导记忆。'
              : '试试换个关键词。'
          }
          action={
            articles.length === 0 ? (
              <Button variant="primary" onClick={() => setCreateOpen(true)}>
                ＋ 新建文章
              </Button>
            ) : undefined
          }
        />
      ) : (
        <LayoutGroup id="article-grid">
          <div className={s.grid}>
            <AnimatePresence mode="popLayout" initial={false}>
              {filtered.map(a => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  onOpen={() => onOpenArticle(a)}
                  onDelete={() => void handleDelete(a)}
                />
              ))}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      )}

      <Modal
        open={createOpen}
        title="新建文章"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              创建
            </Button>
          </>
        }
      >
        <TextField
          label="标题"
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
