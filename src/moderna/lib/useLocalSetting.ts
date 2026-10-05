import { useCallback, useState } from 'react';

/**
 * localStorage 支撑的持久化设置。
 *
 * 读取失败 / 值非法时一律回落到 defaultValue，保证最坏情况仍可用。
 * ser/de 默认按字符串处理，读到的原始字符串直接作为值。
 */
export function useLocalSetting<T extends string>(
  key: string,
  defaultValue: T,
  isValid: (v: string) => boolean = () => true
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null && isValid(raw) ? (raw as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(key, next);
      } catch (e) {
        console.warn(`保存设置 ${key} 失败`, e);
      }
    },
    [key]
  );

  return [value, update];
}
