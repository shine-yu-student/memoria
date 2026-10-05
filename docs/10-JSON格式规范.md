# 10 — JSON 格式规范

## 概述

Memoria 中的所有数据均支持以 JSON 格式导入和导出。本文档定义各资源类型的 JSON 结构。

---

## 词书 / 句书（WordBook / SentenceBook）

### 完整格式（导出/导入）

```json
{
  "id": "a1b2c3d4...",
  "title": "四级词汇",
  "entries": [
    {
      "id": "e1f2g3h4...",
      "english": "abandon",
      "chinese": "放弃"
    },
    {
      "id": "i5j6k7l8...",
      "english": "ability",
      "chinese": "能力"
    }
  ],
  "createdAt": 1700000000000
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 否 | 唯一标识。导入时不填则自动生成 |
| `title` | string | 是 | 词书/句书名称 |
| `entries` | array | 是 | 词条/句条列表 |
| `createdAt` | number | 否 | 创建时间戳 |

### entries 条目格式

```json
{
  "id": "e1f2g3h4...",
  "english": "abandon",
  "chinese": "放弃"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 否 | 唯一标识。导入时不填则自动生成 |
| `english` | string | 是 | 英文单词/短语/句子（字段名也支持 `en`） |
| `chinese` | string | 是 | 中文释义/翻译（字段名也支持 `zh`、`meaning`） |

---

## 简写格式（仅导入）

在"从 JSON 导入"功能中，除完整格式外，还支持以下简写格式：

### 纯 entries 数组

```json
[
  {
    "english": "abandon",
    "chinese": "放弃"
  },
  {
    "english": "ability",
    "chinese": "能力"
  }
]
```

### 简写字段名

导入时 `english`、`en` 均可作为英文字段；`chinese`、`zh`、`meaning` 均可作为中文字段：

```json
[
  { "en": "hello", "zh": "你好" },
  { "english": "world", "meaning": "世界" }
]
```

---

## 文章（Article）

```json
{
  "id": "a1b2c3d4...",
  "title": "荷塘月色",
  "content": "曲曲折折的荷塘上面，弥望的是田田的叶子……",
  "sentences": [
    "曲曲折折的荷塘上面",
    "弥望的是田田的叶子"
  ],
  "createdAt": 1700000000000
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 否 | 唯一标识。导入时不填则自动生成 |
| `title` | string | 否 | 文章标题。缺失时导入兜底为"未命名文章" |
| `content` | string | 是 | 文章全文 |
| `sentences` | array | 否 | 切分后的句子列表。不填则导入时自动按标点切分 |
| `createdAt` | number | 否 | 创建时间戳 |

---

## 全量备份格式

```json
{
  "version": 1,
  "articles": [ ... ],
  "wordBooks": [ ... ],
  "sentenceBooks": [ ... ],
  "exportedAt": 1700000000000
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `version` | number | 是 | 格式版本号（当前为 1） |
| `articles` | array | 否 | 文章列表 |
| `wordBooks` | array | 否 | 词书列表 |
| `sentenceBooks` | array | 否 | 句书列表 |
| `exportedAt` | number | 否 | 导出时间戳 |

---

## 导入行为

### 从 JSON 导入到词书/句书（新增模式）

- 只从 JSON 中提取 `entries` 数组
- 提取的词条会**追加**到当前词书/句书中
- 不会覆盖或删除已有内容
- 自动为词条生成新的 `id`

### 全量导入（按 id 合并模式）

- **不会清空**已有内容，导入前不清空任何数据
- **文章**：按 id 匹配，同 id 已存在则跳过（保留原有）
- **词书/句书**：按 id 匹配，同 id 合并条目（按 `english` 字段去重）
- **缺失 id** 的文章/词书/句书导入时自动生成新 id 后追加；同一份无 id 文件重复导入会产生新副本
- 标题缺失或非法的词书/句书资源将被跳过

### 单资源导入 / 导出

- 单资源导出按钮位于文章编辑页（`⬇️ 导出`）
- 词书/句书详情页支持「📋 从 JSON 导入」：提取 JSON 中的 `entries` 数组（兼容完整格式与简写格式），**追加**到当前书，不覆盖、不删除已有内容，自动为词条生成新 `id`
