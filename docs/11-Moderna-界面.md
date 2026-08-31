# 11 — Moderna 界面（实验性新前端）

Moderna 是一套与经典界面并存的实验性现代前端，用户可在两者间随时切换，数据完全共享。
本文档说明它的结构、技术选型、切换机制，以及与经典界面刻意不同的地方。

## 如何切换

| 入口 | 位置 |
|------|------|
| 经典界面 → Moderna | 设置 → 外观 → 实验界面 → `Moderna ✨` |
| Moderna → 经典界面 | 顶栏 ⚙️ → 外观 → 界面版本 → `经典` |

界面版本持久化在 `localStorage['memoria:ui']`（`'classic' | 'modern'`），刷新后保持。
默认值缺失或非法时一律为 `classic`，最坏情况永远是可用的经典界面。

**逃生通道**（新界面崩溃时用）：

1. 新界面的错误边界页上有「切换到经典界面」按钮
2. 访问 `?ui=classic` 可强制切回（优先级高于存储）
3. 控制台执行 `localStorage.setItem('memoria:ui','classic')` 后刷新

## 技术选型

| 项 | 选择 | 理由 |
|---|---|---|
| 动效 | `framer-motion` 13.x | 需要 `AnimatePresence` 进出场、`layout` 自动补间与 `layoutId` 滑动指示器；零依赖手写无法流畅实现退出动画与列表重排 |
| 样式 | CSS Modules + `--m-*` 设计令牌 | Vite 原生支持、零配置；需要 `:hover` / `@keyframes` / 媒体查询，内联 style 对象做不到 |
| 导航 | 常驻 72px 图标导轨 | 去掉经典版悬浮展开所需的 100ms 防抖；指示条用 `layoutId` 在两项间平滑滑动 |

## 目录结构

```
src/
├── uiMode.ts                     界面版本切换（两套界面共用，模块级外部 store）
└── moderna/
    ├── ModernaApp.tsx            根组件：标签切换 + Toast/Confirm 宿主
    ├── ModernaErrorBoundary.tsx  错误边界 +「切换到经典界面」逃生按钮
    ├── styles/tokens.css         --m-* 设计令牌（浅色 + [data-theme="dark"]）
    ├── motion/                   时序预设、变体、MotionRoot、useMotionKit
    ├── shell/                    Shell / TopBar / NavRail / PageShell
    ├── ui/                       Button、Modal、Toast、TextField、Card 等原语
    ├── lib/                      download、sanitizeGuideConfig、guidedStorage 等
    ├── settings/                 ModernSettingsProvider / SettingsPanel
    ├── chinese/                  文章列表 / 详情 / 记忆（八模式）
    └── english/                  词书句书列表 / 详情 / 闪卡记忆
```

目录刻意镜像 `src/components/` 的形状，便于按名字找到经典界面的对应文件。

## 与经典界面的关系

**经典界面被冻结**。`src/components/` 下唯一改动是 `SettingsModal.tsx` 中纯新增的一条
「实验界面」设置行（零删除、零修改）。

新界面只复用：

- `src/types/index.ts` —— 数据模型
- `src/utils/storage.ts` —— localStorage 读写
- `src/utils/splitter.ts` —— 句子切分与分隔符提取
- `src/utils/diff.tsx` —— 字符级差异比对
- `ThemeProvider` —— 主题（跨界面共享）

其余（包括记忆引擎的视图逻辑）在新树内独立实现，以换取经典界面的零回归风险。

### 共享的存储键

| 键 | 说明 |
|---|---|
| `memoria:articles` / `memoria:wordBooks` / `memoria:sentenceBooks` | 业务数据，完全共享 |
| `memoria:theme` | 主题，共享 |
| `memoria:hidePrevious` | 指导记忆「隐藏之前的句子」，共享 |
| `memoria:ui` | **界面版本，仅本功能使用** |
| `memoria:motion` | 动效强度覆盖，仅新界面使用 |
| `memoria:guided:{id}:config` / `:step` / `:inputs` | 指导记忆进度，两套界面共享同一格式 |

> 关键约束：`src/moderna/lib/sanitizeGuideConfig.ts` 是
> `ArticleMemoryView.tsx` 中同名函数的**逐字副本**，`guidedStorage.ts` 写入的键名与键结构
> 也必须与经典界面一致。任何差异都会导致在一套界面写入的配置被另一套判为非法而清空。

## 样式隔离机制

经典界面的全局强样式（下划线输入框、`button:active` 缩放、`*` 通配过渡）会污染新界面，
但 Vite 会把所有 CSS 打进一张样式表，无法「卸载」。解决办法是让旧规则**条件匹配**：

```css
:where([data-ui="classic"]) button { transition: opacity 0.15s, transform 0.1s; }
:where([data-ui="classic"]) input  { border-bottom: 2px solid var(--border-strong); }
:where([data-ui="classic"]) *      { transition: background-color 0.2s, ...; }
```

`data-ui` 写在 `<html>` 上，由 `index.html` 的静态属性 + `<head>` 内联同步脚本在首绘前确定。

**必须用 `:where()`，不能用裸属性选择器**：`:where()` 贡献 0 特异性，
`:where([data-ui="classic"]) button:hover` 计算后仍是 `(0,1,1)`，与改造前逐字节相同，
经典界面的层叠关系完全不变。这也是本次改造中唯一有风险的一步，改动 `index.css` 后
必须逐条核对经典界面外观。

必须隔离的三条规则及其原因：

1. `button { transition: ... transform ... }` —— framer 每帧改写内联 `transform`，
   浏览器再对其做 100ms 补间会让 `whileTap` 发糊、layout 动画抖动
2. `* { transition: background-color .2s, ... }` —— 会让 framer 的颜色动画被二次补间
3. `input:focus { border-color: ... !important }` —— `!important` 能压过内联样式

新令牌一律用 `--m-*` 前缀，与旧的 `--bg-*` / `--text-*` / `--border-*` 零冲突，两套共存。

## 动效

时序集中在 `src/moderna/motion/presets.ts`，是全应用唯一真源。

| 转场 | 变体 | 说明 |
|---|---|---|
| 标签页切换 | `tab` | 同级关系 → 横向 24px |
| 列表→详情→记忆 | `drill` | 层级关系 → 横向 28px + 1.5% 缩放（超过 3% 中文字形会闪烁） |
| 记忆八模式互切 | `swap` | 八个模式是同级，横向滑动会暗示错误层级 → 交叉淡入 + 8px 上浮 |
| 结果页 | `reveal` | 流程情绪落点 → 更慢的弹簧 + 缩放 |
| 弹窗 | `dialog` | 进入用弹簧「落位」，退出用补间求快 |
| 闪卡换张 | `card` | 方向跟随推进方向 |

### 使用 `layout` 的三条硬规则

1. **固定尺寸网格项用 `layout="position"`**，不用 `layout`（避免子元素文字拉伸）
2. **`layout` 与 `whileHover` / `whileTap` 绝不在同一元素上**（会互相打架产生抖动循环）——
   统一用两层：外层 `layout`，内层 hover/tap
3. **`layout` 子树内不能有 `position: fixed` 祖先**（framer 的投影树会测错）——
   故顶栏用 `sticky`，弹窗与 Toast 一律 portal 到 `document.body`

### 无障碍

三层 `prefers-reduced-motion` 支持：

1. 全局 `<MotionConfig reducedMotion>` 自动跳过 transform/layout 动画
2. `useMotionKit()` 在 reduced 下把方向型变体换成纯透明度过渡（保留"往哪走"的线索）
3. 所有 CSS transition 都包在 `@media (prefers-reduced-motion: no-preference)` 内

另在设置 → 外观提供手动覆盖（`memoria:motion` = `system` / `full` / `reduced`）。

## 与经典界面刻意不同的行为

| 项 | 经典界面 | Moderna | 原因 |
|---|---|---|---|
| 提示/确认 | `alert()` / `confirm()` | Toast / ConfirmDialog | `alert` 阻塞主线程即阻塞 rAF，在 alert 打开期间 framer 动画无法推进，会卡在半途 |
| 填空输入框 | `rows={1}` + `overflow:hidden` | 随内容增高 | 旧行为会把长句裁掉，是真 bug |
| 词条编辑 | `position:fixed` 弹层 + 手写视口碰撞数学 | 就地内联展开（framer `layout`） | 删掉约 35 行几何代码与 250ms `animationend` 兜底 |
| 侧栏 | 56→180px 悬浮展开 | 常驻 72px | 「侧栏位置」「退出展开方式」两个设置在新界面不再暴露 |
| 记忆页退出 | 仅按钮 | 额外支持 `Esc` 退一级 | 增量 |

**刻意保持一致、不得改动**：

- 语文批改：`(输入).trim() === (正确).trim()`，仅 trim，区分大小写，不做标点归一化
- 英语闪卡批改：`trim().toLowerCase()` 比较（与语文刻意不同）
- 随机空格数：`Math.max(1, Math.ceil(n * Math.min(1, Math.max(0.01, ratio))))`，钳制顺序不可改
- 指定记忆的 Shift 范围选择只增不减
- 闪卡重测间隔 3–5 张；`done` 只计首次答对（故进度条可能停在 100% 以下）
- 指导记忆的 AI 提示词模板逐字照抄（用户可能已收藏）

## 已知取舍

- **产物体积**：framer-motion 使 gzip 增加约 65KB，且经典界面也会加载（未做代码分割）。
  若要优化，可对 `ModernaApp` 使用 `React.lazy` + `Suspense`；但 `layout` / `layoutId`
  需要 `domMax` 特性包，改用 `LazyMotion` 省不下多少。
- **切换会结束进行中的记忆会话**：两套界面是互斥的两棵树，切换即整树卸载。
- 本项目没有图标库，两套界面都沿用 emoji；新界面将其包进固定 `1.25em` 的
  inline-block 以对齐基线。
