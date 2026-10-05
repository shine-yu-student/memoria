# 11 — 界面层

界面层位于 `src/moderna/`，是应用唯一的前端实现。本文档说明它的入口层级、目录结构、
设计令牌、动效系统、设置面板，以及与共享数据层的关系。

## 入口与挂载

```tsx
// src/App.tsx
<ThemeProvider>
  <ModernaErrorBoundary>
    <ModernaApp dataVersion={dataVersion} onDataChanged={handleDataChanged} />
  </ModernaErrorBoundary>
</ThemeProvider>
```

- `src/main.tsx` 把 `App` 挂到 `#root`，并引入 `src/index.css`（仅基础重置）。
- `dataVersion` 是数据版本计数器：数据变更时递增，各模块据此重新加载数据，**不重挂载组件**，
  避免全量导入等操作打断进行中的记忆会话或未保存的编辑。
- `ThemeProvider`（`src/moderna/lib/ThemeProvider.tsx`）把 `light` / `dark` 写到
  `<html data-theme>`，并持久化到 `localStorage['memoria:theme']`，供 `tokens.css` 的深色选择器使用。
- `ModernaErrorBoundary` 在渲染崩溃时展示不依赖崩溃组件树的兜底页：错误信息 +
  「重试」/「刷新页面」两个按钮，并提示数据保存在本地。兜底页使用内联样式，坏情况下仍可显示与操作。
- `ModernaApp` 内部层级为
  `ModernSettingsProvider → MotionRoot → ToastProvider → ConfirmProvider → Shell（TopBar + NavRail + 当前标签页）+ SettingsPanel`。
  Toast 与 Confirm 刻意放在所有 `AnimatePresence` 边界之外，否则关闭一个 Toast 会卷入页面转场动画。

### 标签页

只有两个标签：语文（`chinese`）与英语（`english`），顺序由 `ModernaApp` 的 `TAB_ORDER` 决定。
切换方向由前后标签在 `TAB_ORDER` 中的相对位置推导，交给 `tab` 变体做横向转场。

## 技术选型

| 项 | 选择 | 理由 |
|---|---|---|
| 动效 | `framer-motion` 13.x | 需要 `AnimatePresence` 进出场、`layout` 自动补间与 `layoutId` 滑动指示器；纯 CSS 无法流畅实现退出动画与列表重排 |
| 样式 | CSS Modules + `--m-*` 设计令牌 | Vite 原生支持、零配置；需要 `:hover` / `@keyframes` / 媒体查询，内联 style 对象做不到 |
| 导航 | 常驻 72px 图标导轨 | 图标常显，没有 hover 展开，因此不需要防抖；指示条用 `layoutId` 在两项间平滑滑动 |

## 目录结构

```
src/
├── main.tsx                        React 入口
├── index.css                       基础重置（reset + body 字体）
├── App.tsx                         ThemeProvider → 错误边界 → ModernaApp
├── types/index.ts                  共享数据模型 + uid()
├── utils/                          共享工具：splitter.ts / diff.tsx / storage.ts
└── moderna/
    ├── ModernaApp.tsx              根组件：标签切换 + 设置面板 + Toast/Confirm 宿主
    ├── ModernaErrorBoundary.tsx    错误边界（重试 / 刷新页面）
    ├── styles/tokens.css           --m-* 设计令牌（浅色 + :root[data-theme="dark"]）
    ├── shell/                      Shell / TopBar / NavRail / PageShell（各含 .module.css）
    ├── ui/                         Button、IconButton、Chip、Card、Modal、ConfirmDialog、
    │                               ToastProvider、TextField、TextArea、Switch、
    │                               SegmentedControl、SearchInput、ProgressBar、EmptyState
    ├── motion/                     presets.ts / variants.ts / MotionRoot / useMotionKit
    ├── settings/                   ModernSettingsProvider / SettingsPanel /
    │                               AppearanceSection / DataSection
    ├── lib/                        ThemeProvider、download、useLocalSetting、useMediaQuery、
    │                               guidedStorage、sanitizeGuideConfig
    ├── chinese/                    文章列表 / 详情 / 记忆（含 memory/ 子目录）
    └── english/                    词书句书列表 / 详情 / 闪卡（含 memory/ 子目录）
```

## 分层职责

| 目录 | 职责 |
|---|---|
| `shell/` | 全局框架：`Shell` 用 CSS Grid 划分顶栏 / 导轨 / 主区；`TopBar` 品牌与全局操作；`NavRail` 导航；`PageShell` 页面头部与滚动内容区 |
| `ui/` | 无业务的基础原语，样式统一由 `.module.css` 提供；动效使用 framer-motion（`whileTap` 按压、`layoutId` 滑块、进度条/开关的 `animate`） |
| `motion/` | 时序预设（`presets.ts`）、转场变体（`variants.ts`）、动效强度根节点（`MotionRoot`）、取用与降级（`useMotionKit`） |
| `settings/` | `ModernSettingsProvider` 提供设置上下文与持久化；`SettingsPanel` 为弹窗容器，内含外观与数据两个分区 |
| `lib/` | 主题、JSON 下载/文件读取、localStorage 设置与媒体查询、指导记忆进度的存储与校验 |
| `chinese/`、`english/` | 业务模块：各自维护「列表 → 详情 → 记忆」视图状态与下钻转场，记忆逻辑收敛在 `memory/` 子目录 |

## 设计令牌

令牌全部使用 `--m-*` 前缀，收口在 `src/moderna/styles/tokens.css` 的 `:root` 下；
深色变体在 `:root[data-theme="dark"]` 中声明，属性由 `ThemeProvider` 写在 `<html>` 上。

| 分组 | 令牌 | 说明 |
|---|---|---|
| 表面 | `--m-bg-canvas` / `surface` / `subtle` / `inset` / `overlay` | 三层表面 + 内凹层 + 遮罩 |
| 强调色 | `--m-accent` / `-hover` / `-active` / `-soft` / `-border` / `-text` / `--m-on-accent` | 冷色系 |
| 文字 | `--m-text` / `-secondary` / `-muted` / `-inverse` | |
| 边框 | `--m-border` / `-strong` / `-accent` | |
| 语义色 | `--m-success` / `-soft`、`--m-danger` / `-soft`、`--m-warning` / `-soft` | |
| 阴影 | `--m-shadow-1` … `--m-shadow-4`、`--m-ring` | 双层阴影，逐级抬升 |
| 圆角 | `--m-r-sm` … `--m-r-2xl`、`--m-r-pill` | |
| 间距 | `--m-s-1` … `--m-s-12` | 4px 基准 |
| 字号 | `--m-fs-xs` … `--m-fs-4xl`、`--m-font-mono` | |
| 时序 | `--m-dur-fast` / `base` / `slow`、`--m-ease-out` / `in` / `std` | 与 `motion/presets.ts` 镜像，改一处需同步另一处 |
| 布局 | `--m-topbar-h: 60px`、`--m-rail-w: 72px` | |
| 滚动条 | `--m-scrollbar-thumb` / `-hover` | |

`tokens.css` 还包含少量全局覆盖：`body` 的背景/文字/行高与过渡、滚动条外观、
`:focus-visible` 焦点环。组件自身样式一律写在各自同名的 `.module.css` 中，不再新增全局 CSS 文件。

## 动效系统

### 时序预设（`src/moderna/motion/presets.ts`）

时序（弹簧 + 补间）是全应用唯一真源，想调整「这个应用动起来是什么手感」改这个文件即可。

| 预设 | 大致时长 | 用途 |
|---|---|---|
| `spring.snappy` | ~170ms | 点击、小元件、chip |
| `spring.nav` | ~240ms | 标签页切换、下钻、卡片换张 |
| `spring.soft` | ~320ms | 弹窗、抽屉、内联展开 |
| `spring.glide` | ~420ms | 进度条等大位移连续动画 |
| `tween.in` | 130ms | 退场（避免弹簧在卸载时回弹） |
| `tween.out` | 220ms | 揭示 |
| `tween.std` | 180ms | 遮罩等 |

### 转场变体（`src/moderna/motion/variants.ts`）

| 变体 | 转场 | 说明 |
|---|---|---|
| `tab` | 标签页切换 | 同级关系 → 横向 24px |
| `drill` | 列表 → 详情 → 记忆 | 层级关系 → 横向 28px + 1.5% 缩放（超过 3% 中文字形会在变换中明显闪烁） |
| `swap` | 记忆各模式互切 | 模式之间是同级，横向滑动会暗示错误层级 → 交叉淡入 + 8px 上浮 |
| `reveal` | 结果页 | 流程的情绪落点 → 更慢的弹簧 + 缩放 |
| `overlay` / `dialog` | 遮罩 / 弹窗 | 弹窗进入用弹簧「落位」，退出用补间求快 |
| `gridItem` | 网格项进出场 | 位置重排交给 `layout`，不用变体 |
| `card` | 闪卡换张 | 方向跟随推进方向（始终向前） |
| `collapse` | 行内揭示 | 错误答案框、词条编辑器展开 |
| `toast` | 提示 | 顶部滑入滑出 |
| `staggerParent` / `staggerChild` | 交错编排 | 父容器只负责时序 |

组件通过 `useMotionKit()` 取用这些变体；该 Hook 还会在系统开启「减少动态效果」时
把所有方向型变体替换为纯透明度过渡。

### 使用 `layout` 的三条硬规则

1. **固定尺寸网格项用 `layout="position"`**，不用 `layout`（避免子元素文字拉伸）。
2. **`layout` 与 `whileHover` / `whileTap` 绝不在同一元素上**（会互相打架产生抖动循环）——
   统一用两层：外层 `layout`，内层 hover/tap。文章卡片、书籍卡片、条目卡片都遵循这个结构。
3. **`layout` 子树内不能有 `position: fixed` 祖先**（framer 的投影树会测错）——
   故顶栏用 `sticky`，弹窗与 Toast 一律 portal 到 `document.body`。

### 无障碍

三层 `prefers-reduced-motion` 支持：

1. `MotionRoot` 用全局 `<MotionConfig reducedMotion>` 自动跳过 transform/layout 动画
   （把设置里的 `system` / `full` / `reduced` 映射为 framer 的 `user` / `never` / `always`）。
2. `useMotionKit()` 在 reduced 下把方向型变体换成极短的透明度过渡，保留"往哪走"的线索，
   并关闭交错编排。
3. 所有 CSS transition 都包在 `@media (prefers-reduced-motion: no-preference)` 内。

此外在设置 → 外观提供手动覆盖（`memoria:motion` = `system` / `full` / `reduced`）。

## 设置面板

- 顶栏右侧的 ⚙️ 打开 `SettingsPanel`：一个 `wide` 的 `Modal`，左侧为「外观 / 数据」分类列表，
  右侧渲染对应分区；点击遮罩、右上角 ✕ 或按 `Esc` 关闭。
- **外观**（`AppearanceSection`）只有三项：
  1. 颜色主题：浅色 / 深色
  2. 动效强度：跟随系统 / 完整动效 / 减弱动效
  3. 指导记忆：隐藏之前的句子
- **数据**（`DataSection`）：全量导出与全量导入（详见 [07-导入导出系统](07-导入导出系统.md)）。
- `ModernSettingsProvider` 通过 `useLocalSetting` 持久化设置，读取失败或值非法时一律回落到默认值：
  `memoria:hidePrevious`、`memoria:motion`。
- 导航导轨是常驻布局，没有悬浮展开，因此不提供「侧栏位置」「展开/收起方式」这类设置。

## 与共享数据层的关系

界面层依赖以下共享模块：

- `src/types/index.ts` —— 数据模型与 `uid()`
- `src/utils/storage.ts` —— localStorage 读写、全量导入导出
- `src/utils/splitter.ts` —— 句子切分与分隔符提取
- `src/utils/diff.tsx` —— 字符级差异比对

主题 Provider 也属于界面层，位于 `src/moderna/lib/ThemeProvider.tsx`。
记忆引擎的视图逻辑全部在 `src/moderna/` 内实现。

### 使用的存储键

| 键 | 说明 |
|---|---|
| `memoria:articles` / `memoria:wordBooks` / `memoria:sentenceBooks` | 业务数据 |
| `memoria:theme` | 颜色主题 |
| `memoria:hidePrevious` | 指导记忆「隐藏之前的句子」 |
| `memoria:motion` | 动效强度 |
| `memoria:guided:{id}:config` / `:step` / `:inputs` | 指导记忆进度 |

> `guidedStorage.ts` 的键名与键结构、`sanitizeGuideConfig.ts` 的校验规则都是**已持久化数据的契约**，
> 不可随意更改，否则用户已有的指导记忆进度会被判为非法而清空。

## 行为说明

| 项 | 当前行为 | 说明 |
|---|---|---|
| 提示与确认 | Toast / ConfirmDialog | 原生 `alert` / `confirm` 阻塞主线程，也就阻塞 `requestAnimationFrame`，动画会卡在半途 |
| 填空输入框 | 随内容增高（`BlankInput` 按 `scrollHeight` 自适应） | `rows={1}` + `overflow:hidden` 会把长句裁掉 |
| 词条编辑 | 就地内联展开（framer `layout`） | 布局交给浏览器、卸载交给 `AnimatePresence`，无需手写浮层定位 |
| 导航 | 常驻 72px 图标导轨，无 hover 展开 | 图标常显，不需要防抖，也没有展开宽度变化 |
| 记忆页退出 | 除按钮外支持 `Esc` 退一级 | 菜单层 `Esc` 直接返回列表 |
| 弹窗焦点 | 打开时聚焦弹窗、Tab 循环、关闭后归还焦点 | 由 `Modal` 统一处理 |

## 记忆逻辑的既定契约

以下行为是既有用户可见语义，改动需谨慎：

- 语文批改：`(输入).trim() === (正确).trim()`，仅 trim，区分大小写，不做标点归一化
- 英语闪卡批改：`trim().toLowerCase()` 比较
- 随机空格数：`Math.max(1, Math.ceil(n * Math.min(1, Math.max(0.01, ratio))))`，钳制顺序不可改
- 指定记忆的 Shift 范围选择只增不减
- 闪卡重测间隔 3–5 张；`done` 只计首次答对（故进度条可能停在 100% 以下）
- 指导记忆的 AI 提示词模板保持原样（用户可能已收藏该模板）
- 指导记忆进度的存储键与配置校验规则保持不变

## 已知取舍

- **产物体积**：framer-motion 使 gzip 增加约 65KB，且未做代码分割。
  若要优化，可对 `ModernaApp` 使用 `React.lazy` + `Suspense`；但 `layout` / `layoutId`
  需要 `domMax` 特性包，改用 `LazyMotion` 省不下多少。
- **没有图标库**：沿用 emoji；导航图标包进固定 `1.25em` 的 inline-block 以对齐基线。
- **错误边界兜底页使用内联样式**：不依赖组件树与样式表，坏情况下仍能显示与操作。
