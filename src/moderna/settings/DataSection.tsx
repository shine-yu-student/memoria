import React, { useRef } from 'react';
import type { MemoriaData } from '../../types';
import { exportAll, importAll } from '../../utils/storage';
import { downloadJSON, readJSONFile } from '../lib/download';
import { Button } from '../ui/Button';
import { useToast } from '../ui/ToastProvider';
import s from './SettingsPanel.module.css';

interface Props {
  onDataChanged: () => void;
}

/**
 * 数据分区：全量导出 / 导入。
 *
 * 行为与经典界面一致（见 src/components/common/JsonImportExport.tsx）：
 * 同理校验 version 字段，同样按 id 合并，同样的统计文案。
 * 区别仅在于用 Toast 替代 alert（alert 阻塞 rAF，会冻住 framer 动画）。
 */
export const DataSection: React.FC<Props> = ({ onDataChanged }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleExport = () => {
    downloadJSON(exportAll(), `memoria-full-backup-${Date.now()}.json`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = (await readJSONFile(file)) as MemoriaData;
      if (typeof data.version !== 'number') {
        toast.error('无效的备份文件格式（缺少 version 字段）');
        return;
      }
      const stats = importAll(data);
      onDataChanged();
      toast.success(
        `导入完成：新增 ${stats.added} 项、合并 ${stats.merged} 项、跳过 ${stats.skipped} 项（已存在的文章未覆盖）。`
      );
    } catch (err) {
      toast.error(`导入失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <h3 className={s.section}>数据</h3>
      <p className={s.desc}>
        将全部文章、词书和句书导出为单个 JSON 文件，或从备份文件恢复。
        导入时按 id 合并：同 id 的文章保留原有内容，同 id 的词书/句书条目合并去重；
        缺失 id 的资源会自动生成新 id 后追加，不会丢失已有数据。
      </p>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="primary" onClick={handleExport}>
          ⬇️ 导出全部数据
        </Button>
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          📂 导入全部数据
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />
    </div>
  );
};
