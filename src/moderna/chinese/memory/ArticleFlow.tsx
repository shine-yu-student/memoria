import React, { Fragment } from 'react';
import s from './ArticleFlow.module.css';

interface Props {
  sentences: string[];
  delimiters: string[];
  renderSentence: (sentence: string, index: number) => React.ReactNode;
}

/**
 * 句子 + 分隔符的统一遍历。
 *
 * 契约（与经典界面 ArticleMemoryView.tsx:763-801 一致）：
 * 先输出 delimiters[idx]，再输出第 idx 句；循环结束后补 delimiters[末尾]。
 * 这样原文的标点与换行能被原样还原。
 *
 * 外层用 Fragment 而非 span：旧代码用的是 display:inline 的 span，
 * 行为上等价，少一层包裹。
 */
export const ArticleFlow: React.FC<Props> = ({ sentences, delimiters, renderSentence }) => (
  <div className={s.article}>
    {sentences.map((sentence, idx) => (
      <Fragment key={idx}>
        {renderDelimiter(delimiters[idx], `d-${idx}`)}
        {renderSentence(sentence, idx)}
      </Fragment>
    ))}
    {renderDelimiter(delimiters[sentences.length], 'd-last')}
  </div>
);

/** 空串返回 null；否则按捕获组切分，\n 渲染为 <br/> */
function renderDelimiter(delim: string, key: string): React.ReactNode {
  if (!delim) return null;
  const parts = delim.split(/(\n)/);
  return (
    <span key={key} className={s.punct}>
      {parts.map((part, i) => (part === '\n' ? <br key={i} /> : part))}
    </span>
  );
}

export { s as articleFlowStyles };
