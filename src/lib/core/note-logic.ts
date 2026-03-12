/**
 * LiteASCII 核心逻辑层
 * 统一接管所有笔记相关的逻辑处理
 * 整合自: src/utils/note-logic.ts, src/lib/utils/note.ts, src/lib/utils/path.ts
 */

import type { NoteCollectionItem, NoteCardData, NoteFrontmatter } from '../../types/note';

// ==========================================
// 1. Slug / 路径处理
// ==========================================

/**
 * 路径转 Slug（全站统一规则）
 * 关键规则：小数点转为横杠
 */
export function pathToSlug(filePath: string): string {
  return filePath
    .replace(/\.md$/i, '')
    .split('/')
    .map((seg) =>
      seg
        .toLowerCase()
        .replace(/\./g, '-') // 小数点 → 横杠（关键规则）
        .replace(/\s+/g, '-')
        .replace(/[^\w\u4e00-\u9fff\u3400-\u4dbf-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    )
    .join('/');
}

/**
 * 笔记 ID 转 slug（兼容性包装）
 */
export function noteSlug(noteId: string): string {
  return pathToSlug(noteId);
}

/**
 * 标签转 slug
 */
export function tagSlug(tag: string): string {
  return encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'));
}

/**
 * 分类转 slug
 */
export function categorySlug(category: string): string {
  return encodeURIComponent(category.toLowerCase().replace(/\s+/g, '-'));
}

// ==========================================
// 2. 标题与元数据提取
// ==========================================

/**
 * 获取笔记标题（统一规则）
 * 优先级：Frontmatter title → 第一个 H1 → 文件名
 */
export function getNoteTitle(note: NoteCollectionItem | { id: string; data: any; body?: string }): string {
  if (note.data?.title) return note.data.title;
  const match = note.body?.match(/^#\s+(.+)/m);
  if (match) return match[1].trim();
  const fileName = note.id.split('/').pop()?.replace(/\.md$/, '');
  return fileName || 'Untitled';
}

/**
 * 提取标题（别名，兼容旧代码）
 */
export const extractTitle = getNoteTitle;

// ==========================================
// 3. 日期格式化
// ==========================================

/**
 * 格式化日期为中文格式
 */
export function formatDate(dateVal: Date | string | undefined): string | undefined {
  if (!dateVal) return undefined;
  const date = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// ==========================================
// 4. 数据过滤与排序
// ==========================================

/**
 * 过滤可见笔记（排除附件文件夹）
 */
export function isVisibleNote(note: NoteCollectionItem): boolean {
  return !note.id.startsWith('attachments/') && !note.id.includes('/attachments/');
}

/**
 * 按日期降序排序
 */
export function sortByDate<T extends { data: { date?: Date | string } }>(notes: T[]): T[] {
  return [...notes].sort((a, b) => {
    const da = a.data.date ? new Date(a.data.date).getTime() : 0;
    const db = b.data.date ? new Date(b.data.date).getTime() : 0;
    return db - da;
  });
}

// ==========================================
// 5. 数据统计
// ==========================================

/**
 * 统计分类数量
 */
export function countCategories(notes: NoteCollectionItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  notes.forEach((note) => {
    const category = note.data.category || '未分类';
    counts.set(category, (counts.get(category) || 0) + 1);
  });
  return counts;
}

/**
 * 统计标签数量
 */
export function countTags(notes: NoteCollectionItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  notes.forEach((note) => {
    (note.data.tags || []).forEach((tag) => {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    });
  });
  return counts;
}

// ==========================================
// 6. 数据转换
// ==========================================

/**
 * 笔记集合项 → 卡片数据
 */
export function toNoteCardData(note: NoteCollectionItem): NoteCardData {
  return {
    title: getNoteTitle(note),
    href: `/notes/${noteSlug(note.id)}`,
    date: formatDate(note.data.date),
    description: note.data.description,
    category: note.data.category,
    tags: note.data.tags || [],
  };
}

// ==========================================
// 7. 目录树构建（用于 DirectoryGraph）
// ==========================================

export interface DirectoryNode {
  id: string;
  label: string;
  type: 'folder' | 'file';
  parentId: string | null;
  href?: string | null;
}

/**
 * 构建目录树结构
 */
export function buildDirectoryTree(notes: NoteCollectionItem[]): DirectoryNode[] {
  const dirNodes: DirectoryNode[] = [];
  const addedPaths = new Set<string>();

  // 虚拟根节点
  dirNodes.push({
    id: 'root',
    label: 'LiteASCII Universe',
    type: 'folder',
    parentId: null,
    href: null,
  });

  notes.forEach((note) => {
    const parts = note.id.split('/');
    let currentPath = '';
    let parentId: string = 'root';

    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!addedPaths.has(currentPath)) {
        addedPaths.add(currentPath);
        dirNodes.push({
          id: currentPath,
          label: isFile ? getNoteTitle(note) : part.replace(/\.md$/, ''),
          type: isFile ? 'file' : 'folder',
          parentId: parentId,
          href: isFile ? `/notes/${pathToSlug(note.id)}` : null,
        });
      }
      parentId = currentPath;
    });
  });

  return dirNodes;
}

// ==========================================
// 8. 引用关系图构建（用于 ReferenceGraph）
// ==========================================

export interface GraphNode {
  id: number;
  label: string;
  href: string;
}

export interface GraphEdge {
  source: number;
  target: number;
}

export interface ReferenceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * 构建引用关系图
 */
export function buildReferenceGraph(notes: NoteCollectionItem[]): ReferenceGraph {
  const nodeList: GraphNode[] = notes.map((note, i) => ({
    id: i,
    label: getNoteTitle(note),
    href: '/notes/' + pathToSlug(note.id),
  }));

  // 建立索引映射
  const nameToIndex = new Map<string, number>();
  notes.forEach((n, i) => {
    const rawId = n.id.replace(/\.md$/, '');
    const fileName = rawId.split('/').pop() || '';

    // 多种匹配 key
    nameToIndex.set(fileName, i);
    nameToIndex.set(decodeURIComponent(fileName), i);
    nameToIndex.set(pathToSlug(fileName), i);
  });

  const edgeList: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  notes.forEach((note, srcIdx) => {
    if (!note.body) return;

    // 匹配 [[Wiki]] 和 [MD](path) 链接
    const linkRegex = /\[\[(.*?)\]\]|\[.*?\]\((.*?)\)/g;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(note.body)) !== null) {
      const rawTarget = (match[1] || match[2] || '').split('#')[0].trim();
      if (!rawTarget || rawTarget.startsWith('http') || rawTarget.match(/\.(png|jpg|pdf)$/i)) continue;

      const targetFileName = rawTarget.split('/').pop()?.replace(/\.md$/, '') || '';
      let decodedTarget = targetFileName;
      try {
        decodedTarget = decodeURIComponent(targetFileName);
      } catch (e) {
        // 解码失败使用原值
      }

      // 多策略匹配
      const targetIdx =
        nameToIndex.get(targetFileName) ??
        nameToIndex.get(decodedTarget) ??
        nameToIndex.get(pathToSlug(decodedTarget));

      if (targetIdx !== undefined && targetIdx !== srcIdx) {
        const edgeKey = [Math.min(srcIdx, targetIdx), Math.max(srcIdx, targetIdx)].join('-');
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edgeList.push({ source: srcIdx, target: targetIdx });
        }
      }
    }
  });

  return { nodes: nodeList, edges: edgeList };
}

// ==========================================
// 9. 通用路径工具
// ==========================================

/**
 * 连接 URL 路径
 */
export function joinPath(...parts: string[]): string {
  return parts
    .map((part, i) => {
      if (i === 0) return part.replace(/\/+$/, '');
      if (i === parts.length - 1) return part.replace(/^\/+/, '');
      return part.replace(/^\/+|\/+$/g, '');
    })
    .filter(Boolean)
    .join('/');
}

/**
 * 确保路径以 / 开头
 */
export function ensureLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * 确保路径不以 / 结尾（根路径除外）
 */
export function ensureNoTrailingSlash(path: string): string {
  return path === '/' ? path : path.replace(/\/+$/, '');
}

/**
 * 规范化路径
 */
export function normalizePath(path: string): string {
  return ensureNoTrailingSlash(ensureLeadingSlash(path));
}

/**
 * 从文件路径获取文件名
 */
export function getFileName(path: string): string {
  return path.split('/').pop() || '';
}

/**
 * 从文件路径获取目录名
 */
export function getDirName(path: string): string {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/') || '/';
}