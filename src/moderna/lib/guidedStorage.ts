import type { GuideConfig } from '../../types';
import { sanitizeGuideConfig } from './sanitizeGuideConfig';

/**
 * 指导记忆进度的持久化。
 *
 * 【重要】键名与键结构必须与经典界面 ArticleMemoryView.tsx:46-96 完全一致，
 * 否则用户切换界面时进度会丢失。输入项以 `guided-${句子索引}` 为键 ——
 * 注意不是以步骤为键，因此同一个句子在不同步骤中的作答是共享的。
 */

function keys(articleId: string) {
  return {
    config: `memoria:guided:${articleId}:config`,
    step: `memoria:guided:${articleId}:step`,
    inputs: `memoria:guided:${articleId}:inputs`,
  };
}

export function loadGuidedConfig(articleId: string): GuideConfig | null {
  try {
    const raw = localStorage.getItem(keys(articleId).config);
    return raw ? sanitizeGuideConfig(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function loadGuidedStep(articleId: string): number {
  try {
    const raw = localStorage.getItem(keys(articleId).step);
    if (raw === null) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function loadGuidedInputs(articleId: string): Record<string, string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(keys(articleId).inputs) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveGuidedConfig(articleId: string, config: GuideConfig | null): void {
  const k = keys(articleId);
  try {
    if (config) {
      localStorage.setItem(k.config, JSON.stringify(config));
      localStorage.setItem(k.step, String(loadGuidedStep(articleId)));
    } else {
      localStorage.removeItem(k.config);
      localStorage.removeItem(k.step);
    }
  } catch (e) {
    console.warn('保存指导记忆配置失败', e);
  }
}

export function saveGuidedStep(articleId: string, step: number): void {
  try {
    localStorage.setItem(keys(articleId).step, String(step));
  } catch (e) {
    console.warn('保存指导记忆步骤失败', e);
  }
}

/** 与经典界面一致：无条件写入，即使还没有配置 */
export function saveGuidedInputs(articleId: string, inputs: Record<string, string>): void {
  try {
    localStorage.setItem(keys(articleId).inputs, JSON.stringify(inputs));
  } catch (e) {
    console.warn('保存指导记忆输入失败', e);
  }
}

export function clearGuidedProgress(articleId: string): void {
  const k = keys(articleId);
  try {
    localStorage.removeItem(k.step);
    localStorage.removeItem(k.inputs);
  } catch (e) {
    console.warn('清除指导记忆进度失败', e);
  }
}
