import type { GuideConfig, GuideStep } from '../../types';

/**
 * 校验并清洗指导记忆配置。
 *
 * 【重要】校验规则与已持久化的配置（memoria:guided:{id}:config）严格对应：
 * 放宽规则前必须确认历史数据仍能被接受，否则用户进度会被清空。
 *
 * 要求：steps 为数组；每步含字符串 hint 和整数、非负的 sentenceIndices 数组。
 * 任何一项不合法返回 null（调用方应拒绝导入并保留旧数据）—— 注意是整份返回 null，
 * 而不是过滤掉不合法的步骤。
 */
export function sanitizeGuideConfig(raw: unknown): GuideConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const steps = (raw as { steps?: unknown }).steps;
  if (!Array.isArray(steps)) return null;
  const cleaned: GuideStep[] = [];
  for (const step of steps) {
    if (!step || typeof step !== 'object') return null;
    const { hint, sentenceIndices } = step as { hint?: unknown; sentenceIndices?: unknown };
    if (typeof hint !== 'string') return null;
    if (!Array.isArray(sentenceIndices)) return null;
    const indices: number[] = [];
    for (const idx of sentenceIndices) {
      if (!Number.isInteger(idx) || (idx as number) < 0) return null;
      indices.push(idx as number);
    }
    cleaned.push({ hint, sentenceIndices: indices });
  }
  return { steps: cleaned };
}
