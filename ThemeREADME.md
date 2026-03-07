# LiteASCII · 技术总结

## 技术栈

| 层级     | 选型                            | 说明                       |
| -------- | ------------------------------- | -------------------------- |
| 框架     | Astro 5                         | SSG 静态生成，Islands 架构 |
| 交互组件 | Svelte 5                        | 导航栏、图谱、ASCII 动画   |
| 样式     | Tailwind CSS v4 + CSS Variables | 全局 token + 组件局部样式  |
| 内容管理 | Astro Content Collections       | 类型安全的 Markdown 处理   |
| 搜索     | Pagefind                        | 构建后自动生成全文索引     |

---

## 核心架构

### Islands 渲染策略

```
HTML（Astro SSG）
├── Navigation.svelte     [client:load]    ← 导航栏，需要立即交互
├── AsciiArt.svelte       [client:only]    ← 纯客户端动画，跳过SSR
└── ObsidianGraph.svelte  [client:only]    ← Canvas绘图，跳过SSR
```

**关键决策**：ObsidianGraph 使用 `client:only="svelte"` 而非 `client:load`。
原因：组件内使用 `requestAnimationFrame` / `cancelAnimationFrame` 等浏览器 API，Astro 的 SSR 阶段（Node.js 环境）没有 `window`，使用 `client:only` 完全跳过服务端渲染，避免 `cancelAnimationFrame is not defined` 错误。

---

### 主题系统

**核心原则：暗色为默认（CSS `:root`），亮色用属性覆盖**

```css
/* 暗色 = 默认，无需任何属性 */
:root {
  --bg: #161618;
  --red: #e74c3c;
  /* ... */
}

/* 亮色 = 显式属性覆盖 */
[data-theme="light"] {
  --bg: #f9f9f7;
  --red: #c0392b;
  /* ... */
}
```

**防闪烁脚本**（Layout.astro inline script，在 HTML 解析时同步执行）：

```js
(function () {
  const stored = localStorage.getItem('theme');
  if (stored === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  // 无需处理 dark，CSS :root 已是暗色
})();
```

---

### Obsidian 关系图谱构建

**数据来源**：构建时（SSG），`index.astro` 读取所有笔记内容，在服务端解析 wikilinks：

```js
// 1. 建立文件名→索引的映射表（O(n)）
const byName = new Map();
notes.forEach((note, i) => {
  const name = note.id.replace(/\.md$/, '').split('/').pop().toLowerCase();
  byName.set(name, i);
});

// 2. 遍历所有笔记，匹配 [[wikilink]] 格式
const re = /\[\[([^\]|#]+)/g;  // 支持 [[name]] [[name|alias]] [[name#heading]]
```

**力导向物理模拟**（纯原生 Canvas + requestAnimationFrame，无第三方图形库）：

- 斥力：所有节点对互相排斥（O(n²) 但节点数少，可接受）
- 引力：有连线的节点向目标长度收敛
- 中心力：防止节点飞离中心
- 边界力：软约束，将节点限制在圆内
- 慢化：200 tick 后每 6 帧才运行一次物理，降低 CPU 占用

---

### Content Collections + 标题提取策略

Obsidian 笔记大多没有 Front Matter，标题在正文第一行。内容集合配置放宽了约束：

```ts
// src/content/config.ts
const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string().optional(),        // 优先使用 FM 标题
    date: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
  }),
});
```

标题解析优先级：

```js
function getTitle(note) {
  if (note.data.title) return note.data.title;        // 1. Front Matter
  const match = note.body?.match(/^#\s+(.+)/m);       // 2. 正文第一个 # 标题
  if (match) return match[1].trim();
  return note.id.split('/').pop().replace(/\.md$/, ''); // 3. 文件名 fallback
}
```

---

### 笔记详情页 ToC 布局

使用 CSS `:has()` 伪类（现代浏览器原生支持）实现"有 ToC 时双栏，无 ToC 时单栏"：

```css
/* 有 .toc-sidebar 子元素时切换为双栏 Grid */
.note-layout:has(.toc-sidebar) {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 3rem;
}
```

---

### Pagefind 搜索集成

```js
// astro.config.mjs
import pagefind from 'astro-pagefind';
export default defineConfig({
  integrations: [svelte(), pagefind()],  // 构建后自动索引 data-pagefind-body
});
```

笔记详情页标记可索引区域：

```html
<article data-pagefind-body>
  <h1 data-pagefind-meta="title">...</h1>
  <!-- 内容 -->
</article>
```

运行时按需加载（dev 模式下 /_pagefind/ 不存在，优雅降级）：

```js
fetch('/_pagefind/pagefind-ui.js').then(r => {
  if (r.ok) { /* 动态插入 script */ }
}).catch(() => {});  // dev 模式下静默失败
```

---

## 目录结构

```
src/
├── components/
│   ├── ascii/
│   │   └── TypeWriter.svelte    ← 可替换的动画组件
│   ├── AsciiArt.svelte          ← 动画容器（修改 import 切换动画）
│   ├── ObsidianGraph.svelte     ← Canvas 力导向关系图谱
│   ├── Navigation.svelte        ← 导航栏（主题/搜索/移动端）
│   ├── PostCard.astro           ← 笔记卡片
│   └── Footer.astro
├── content/
│   └── notes/                   ← Obsidian 笔记放这里
├── layouts/
│   └── Layout.astro             ← 全局 HTML 骨架 + 主题脚本
├── pages/
│   ├── index.astro              ← 主页（Hero + 图谱 + 最近笔记）
│   ├── notes/
│   │   ├── index.astro          ← 笔记列表（按目录分组）
│   │   └── [...slug].astro      ← 笔记详情（动态路由）
│   ├── timeline.astro           ← 时间轴（按日期分组）
│   ├── thoughts.astro           ← 随想（按标签过滤）
│   └── about.astro
└── styles/
    └── global.css               ← CSS 变量系统 + Prose 排版
```

---

## 关键技术决策记录

| 问题       | 方案                       | 原因                                                 |
| ---------- | -------------------------- | ---------------------------------------------------- |
| 图谱库选型 | 纯原生 Canvas              | 无第三方依赖，体积小；节点数有限，O(n²) 可接受      |
| 动画 SSR   | `client:only="svelte"`   | 避免 Node.js 环境调用 `requestAnimationFrame` 报错 |
| 主题默认值 | CSS `:root` 直接写暗色   | 减少 JS 介入，CSS 本身即默认，防止亮色闪烁           |
| 标题提取   | 正则匹配正文 `# heading` | 兼容无 Front Matter 的 Obsidian 笔记                 |
| 搜索引擎   | Pagefind                   | 静态生成，零服务端，索引自动构建                     |
| 布局自适应 | CSS `:has()`             | 根据子元素存在性切换布局，无需 JS                    |
