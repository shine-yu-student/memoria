/**
 * 中文句子切分工具
 *
 * 将一段中文文本按分隔符（。！？，、；：……—\n 等）
 * 切分为若干"句子"（相邻分隔符之间的片段），
 * 并保留原始分隔符用于还原显示。
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
 * 根据原文和已切分的句子列表，提取每个句子前后的原始分隔符。
 * 返回长度为 sentences.length + 1 的数组：
 *   delimiters[i] = 第 i 个句子之前的分隔符（i=0 时通常为空）
 *   delimiters[sentences.length] = 最后一个句子之后的分隔符
 *
 * 用于在渲染时还原原文的标点符号和换行。
 */
export function extractDelimiters(content: string, sentences: string[]): string[] {
  const delimiters: string[] = [];
  let pos = 0;
  for (const sentence of sentences) {
    const idx = content.indexOf(sentence, pos);
    if (idx === -1) {
      // 容错：句子未在预期位置找到
      delimiters.push('');
      continue;
    }
    // pos 到 idx 之间的文本即为该句子之前的分隔符
    delimiters.push(content.slice(pos, idx));
    pos = idx + sentence.length;
  }
  // 末尾剩余文本
  delimiters.push(content.slice(pos));
  return delimiters;
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
