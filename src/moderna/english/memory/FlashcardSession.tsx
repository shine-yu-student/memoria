import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotionKit } from '../../motion/useMotionKit';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { ProgressBar } from '../../ui/ProgressBar';
import {
  formatTime,
  useFlashcardSession,
  type FlashcardEntry,
} from './useFlashcardSession';
import s from './Flashcard.module.css';

interface Props {
  entries: FlashcardEntry[];
  onBack: () => void;
}

export const FlashcardSession: React.FC<Props> = ({ entries, onBack }) => {
  const session = useFlashcardSession();
  const kit = useMotionKit();

  // StrictMode 下 effect 会执行两次，用 ref 保证只启动一次，
  // 否则队列会被洗牌并消费两次
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStartedRef.current) return;
    if (entries && entries.length > 0) {
      autoStartedRef.current = true;
      session.startMemory(entries);
    }
    // 仅在挂载时启动
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 方向：始终向前，换张是单向推进
  const dirRef = useRef(1);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      session.handleSubmit();
    }
  };

  if (session.phase === 'result') {
    return <FlashcardResult session={session} onBack={onBack} />;
  }

  const pct = session.progress.total > 0 ? session.progress.done / session.progress.total : 0;

  return (
    <div className={s.page}>
      <div className={s.stats}>
        <span>
          {session.progress.done} / {session.progress.total}
        </span>
        <span>·</span>
        <span>错误 {session.progress.wrong}</span>
        <span>·</span>
        <span>用时 {formatTime(session.elapsed)}</span>
        <span className={s.statsSpacer} />
        <Button variant="ghost" size="sm" onClick={onBack}>
          结束
        </Button>
      </div>

      <ProgressBar className={s.progress} value={pct} />

      {session.flashPhase === 'completed' ? (
        <motion.div
          className={s.done}
          variants={kit.reveal}
          initial="enter"
          animate="center"
          style={{ marginTop: 48 }}
        >
          <div style={{ fontSize: 48 }}>🎉</div>
          <h2 className={s.doneTitle}>全部完成！</h2>
          <p style={{ margin: 0 }}>
            共 {session.progress.total} 项，答错 {session.progress.wrong} 次，用时{' '}
            {formatTime(session.elapsed)}
          </p>
          <Button variant="primary" onClick={() => session.setPhase('result')}>
            查看结果
          </Button>
        </motion.div>
      ) : (
        <div className={s.cardWrap}>
          <AnimatePresence mode="popLayout" initial={false} custom={dirRef.current}>
            {session.currentEntry ? (
              <motion.div
                key={session.currentEntry.id}
                className={s.card}
                custom={dirRef.current}
                variants={kit.card}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {session.isRetest.current ? (
                  <Chip tone="warning" className={s.retestTag}>
                    🔁 复习
                  </Chip>
                ) : null}

                <div className={s.prompt}>{session.currentEntry.chinese}</div>

                <input
                  ref={session.inputRef}
                  className={s.answerInput}
                  value={session.input}
                  onChange={e => session.setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入英文…"
                  autoComplete="off"
                />

                <AnimatePresence initial={false}>
                  {session.flashPhase === 'wrong-reveal' ? (
                    <motion.div
                      className={s.reveal}
                      variants={kit.collapse}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      style={{ overflow: 'hidden' }}
                    >
                      <span>正确答案</span>
                      <span className={s.revealAnswer}>{session.currentEntry.english}</span>
                      <span style={{ fontSize: 13 }}>请重新输入以继续</span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <Button
                  variant="primary"
                  onClick={session.handleSubmit}
                  disabled={!session.input.trim()}
                >
                  提交
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

type Session = ReturnType<typeof useFlashcardSession>;

const FlashcardResult: React.FC<{ session: Session; onBack: () => void }> = ({
  session,
  onBack,
}) => {
  const wrong = session.wrongSummary();
  const kit = useMotionKit();

  return (
    <div className={s.page}>
      <motion.div className={s.resultCard} variants={kit.reveal} initial="enter" animate="center">
        <h2 style={{ margin: 0, fontSize: 24 }}>记忆结果</h2>
        <div className={s.resultRow}>
          <span>总数</span>
          <span className={s.resultValue}>{session.progress.total}</span>
        </div>
        <div className={s.resultRow}>
          <span>首次答对</span>
          <span className={s.resultValue}>{session.progress.done}</span>
        </div>
        <div className={s.resultRow}>
          <span>答错次数</span>
          <span className={s.resultValue}>{session.progress.wrong}</span>
        </div>
        <div className={s.resultRow}>
          <span>用时</span>
          <span className={s.resultValue}>{formatTime(session.elapsed)}</span>
        </div>

        {wrong.length > 0 ? (
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--m-text-secondary)' }}>
              答错的 {wrong.length} 个{''}
            </summary>
            <div style={{ marginTop: 8 }}>
              {wrong.map(({ entry, count }) => (
                <div key={entry.id} className={s.wrongItem}>
                  <span>{entry.english}</span>
                  <span style={{ color: 'var(--m-danger)' }}>{count} 次</span>
                </div>
              ))}
            </div>
          </details>
        ) : null}

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <Button variant="primary" onClick={onBack}>
            返回
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
