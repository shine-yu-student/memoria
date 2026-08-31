/**
 * 界面版本切换（经典界面 ↔ 实验性新界面 Moderna）。
 *
 * 采用模块级外部 store + useSyncExternalStore，而不是 Context：
 * 经典界面的设置弹窗与新界面的设置面板都要能切换，若各挂一个 Provider
 * 就会出现两处状态不一致的隐患。放在模块里则天然单一真源。
 *
 * 关键约束：任何取值失败 / 非法值的兜底都必须是 'classic'，
 * 保证最坏情况永远是可用的经典界面。
 */

import { useSyncExternalStore } from 'react';

export type UiMode = 'classic' | 'modern';

const STORAGE_KEY = 'memoria:ui';
const ATTR = 'data-ui';

function readQuery(): UiMode | null {
  try {
    const v = new URLSearchParams(window.location.search).get('ui');
    return v === 'modern' || v === 'classic' ? v : null;
  } catch {
    return null;
  }
}

/** ?ui=classic|modern 优先于存储，作为卡在新界面时的逃生通道 */
function readStored(): UiMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'modern' ? 'modern' : 'classic';
  } catch {
    return 'classic';
  }
}

let current: UiMode = readQuery() ?? readStored();

const listeners = new Set<() => void>();

export function getUiMode(): UiMode {
  return current;
}

export function subscribeUiMode(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function setUiMode(mode: UiMode): void {
  if (mode === current) return;
  current = mode;

  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch (e) {
    console.warn('保存界面版本失败', e);
  }

  // 同步写属性，使 CSS 与 React 树在同一帧切换
  document.documentElement.setAttribute(ATTR, mode);

  // 清掉 ?ui= 覆盖，否则它会一直压过用户刚刚做出的选择
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('ui')) {
      url.searchParams.delete('ui');
      history.replaceState(null, '', url.toString());
    }
  } catch {
    /* 某些环境不支持 history API，忽略 */
  }

  listeners.forEach(fn => fn());
}

export function useUiMode(): [UiMode, (mode: UiMode) => void] {
  const mode = useSyncExternalStore(subscribeUiMode, getUiMode, () => 'classic' as UiMode);
  return [mode, setUiMode];
}
