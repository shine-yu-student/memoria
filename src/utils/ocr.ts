/**
 * OCR 工具模块
 *
 * 使用 tesseract.js 识别图片中的文字，
 * 并尝试将识别结果解析为 英文-中文 词对列表。
 */

import { createWorker } from 'tesseract.js';

/* ==================== 类型 ==================== */

export interface OcrResult {
  rawText: string;
  pairs: OcrPair[];
}

export interface OcrPair {
  english: string;
  chinese: string;
}

/* ==================== 文本解析 ==================== */

/**
 * 将 OCR 识别出的原始文本解析为 英文-中文 词对。
 *
 * 策略：
 * 1. 按行分割
 * 2. 过滤出同时包含英文字母和中文字符的行
 * 3. 尝试多种分隔方式拆分：
 *    a. 制表符 / 多空格 / 分隔符（- – : ：|）
 *    b. 英文字母与中文字符的边界
 */
export function parseOcrText(text: string): OcrPair[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const pairs: OcrPair[] = [];

  for (const line of lines) {
    // 必须同时包含英文和中文才可能是有效词对
    if (!/[a-zA-Z]/.test(line)) continue;
    if (!/[\u4e00-\u9fff\u3400-\u4dbf]/.test(line)) continue;

    let english = '';
    let chinese = '';
    let found = false;

    // 策略 A：按常见分隔符拆分
    const delimiters = [
      '\t',
      '  ',        // 两个以上空格
      ' | ',
      '｜',
      ' - ',
      ' – ',
      ' — ',
      ' : ',
      '：',
      ' ; ',
      '；',
      ' / ',
    ];

    for (const delim of delimiters) {
      if (!line.includes(delim)) continue;
      const parts = line.split(delim);
      if (parts.length < 2) continue;

      // 找第一个英+中配对
      for (let i = 0; i < parts.length - 1; i++) {
        const a = parts[i].trim();
        const b = parts.slice(i + 1).join(delim).trim();
        if (/[a-zA-Z]/.test(a) && /[\u4e00-\u9fff]/.test(b)) {
          english = cleanWord(a);
          chinese = cleanChinese(b);
          found = true;
          break;
        }
        if (/[a-zA-Z]/.test(b) && /[\u4e00-\u9fff]/.test(a)) {
          english = cleanWord(b);
          chinese = cleanChinese(a);
          found = true;
          break;
        }
      }
      if (found) break;
    }

    // 策略 B：按英文→中文的边界拆分
    if (!found) {
      const match = line.match(/^([a-zA-Z][a-zA-Z\s\-'.!?,\d]+?)\s*([\u4e00-\u9fff\u3400-\u4dbf].*)$/);
      if (match) {
        english = cleanWord(match[1]);
        chinese = cleanChinese(match[2]);
        found = true;
      }
    }

    // 策略 C：中文→英文的边界
    if (!found) {
      const match = line.match(/^([\u4e00-\u9fff\u3400-\u4dbf].+?)\s*([a-zA-Z].*)$/);
      if (match) {
        english = cleanWord(match[2]);
        chinese = cleanChinese(match[1]);
        found = true;
      }
    }

    if (english && chinese && !pairs.some(p => p.english === english)) {
      pairs.push({ english, chinese });
    }
  }

  return pairs;
}

/** 清理英文词条：去首尾空白、去两端引号/括号、小写化(展示用原样) */
function cleanWord(s: string): string {
  return s.replace(/^['"（）()［］【】「」『』《》<>［\]{}.…,\s]+/, '')
          .replace(/['"（）()［］【】「」『』《》<>［\]{}.…,\s]+$/, '')
          .trim();
}

/** 清理中文释义 */
function cleanChinese(s: string): string {
  return s.replace(/^[\s\-–—:：;；|｜,，.。、]+/, '')
          .replace(/[\s\-–—:：;；|｜,，.。、]+$/, '')
          .trim();
}

/* ==================== OCR 识别 ==================== */

/**
 * 对一张或多张图片进行 OCR 识别。
 * 返回合并后的识别结果（去重）。
 */
export async function recognizeImages(files: File[]): Promise<OcrResult> {
  const worker = await createWorker('eng+chi_sim');

  try {
    let allRawText = '';

    for (const file of files) {
      const imageUrl = URL.createObjectURL(file);
      const { data } = await worker.recognize(imageUrl);
      allRawText += data.text + '\n';
      URL.revokeObjectURL(imageUrl);
    }

    const pairs = parseOcrText(allRawText);

    return { rawText: allRawText, pairs };
  } finally {
    await worker.terminate();
  }
}
