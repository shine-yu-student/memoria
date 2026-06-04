/**
 * 中文句子切分工具
 *
 * 将一段中文文本按分隔符（。！？，、；：……—\n 等）
 * 切分为若干"句子"（相邻分隔符之间的片段）。
 */

/** 中文分隔符正则 */
const DELIMITER_RE = /[。！？，、；：……—\n\r\u3000\s]+/;

/**
 * 将整篇文章切分为句子列表。
 * 保留空段落会被过滤掉。
 */
export function splitIntoSentences(text: string): string[] {
  const raw = text
    .split(DELIMITER_RE)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // 如果文章末尾没有任何分隔符，最后一个片段也在内
  if (raw.length === 0 && text.trim().length > 0) {
    return [text.trim()];
  }
  return raw;
}

/**
 * 从文章中随机选取 count 个不重复的句子索引。
 * 如果 count > 总句子数，则返回全部索引。
 */
export function pickRandomIndices(total: number, count: number): number[] {
  const indices = Array.from({ length: total }, (_, i) => i);
  const picked: number[] = [];
  const target = Math.min(count, total);
  for (let i = 0; i < target; i++) {
    const idx = Math.floor(Math.random() * indices.length);
    picked.push(indices[idx]);
    indices.splice(idx, 1);
  }
  return picked.sort((a, b) => a - b);
}
