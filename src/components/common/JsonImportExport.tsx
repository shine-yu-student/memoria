import React, { useRef } from 'react';
import type { Article, WordBook, SentenceBook, MemoriaData } from '../../types';
import { importAll, exportAll } from '../../utils/storage';

interface JsonImportExportProps {
  onImport: () => void;
}

/**
 * 通用 JSON 导入/导出组件。
 * 支持单个资源导出/导入和全量导出/导入。
 */

/* ========= 工具函数 ========= */

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function readJSONFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result as string));
      } catch (e) {
        reject(new Error('JSON 解析失败'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

/* ========= 组件 ========= */

export const JsonImportExport: React.FC<JsonImportExportProps> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** 导出全部 */
  const handleExportAll = () => {
    const data = exportAll();
    downloadJSON(data, `memoria-full-backup-${Date.now()}.json`);
  };

  /** 导入全部 */
  const handleImportAll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = (await readJSONFile(file)) as MemoriaData;
      if (!data.version) {
        alert('无效的备份文件格式');
        return;
      }
      importAll(data);
      onImport();
      alert('✅ 导入成功！（按标题合并，同名词书/句书的条目已合并去重）');
    } catch (err) {
      alert(`导入失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📦 全量导入 / 导出</h2>
      <p style={styles.desc}>
        将系统中的全部文章、词书和句书导出为单个 JSON 文件，或从备份文件恢复。
        导入时按标题合并：同名的词书/句书条目会合并并去重，不会丢失已有数据。
      </p>

      <div style={styles.actions}>
        <button style={styles.btn} onClick={handleExportAll}>
          ⬇️ 导出全部数据
        </button>

        <label style={{ ...styles.btn, ...styles.importBtn }}> 
          📂 导入全部数据
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportAll}
          />
        </label>
      </div>
    </div>
  );
};

/* ========= 单个资源导入导出 ========= */

interface SingleExportProps {
  label: string;
  data: unknown;
  filename: string;
}

export const SingleExportBtn: React.FC<SingleExportProps> = ({ label, data, filename }) => (
  <button
    style={sBtn}
    onClick={() => downloadJSON(data, filename)}
  >
    ⬇️ 导出 {label}
  </button>
);

interface SingleImportProps {
  label: string;
  onData: (data: unknown) => void;
}

export const SingleImportBtn: React.FC<SingleImportProps> = ({ label, onData }) => {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await readJSONFile(file);
      onData(data);
    } catch (err) {
      alert(`导入失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      if (ref.current) ref.current.value = '';
    }
  };

  return (
    <label style={{ ...sBtn, ...sImportBtn }}>
      📂 导入 {label}
      <input ref={ref} type="file" accept=".json" style={{ display: 'none' }} onChange={handleChange} />
    </label>
  );
};

/* ========= 样式 ========= */

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 12,
    padding: 24,
    boxShadow: 'var(--shadow-card)',
    border: '1px solid var(--border-default)',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 8,
  },
  desc: {
    color: 'var(--text-description)',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  btn: {
    padding: '10px 20px',
    fontSize: 15,
    border: '1px solid var(--border-strong)',
    borderRadius: 8,
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  importBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
};

const sBtn: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 14,
  border: '1px solid var(--border-strong)',
  borderRadius: 6,
  backgroundColor: 'var(--bg-card)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
};

const sImportBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
};
