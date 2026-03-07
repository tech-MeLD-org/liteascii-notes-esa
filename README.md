# LiteASCII — Obsidian 知识库主题

> 红黑简约风格，ASCII 动画 + Obsidian 关系图谱 + 全文搜索。
> 基于 **Astro 5 · Svelte 5 · Tailwind CSS v4** 构建。

**站点示例**：LiteASCII (个人知识库)

---

## 快速开始

```bash
pnpm install
pnpm dev        # 开发模式 → http://localhost:4321
pnpm build      # 生产构建（含 Pagefind 全文索引）
pnpm preview    # 预览生产版本
```

---

## 笔记管理

### 目录结构

```
src/content/
└── notes/                 ← 笔记根目录（保持 Obsidian 原始结构）
    ├── 700-笔记/
    │   ├── attachments/   ← 附件与笔记同级子文件夹
    │   │   └── image.png
    │   ├── 哈希表.md
    │   └── python基础.md
    └── 其他文件夹/
```

将 Obsidian Vault 内容（Markdown + 附件）同步到 `src/content/notes/` 即可。

### Front Matter（可选）

```yaml
---
title: 文章标题          # 不填则自动取正文第一个 # 标题
date: 2026-01-15         # 用于 Timeline 排序
description: 一句话摘要  # 用于卡片摘要
tags: [python, 基础]     # 用于标签和 Thoughts 筛选
---
```

### 图片路径格式

```markdown
![[attachments/subfolder/image.png]]     ← Obsidian Wiki 格式
![描述](attachments/image%20name.png)   ← 标准 Markdown 格式
```

附件必须放在**与笔记同级**的 `attachments/` 文件夹内。

---

## 功能说明

### 主页布局

| 区域      | 内容                                      |
| --------- | ----------------------------------------- |
| 导航栏    | Logo · 页面链接 · 搜索(⌘K) · 主题切换 |
| 左侧 Hero | TypeWriter ASCII 动画（可替换）           |
| 右侧 Hero | Obsidian 内链关系圆形图谱                 |
| 下方      | 最近 6 篇笔记卡片                         |

### 关系图谱

解析笔记中的 `[[wikilinks]]` 自动构建节点和连线，悬停显示标题，**点击跳转到对应文章**。

### Timeline

- 有 `date` 字段 → 按年分组，点击卡片跳转文章
- 无 `date` 字段 → 显示在"未标日期的笔记"区块

### Thoughts 页面

显示带有 `thoughts` 标签或路径含 `thought` 的笔记。可在 `src/pages/thoughts.astro` 中修改过滤逻辑。

### 全文搜索

由 [Pagefind](https://pagefind.app/) 提供，**仅 `pnpm build` 后可用**，快捷键 `Ctrl+K` / `⌘K`。

### 主题切换

默认暗色（红黑），点击导航栏 ☀ 切换亮色，偏好持久化至 `localStorage`。

### 更换 ASCII 动画

打开 `src/components/AsciiArt.svelte`，替换 import 即可：

```svelte
import TypeWriter from './ascii/TypeWriter.svelte';
// import MatrixRain from './ascii/MatrixRain.svelte';
```

---

## 部署

```bash
pnpm build   # 产物在 dist/
# 上传 dist/ 到 Vercel / Netlify / 阿里云 OSS / GitHub Pages
```
