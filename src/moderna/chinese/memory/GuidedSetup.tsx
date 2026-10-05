import React from 'react';
import type { Article } from '../../../types';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/ToastProvider';
import { readJSONFile } from '../../lib/download';
import type { ArticleMemoryState } from './useArticleMemory';
import s from './ArticleMemory.module.css';

interface Props {
  article: Article;
  state: ArticleMemoryState;
}

/**
 * 指导记忆配置页。
 *
 * AI 提示词模板是既有的对外契约 —— 用户可能已收藏该模板，
 * 改动会破坏他们的工作流。
 */
export const GuidedSetup: React.FC<Props> = ({ article, state }) => {
  const toast = useToast();

  const prompt = `请为以下文章生成一个"指导记忆"的JSON配置文件。该文件用于帮助用户逐步记忆文章，适合初次接触文言文的学习者。

文章标题：${article.title}
文章内容：
${article.content}

句子列表（已按标点切分）：
${state.sentences.map((s, i) => `  ${i}: ${s}`).join('\n')}

请按以下JSON格式输出，每个step包含一条提示文本(hint)和该步骤要记忆的句子索引(sentenceIndices)。步骤应由易到难，逐步增加句子数量。

{"steps": [{"hint": "提示文本", "sentenceIndices": [0, 1]}]}`;

  const handleCopy = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.select();
    navigator.clipboard?.writeText(el.value);
    toast.success('提示词已复制到剪贴板');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ok = state.importGuidedConfig(await readJSONFile(file));
      if (!ok) {
        toast.error(
          '无效的配置格式：需要包含 steps 数组，每步含字符串 hint 和由非负整数组成的 sentenceIndices'
        );
        return;
      }
      toast.success('配置导入成功');
      state.setMode('guided');
    } catch {
      toast.error('JSON 解析失败');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <>
      <div className={s.card} style={{ marginBottom: 16 }}>
        <h3 className={s.sectionTitle}>🤖 使用 AI 生成配置</h3>
        <p className={s.hint}>
          将以下提示词提供给外部大模型（如 ChatGPT、Claude 等），它将会生成指导记忆配置文件。
        </p>
        <textarea
          className={s.guidedPrompt}
          rows={10}
          readOnly
          value={prompt}
          onClick={handleCopy}
        />
        <p style={{ fontSize: 12, color: 'var(--m-text-muted)', marginTop: 6, marginBottom: 0 }}>
          点击文本框自动复制到剪贴板
        </p>
      </div>

      <div className={s.card}>
        <h3 className={s.sectionTitle}>📂 导入配置文件</h3>
        <p className={s.hint}>
          导入指导记忆 JSON 配置文件。格式：
          <code>{'{ "steps": [{ "hint": "提示文本", "sentenceIndices": [0, 1] }] }'}</code>
        </p>
        <div className={s.row}>
          <Button variant="primary" onClick={() => document.getElementById('guided-config-input')?.click()}>
            📂 选择 JSON 配置文件
          </Button>
          {state.guidedConfig ? (
            <>
              <Button variant="secondary" onClick={() => state.setMode('guided')}>
                继续上次进度（{state.guidedConfig.steps.length} 步）
              </Button>
              <Button variant="dangerGhost" onClick={state.clearGuidedConfig}>
                清除配置
              </Button>
            </>
          ) : null}
        </div>
        <input
          id="guided-config-input"
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
      </div>
    </>
  );
};
