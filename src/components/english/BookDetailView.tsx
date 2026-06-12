import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { WordBook, SentenceBook, WordEntry, SentenceEntry } from '../../types';
import { uid } from '../../types';
import {
  addWordBook, updateWordBook, updateSentenceBook,
  deleteWordBook, deleteSentenceBook,
} from '../../utils/storage';
import { Modal } from '../common/Modal';
import { SingleExportBtn } from '../common/JsonImportExport';
import { recognizeImages, type OcrPair } from '../../utils/ocr';

/* ==================== 统一条目类型 ==================== */

interface EntryItem {
  id: string;
  english: string;
  chinese: string;
}

type BookType = 'word' | 'sentence';

/* ==================== 辅助 ==================== */

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ==================== Props ==================== */

interface Props {
  /** 词书或句书对象 */
  book: WordBook | SentenceBook;
  bookType: BookType;
  onBack: () => void;
  onDataChange: () => void;
}

/* ==================== 组件 ==================== */

export const BookDetailView: React.FC<Props> = ({ book: initialBook, bookType, onBack, onDataChange }) => {
  const [book, setBook] = useState<WordBook | SentenceBook>(initialBook);
  const [entries, setEntries] = useState<EntryItem[]>(() =>
    'entries' in initialBook ? initialBook.entries.map(e => ({ id: e.id, english: e.english, chinese: e.chinese })) : []
  );

  // Modal 状态
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EntryItem | null>(null);

  // OCR 导入状态
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResultModalOpen, setOcrResultModalOpen] = useState(false);
  const [ocrPairs, setOcrPairs] = useState<OcrPair[]>([]);
  const [ocrImageNames, setOcrImageNames] = useState<string>('');

  // JSON 导入状态
  const [jsonImportModalOpen, setJsonImportModalOpen] = useState(false);
  const [jsonRawText, setJsonRawText] = useState('');
  const [jsonParsedEntries, setJsonParsedEntries] = useState<{ english: string; chinese: string }[]>([]);
  const [jsonParseError, setJsonParseError] = useState('');

  // 表单状态
  const [newEn, setNewEn] = useState('');
  const [newZh, setNewZh] = useState('');
  const [editEn, setEditEn] = useState('');
  const [editZh, setEditZh] = useState('');
  const [renameTitle, setRenameTitle] = useState('');

  const bookLabel = bookType === 'word' ? '词书' : '句书';
  const entryLabel = bookType === 'word' ? '词' : '句';

  /** 持久化到 storage */
  const persist = useCallback((updated: WordBook | SentenceBook) => {
    if (bookType === 'word') {
      updateWordBook(updated as WordBook);
    } else {
      updateSentenceBook(updated as SentenceBook);
    }
    setBook(updated);
    setEntries('entries' in updated ? updated.entries.map(e => ({ id: e.id, english: e.english, chinese: e.chinese })) : []);
  }, [bookType]);

  /** 添加条目 */
  const handleAdd = () => {
    if (!newEn.trim() || !newZh.trim()) { alert(`请输入${entryLabel}的英文和中文`); return; }
    const newEntry = { id: uid(), english: newEn.trim(), chinese: newZh.trim() };
    const updated = {
      ...book,
      entries: [...('entries' in book ? book.entries : []), newEntry],
    };
    persist(updated);
    setNewEn('');
    setNewZh('');
    setAddModalOpen(false);
    onDataChange();
  };

  /** 编辑条目 */
  const handleEdit = () => {
    if (!editingEntry || !editEn.trim() || !editZh.trim()) return;
    const updated = {
      ...book,
      entries: ('entries' in book ? book.entries : []).map(e =>
        e.id === editingEntry.id ? { ...e, english: editEn.trim(), chinese: editZh.trim() } : e
      ),
    };
    persist(updated);
    setEditModalOpen(false);
    setEditingEntry(null);
    onDataChange();
  };

  /** 删除条目 */
  const handleDeleteEntry = (entryId: string) => {
    if (!confirm(`确定删除该${entryLabel}？`)) return;
    const updated = {
      ...book,
      entries: ('entries' in book ? book.entries : []).filter(e => e.id !== entryId),
    };
    persist(updated);
    onDataChange();
  };

  /** 删除整个书 */
  const handleDeleteBook = () => {
    if (!confirm(`确定删除整个${bookLabel}「${book.title}」？此操作不可撤销。`)) return;
    if (bookType === 'word') {
      deleteWordBook(book.id);
    } else {
      deleteSentenceBook(book.id);
    }
    onDataChange();
    onBack();
  };

  /** 重命名 */
  const handleRename = () => {
    if (!renameTitle.trim()) { alert('名称不能为空'); return; }
    const updated = { ...book, title: renameTitle.trim() };
    persist(updated);
    setRenameModalOpen(false);
    onDataChange();
  };

  /** 导出当前书 */
  const handleExport = () => {
    downloadJSON(book, `${book.title}.json`);
  };

  /** 打开编辑弹窗 */
  const openEdit = (entry: EntryItem) => {
    setEditingEntry(entry);
    setEditEn(entry.english);
    setEditZh(entry.chinese);
    setEditModalOpen(true);
  };

  /** 打开重命名弹窗 */
  const openRename = () => {
    setRenameTitle(book.title);
    setRenameModalOpen(true);
  };

  const isWordBook = bookType === 'word';

  /* ===== JSON 导入 ===== */

  const openJsonImport = () => {
    setJsonRawText('');
    setJsonParsedEntries([]);
    setJsonParseError('');
    setJsonImportModalOpen(true);
  };

  const handleJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setJsonRawText(reader.result as string);
    reader.readAsText(file);
  };

  const parseJsonEntries = () => {
    setJsonParseError('');
    setJsonParsedEntries([]);

    let data: unknown;
    try {
      data = JSON.parse(jsonRawText);
    } catch {
      setJsonParseError('JSON 格式解析失败，请检查语法。');
      return;
    }

    let entries: { english: string; chinese: string }[] = [];

    if (Array.isArray(data)) {
      // 纯数组格式 [{english, chinese}]
      entries = data
        .filter((item: any) => item && (item.english || item.en) && (item.chinese || item.zh || item.meaning))
        .map((item: any) => ({
          english: (item.english || item.en || '').trim(),
          chinese: (item.chinese || item.zh || item.meaning || '').trim(),
        }));
    } else if (data && typeof data === 'object') {
      const obj = data as Record<string, any>;
      if (obj.entries && Array.isArray(obj.entries)) {
        // 完整词书/句书格式 {title, entries}
        entries = obj.entries
          .filter((item: any) => item && (item.english || item.en) && (item.chinese || item.zh || item.meaning))
          .map((item: any) => ({
            english: (item.english || item.en || '').trim(),
            chinese: (item.chinese || item.zh || item.meaning || '').trim(),
          }));
      } else {
        setJsonParseError('JSON 中未找到有效的 entries 数组。');
        return;
      }
    } else {
      setJsonParseError('无法识别的 JSON 格式。');
      return;
    }

    if (entries.length === 0) {
      setJsonParseError('未能从 JSON 中提取出有效的词条。');
      return;
    }

    setJsonParsedEntries(entries);
  };

  const handleJsonImportConfirm = () => {
    if (jsonParsedEntries.length === 0) return;
    const newEntries = jsonParsedEntries.map(p => ({ id: uid(), english: p.english, chinese: p.chinese }));
    const updated = {
      ...book,
      entries: [...('entries' in book ? book.entries : []), ...newEntries],
    };
    persist(updated);
    setJsonImportModalOpen(false);
    setJsonRawText('');
    setJsonParsedEntries([]);
    onDataChange();
  };

  /* ===== OCR 导入 ===== */

  const openOcrUpload = () => {
    setOcrModalOpen(true);
    setOcrImageNames('');
  };

  const handleOcrFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setOcrImageNames(fileList.map(f => f.name).join('、'));
    setOcrLoading(true);

    try {
      const result = await recognizeImages(fileList);
      setOcrPairs(result.pairs);
      setOcrLoading(false);
      setOcrModalOpen(false);
      setOcrResultModalOpen(true);
    } catch (err) {
      setOcrLoading(false);
      alert(`OCR 识别失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  const handleOcrConfirm = () => {
    if (ocrPairs.length === 0) return;
    const newEntries = ocrPairs.map(p => ({ id: uid(), english: p.english, chinese: p.chinese }));
    const updated = {
      ...book,
      entries: [...('entries' in book ? book.entries : []), ...newEntries],
    };
    persist(updated);
    setOcrResultModalOpen(false);
    setOcrPairs([]);
    onDataChange();
  };

  return (
    <div style={styles.page}>
      <div style={styles.stickyHeader}>
        <div style={styles.opaqueRegion}>
          <div style={styles.headerCard}>
            <div style={styles.topBar}>
              <button style={styles.backBtn} onClick={onBack}>← 返回</button>
              <h1 style={styles.bookTitle}>{book.title}</h1>
              <span style={styles.badge}>{isWordBook ? '📗 词书' : '📘 句书'}</span>
            </div>
            <div style={styles.actionBar}>
              <button style={styles.primaryBtn} onClick={() => { setNewEn(''); setNewZh(''); setAddModalOpen(true); }}>
                ＋ 添加{entryLabel}
              </button>
              <button style={styles.outlineBtn} onClick={handleExport}>⬇️ 导出</button>
              <button style={styles.outlineBtn} onClick={openRename}>✏️ 重命名</button>
              <button style={styles.ocrBtn} onClick={openOcrUpload}>📷 从图片导入</button>
              <button style={styles.jsonBtn} onClick={openJsonImport}>📋 从 JSON 导入</button>
              <button style={styles.dangerBtn} onClick={handleDeleteBook}>🗑️ 删除</button>
            </div>
          </div>
        </div>
      </div>

      {/* 条目列表容器 */}
      <div style={styles.cardContainer}>
        <div style={styles.cardGrid}>
          {entries.map(entry => (
          <div key={entry.id} style={styles.entryCard}>
            <div style={styles.entryContent}>
              <div style={styles.entryEn}>{entry.english}</div>
              <div style={styles.entryZh}>{entry.chinese}</div>
            </div>
            <div style={styles.entryActions}>
              <button style={styles.smallBtn} onClick={() => openEdit(entry)}>✏️</button>
              <button style={styles.smallDangerBtn} onClick={() => handleDeleteEntry(entry.id)}>🗑️</button>
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <p style={styles.empty}>暂无{entryLabel}，点击上方"添加{entryLabel}"开始添加。</p>
        )}
      </div>
      </div>
      <Modal open={addModalOpen} title={`添加${entryLabel}`} onClose={() => setAddModalOpen(false)}>
        <div style={styles.formGroup}>
          <label style={styles.label}>英文</label>
          <input style={styles.input} placeholder={`输入${isWordBook ? '单词' : '句子'}…`}
            value={newEn} onChange={e => setNewEn(e.target.value)}
            autoFocus onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>中文</label>
          <input style={styles.input} placeholder="输入中文翻译…"
            value={newZh} onChange={e => setNewZh(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        </div>
        <div style={styles.formActions}>
          <button style={styles.cancelBtn} onClick={() => setAddModalOpen(false)}>取消</button>
          <button style={styles.confirmBtn} onClick={handleAdd}>确认添加</button>
        </div>
      </Modal>

      {/* ===== 编辑弹窗 ===== */}
      <Modal open={editModalOpen} title={`编辑${entryLabel}`} onClose={() => setEditModalOpen(false)}>
        <div style={styles.formGroup}>
          <label style={styles.label}>英文</label>
          <input style={styles.input} value={editEn} onChange={e => setEditEn(e.target.value)}
            autoFocus onKeyDown={e => e.key === 'Enter' && handleEdit()} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>中文</label>
          <input style={styles.input} value={editZh} onChange={e => setEditZh(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEdit()} />
        </div>
        <div style={styles.formActions}>
          <button style={styles.cancelBtn} onClick={() => setEditModalOpen(false)}>取消</button>
          <button style={styles.confirmBtn} onClick={handleEdit}>确认修改</button>
        </div>
      </Modal>

      {/* ===== OCR 上传弹窗 ===== */}
      <Modal open={ocrModalOpen} title="📷 从图片导入" onClose={() => setOcrModalOpen(false)}>
        {ocrLoading ? (
          <div style={styles.ocrLoading}>
            <div style={styles.spinner}></div>
            <p>正在识别图片中的文字，请稍候…</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>首次使用会下载语言包，可能需要额外时间</p>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              选择包含单词和中文释义的图片，系统将自动识别并提取其中的内容。
              支持 .png、.jpg、.jpeg 格式，可多选。
            </p>
            <label style={styles.fileUploadLabel}>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                multiple
                style={{ display: 'none' }}
                onChange={handleOcrFiles}
              />
              <span style={styles.fileUploadBtn}>📂 选择图片</span>
            </label>
            {ocrImageNames && (
              <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text-description)' }}>
                已选择：{ocrImageNames}
              </p>
            )}
          </>
        )}
      </Modal>

      {/* ===== OCR 结果确认弹窗 ===== */}
      <Modal open={ocrResultModalOpen} title="📋 识别结果" onClose={() => setOcrResultModalOpen(false)}>
        {ocrPairs.length === 0 ? (
          <p style={{ color: 'var(--text-red)', textAlign: 'center', padding: 20 }}>
            未能从图片中识别出有效的单词-中文对应关系，请检查图片质量后重试。
          </p>
        ) : (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
              识别到 <strong>{ocrPairs.length}</strong> 组单词-中文对应关系：
            </p>
            <div style={styles.ocrResultList}>
              {ocrPairs.map((pair, idx) => (
                <div key={idx} style={styles.ocrResultItem}>
                  <span style={styles.ocrResultEn}>{pair.english}</span>
                  <span style={styles.ocrResultDivider}>—</span>
                  <span style={styles.ocrResultZh}>{pair.chinese}</span>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
              确认后将全部添加至当前{bookLabel}「{book.title}」。
            </p>
            <div style={styles.formActions}>
              <button style={styles.cancelBtn} onClick={() => setOcrResultModalOpen(false)}>取消</button>
              <button style={styles.confirmBtn} onClick={handleOcrConfirm}>
                确认导入 {ocrPairs.length} 项
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ===== JSON 导入弹窗 ===== */}
      <Modal open={jsonImportModalOpen} title="📋 从 JSON 导入" onClose={() => setJsonImportModalOpen(false)}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>
          上传 JSON 文件或在下方粘贴 JSON，系统将提取其中的词条添加到当前{bookLabel}。
          格式：完整词书 <code>{`{title, entries}`}</code> 或纯数组 <code>{`[{english, chinese}]`}</code>。
        </p>

        <label style={styles.fileUploadLabel}>
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleJsonFile} />
          <span style={styles.fileUploadBtn}>📂 上传 JSON 文件</span>
        </label>

        <div style={{ margin: '12px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>— 或直接粘贴 —</div>

        <textarea
          style={styles.jsonTextarea}
          rows={8}
          placeholder='[
  {"english": "example", "chinese": "例子"},
  {"english": "hello", "chinese": "你好"}
]'
          value={jsonRawText}
          onChange={e => setJsonRawText(e.target.value)}
        />

        {jsonParseError && (
          <p style={{ color: 'var(--text-red)', fontSize: 14, marginTop: 8 }}>⚠ {jsonParseError}</p>
        )}

        {jsonParsedEntries.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
              解析到 <strong>{jsonParsedEntries.length}</strong> 条{entryLabel}：
            </p>
            <div style={styles.ocrResultList}>
              {jsonParsedEntries.map((p, i) => (
                <div key={i} style={styles.ocrResultItem}>
                  <span style={styles.ocrResultEn}>{p.english}</span>
                  <span style={styles.ocrResultDivider}>—</span>
                  <span style={styles.ocrResultZh}>{p.chinese}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={styles.formActions}>
          <button style={styles.cancelBtn} onClick={() => setJsonImportModalOpen(false)}>取消</button>
          <button style={styles.parseBtn} onClick={parseJsonEntries} disabled={!jsonRawText.trim()}>
            🔍 解析并预览
          </button>
          <button
            style={styles.confirmBtn}
            onClick={handleJsonImportConfirm}
            disabled={jsonParsedEntries.length === 0}
          >
            确认导入 {jsonParsedEntries.length > 0 ? `(${jsonParsedEntries.length} 项)` : ''}
          </button>
        </div>
      </Modal>

      {/* ===== 重命名弹窗 ===== */}
      <Modal open={renameModalOpen} title={`重命名${bookLabel}`} onClose={() => setRenameModalOpen(false)}>
        <div style={styles.formGroup}>
          <label style={styles.label}>名称</label>
          <input style={styles.input} value={renameTitle} onChange={e => setRenameTitle(e.target.value)}
            autoFocus onKeyDown={e => e.key === 'Enter' && handleRename()} />
        </div>
        <div style={styles.formActions}>
          <button style={styles.cancelBtn} onClick={() => setRenameModalOpen(false)}>取消</button>
          <button style={styles.confirmBtn} onClick={handleRename}>确认重命名</button>
        </div>
      </Modal>
    </div>
  );
};

/* ==================== 样式 ==================== */

const styles: Record<string, React.CSSProperties> = {
  /* 顶部区域 */
  stickyHeader: {
    flexShrink: 0,
  },
  opaqueRegion: {
    background: 'var(--bg-page)',
    padding: '12px 0 8px 0',
  },
  headerCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 12,
    padding: '14px 18px',
    border: '1px solid var(--border-default)',
    boxShadow: 'var(--shadow-header)',
  },
  /* 顶部栏 */
  topBar: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '0 0 12px 0', borderBottom: '1px solid var(--border-default)', marginBottom: 16,
  },
  backBtn: {
    padding: '6px 14px', fontSize: 14, backgroundColor: 'var(--bg-hover)',
    border: '1px solid var(--border-default)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)',
  },
  bookTitle: { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', flex: 1, margin: 0 },
  badge: { fontSize: 14, color: 'var(--text-description)', backgroundColor: 'var(--bg-hover)', padding: '4px 12px', borderRadius: 12 },

  /* 操作栏 */
  actionBar: {
    display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20,
  },
  page: {
    maxWidth: 900, margin: '0 auto', padding: '16px',
    height: 'calc(100vh - 56px)',
    display: 'flex', flexDirection: 'column',
  },
  primaryBtn: {
    padding: '10px 20px', fontSize: 15, fontWeight: 600,
    backgroundColor: 'var(--bg-primary)', color: 'var(--text-on-primary)', border: 'none', borderRadius: 8, cursor: 'pointer',
  },
  outlineBtn: {
    padding: '10px 20px', fontSize: 15,
    backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: 8, cursor: 'pointer',
  },
  dangerBtn: {
    padding: '10px 20px', fontSize: 15,
    backgroundColor: 'var(--bg-warning)', color: 'var(--text-red)', border: '1px solid var(--border-red)', borderRadius: 8, cursor: 'pointer',
  },
  ocrBtn: {
    padding: '10px 20px', fontSize: 15,
    backgroundColor: 'var(--bg-ocr)', color: 'var(--text-ocr)', border: '1px solid var(--border-ocr)', borderRadius: 8, cursor: 'pointer',
  },
  jsonBtn: {
    padding: '10px 20px', fontSize: 15,
    backgroundColor: 'var(--bg-json)', color: 'var(--text-json)', border: '1px solid var(--border-json)', borderRadius: 8, cursor: 'pointer',
  },

  /* 卡片容器（略宽于标题，圆角矩形；填充剩余高度，内部滚动） */
  cardContainer: {
    marginLeft: -16,
    marginRight: -16,
    marginBottom: 16,
    padding: '16px 16px 8px',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 16,
    border: '1px solid var(--border-default)',
    boxShadow: 'var(--shadow-header)',
    flex: 1,
    overflowY: 'auto',
  },

  /* 卡片网格 */
  cardGrid: {
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  entryCard: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: '14px 18px',
    border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-card)',
  },
  entryContent: { display: 'flex', flexDirection: 'column', gap: 4 },
  entryEn: { fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' },
  entryZh: { fontSize: 14, color: 'var(--text-description)' },
  entryActions: { display: 'flex', gap: 6 },
  smallBtn: {
    padding: '4px 10px', fontSize: 15, backgroundColor: 'var(--bg-hover)',
    border: '1px solid var(--border-default)', borderRadius: 6, cursor: 'pointer',
  },
  smallDangerBtn: {
    padding: '4px 10px', fontSize: 15, backgroundColor: 'var(--bg-danger)',
    border: '1px solid var(--border-red)', borderRadius: 6, cursor: 'pointer',
  },
  empty: { textAlign: 'center', color: 'var(--text-muted)', padding: 40 },

  /* 表单 */
  formGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 12px', fontSize: 15,
    border: '1px solid var(--border-strong)', borderRadius: 8, boxSizing: 'border-box',
  },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelBtn: {
    padding: '8px 20px', fontSize: 15, backgroundColor: 'var(--bg-hover)',
    border: '1px solid var(--border-default)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)',
  },
  confirmBtn: {
    padding: '8px 20px', fontSize: 15, backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-on-primary)', border: 'none', borderRadius: 6, cursor: 'pointer',
  },

  /* OCR */
  ocrLoading: {
    textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)',
  },
  spinner: {
    width: 40, height: 40, border: '4px solid var(--border-default)',
    borderTopColor: 'var(--border-green)', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 16px',
  },
  fileUploadLabel: { cursor: 'pointer' },
  fileUploadBtn: {
    display: 'inline-block', padding: '10px 24px', fontSize: 15,
    backgroundColor: 'var(--bg-primary)', color: 'var(--text-on-primary)', border: 'none', borderRadius: 8, cursor: 'pointer',
  },
  jsonTextarea: {
    width: '100%', padding: '10px 12px', fontSize: 13, fontFamily: 'monospace',
    border: '1px solid var(--border-strong)', borderRadius: 8, resize: 'vertical',
    boxSizing: 'border-box', lineHeight: 1.5,
  },
  parseBtn: {
    padding: '8px 20px', fontSize: 15, backgroundColor: 'var(--bg-hover)',
    border: '1px solid var(--border-strong)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)',
  },
  ocrResultList: {
    maxHeight: 300, overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 6,
    backgroundColor: 'var(--bg-page)', borderRadius: 8, padding: 12,
  },
  ocrResultItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '6px 8px', borderRadius: 6,
    backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)',
  },
  ocrResultEn: { fontWeight: 600, color: 'var(--text-primary)', fontSize: 15 },
  ocrResultDivider: { color: 'var(--text-muted)', fontSize: 14 },
  ocrResultZh: { color: 'var(--text-description)', fontSize: 14 },
};
