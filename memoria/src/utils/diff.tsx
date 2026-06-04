/**
 * 文本比对工具 — 基于 `diff` 库进行逐词/逐字符比对，
 * 返回 React 节点数组，用于渲染彩色差异。
 *
 * - correct（正确 ✅）= 绿色
 * - incorrect（错误 ❌）= 红色背景 + strikethrough
 * - missing（遗漏）= 橙色背景
 * - extra（多余）= 红色删除线
 */

import React from 'react';
import { diffChars } from 'diff';

export interface DiffSegment {
  text: string;
  type: 'correct' | 'incorrect' | 'missing' | 'extra';
}

/**
 * 比较原文与用户输入，返回差异分段。
 * 使用字符级 diff。
 */
export function computeDiff(original: string, userInput: string): DiffSegment[] {
  const changes = diffChars(original, userInput);
  const segments: DiffSegment[] = [];

  for (const change of changes) {
    if (change.added && change.removed) {
      // diff 库不会同时发生 added + removed
    }
    if (change.added) {
      // 用户多输入的
      segments.push({ text: change.value, type: 'extra' });
    } else if (change.removed) {
      // 原文有但用户没输入的
      segments.push({ text: change.value, type: 'missing' });
    } else {
      // 相同的
      segments.push({ text: change.value, type: 'correct' });
    }
  }

  return segments;
}

const styleMap: Record<DiffSegment['type'], React.CSSProperties> = {
  correct: { color: '#16a34a' },
  incorrect: { backgroundColor: '#fecaca', textDecoration: 'line-through', color: '#dc2626' },
  missing: { backgroundColor: '#fed7aa', color: '#ea580c' },
  extra: { color: '#dc2626', textDecoration: 'line-through', backgroundColor: '#fee2e2' },
};

/** 将差异分段渲染为带样式的 <span> 列表 */
export function renderDiff(segments: DiffSegment[]): React.ReactNode {
  return segments.map((seg, i) => (
    <span key={i} style={styleMap[seg.type]}>
      {seg.text}
    </span>
  ));
}

/**
 * 便捷函数：输入原文和用户输入，直接返回 React 节点。
 */
export function DiffView({ original, userInput }: { original: string; userInput: string }) {
  const segments = computeDiff(original, userInput);
  return <>{renderDiff(segments)}</>;
}
